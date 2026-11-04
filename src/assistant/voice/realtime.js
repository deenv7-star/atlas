/**
 * The browser end of a voice conversation with Eleven Realtime (OpenAI-Realtime-compatible WebSocket).
 *   - auth: the short-lived client secret from voice-session, as the browser subprotocol
 *     ["realtime", "openai-insecure-api-key.<secret>"] (verified against api.elevenlabs.io on 04.11.2026)
 *   - audio in: mic → AudioWorklet (public/voice-capture-worklet.js) → PCM16 24 kHz → input_audio_buffer.append
 *   - audio out: response.output_audio.delta (PCM16 24 kHz) → scheduled AudioBuffers; cut when the owner talks over it
 *   - tools: response.function_call_arguments.done → onTool(name, args) → function_call_output + response.create
 * No React here. One instance = one socket; the hook (useVoiceSession.js) renews slices with a new instance.
 */
import { takePrimedAudio } from './prime.js';

const b64 = (buf) => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (str) => { const bin = atob(str); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i += 1) u[i] = bin.charCodeAt(i); return u.buffer; };
/** Eleven Realtime transcripts carry expressive tags ("[Warm] …"): never show them. */
export const cleanCaption = (t) => String(t || '').replace(/\[[^\]]{1,24}\]\s*/g, '').replace(/\s{2,}/g, ' ');

/** Shared audio graph: one AudioContext + mic for the whole conversation (sockets come and go). */
export class VoiceAudio {
  constructor() { this.ctx = null; this.stream = null; this.node = null; this.onChunk = null; this.level = 0; this.outLevel = 0; this.nextTime = 0; this.sources = new Set(); this.muted = false; }

  /** Must run inside the tap that opened voice (iOS unlocks audio only from a user gesture). */
  async start() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !navigator.mediaDevices?.getUserMedia) { const e = new Error('mic_missing'); e.code = 'mic_missing'; throw e; }
    this.ctx = takePrimedAudio();
    if (!this.ctx) { try { this.ctx = new AC({ sampleRate: 24000 }); } catch { this.ctx = new AC(); } }
    if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => {});
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    } catch (err) {
      const e = new Error('mic'); e.code = /NotFound|Overconstrained/.test(err?.name) ? 'mic_missing' : 'mic_denied'; throw e;
    }
    await this.ctx.audioWorklet.addModule('/voice-capture-worklet.js');
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, 'atlas-capture');
    this.node.port.onmessage = (e) => { this.level = this.level * 0.6 + (e.data.level || 0) * 0.4; this.onChunk?.(e.data.pcm); };
    src.connect(this.node);
    this.out = this.ctx.createGain(); this.out.connect(this.ctx.destination);
    this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 256; this.out.connect(this.analyser);
    this.buf = new Uint8Array(this.analyser.fftSize);
  }

  setMuted(m) { this.muted = !!m; this.node?.port.postMessage({ muted: this.muted }); if (this.muted) this.level = 0; }

  /** Queue PCM16 24 kHz from the model. */
  play(pcm) {
    if (!this.ctx) return;
    const i16 = new Int16Array(pcm);
    const ab = this.ctx.createBuffer(1, i16.length, 24000);
    const ch = ab.getChannelData(0);
    for (let i = 0; i < i16.length; i += 1) ch[i] = i16[i] / 0x8000;
    const s = this.ctx.createBufferSource(); s.buffer = ab; s.connect(this.out);
    const at = Math.max(this.ctx.currentTime + 0.03, this.nextTime);
    s.start(at); this.nextTime = at + ab.duration;
    this.sources.add(s); s.onended = () => this.sources.delete(s);
  }
  /** The owner started talking: stop atlas mid-sentence. */
  flush() { for (const s of this.sources) { try { s.stop(); } catch { /* done */ } } this.sources.clear(); this.nextTime = 0; }
  get speaking() { return this.sources.size > 0; }
  /** 0..1 loudness of what atlas is saying (for the face / bars). */
  readOut() {
    if (!this.analyser) return 0;
    this.analyser.getByteTimeDomainData(this.buf);
    let peak = 0; for (let i = 0; i < this.buf.length; i += 1) peak = Math.max(peak, Math.abs(this.buf[i] - 128));
    this.outLevel = this.outLevel * 0.7 + Math.min(1, peak / 64) * 0.3; return this.outLevel;
  }
  stop() {
    this.flush();
    try { this.node?.disconnect(); } catch { /* */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close().catch(() => {});
    this.ctx = null; this.stream = null; this.node = null;
  }
}

/**
 * new RealtimeLink({ secret, url, model, audio, on: { open, state, user, atlas, tool, closed, error } })
 * state: 'listening' | 'hearing' | 'thinking' | 'speaking'
 */
export class RealtimeLink {
  constructor({ secret, url, model, audio, on }) {
    this.on = on; this.audio = audio; this.closedByUs = false; this.atlasText = ''; this.pendingTools = 0;
    this.ws = new WebSocket(`${url}?model=${encodeURIComponent(model)}`, ['realtime', `openai-insecure-api-key.${secret}`]);
    this.ws.onopen = () => on.open?.();
    this.ws.onmessage = (m) => { let ev; try { ev = JSON.parse(m.data); } catch { return; } this.handle(ev); };
    this.ws.onerror = () => on.error?.('network');
    this.ws.onclose = (e) => on.closed?.({ code: e.code, byUs: this.closedByUs });
  }
  get open() { return this.ws.readyState === 1; }
  send(obj) { if (this.open) this.ws.send(JSON.stringify(obj)); }
  /** Mic chunks go to whichever link is current (the hook re-points audio.onChunk on renewal). */
  pushAudio(pcm) { this.send({ type: 'input_audio_buffer.append', audio: b64(pcm) }); }
  /** Seed a renewed slice with what was said (text items, no audio). */
  seed(turns) {
    for (const t of turns.slice(-6)) {
      this.send({ type: 'conversation.item.create', item: { type: 'message', role: t.role === 'user' ? 'user' : 'assistant', content: [{ type: t.role === 'user' ? 'input_text' : 'output_text', text: t.text.slice(0, 600) }] } });
    }
  }
  sayText(text) { // typed fallback inside a voice session
    this.send({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } });
    this.send({ type: 'response.create' });
  }
  async handle(ev) {
    const { on } = this;
    switch (ev.type) {
      case 'input_audio_buffer.speech_started': this.audio.flush(); on.state?.('hearing'); break;
      case 'input_audio_buffer.speech_stopped': on.state?.('thinking'); break;
      case 'conversation.item.input_audio_transcription.completed': if (ev.transcript) on.user?.(cleanCaption(ev.transcript).trim()); break;
      case 'response.output_audio.delta': case 'response.audio.delta': on.state?.('speaking'); this.audio.play(unb64(ev.delta)); break;
      case 'response.output_audio_transcript.delta': case 'response.audio_transcript.delta':
        this.atlasText += ev.delta || ''; on.atlas?.(cleanCaption(this.atlasText), false); break;
      case 'response.output_audio_transcript.done': case 'response.audio_transcript.done':
        on.atlas?.(cleanCaption(ev.transcript || this.atlasText).trim(), true); this.atlasText = ''; break;
      case 'response.function_call_arguments.done': {
        this.pendingTools += 1; on.state?.('thinking');
        let output;
        try { output = await on.tool?.(ev.name, ev.arguments, ev.call_id); } catch { output = { error: 'lookup_failed' }; }
        this.send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: ev.call_id, output: JSON.stringify(output ?? {}) } });
        this.pendingTools -= 1;
        if (!this.pendingTools) this.send({ type: 'response.create' });
        break;
      }
      case 'response.done': if (!this.pendingTools) setTimeout(() => { if (!this.audio.speaking) on.state?.('listening'); }, 120); break;
      case 'error': on.error?.(ev.error?.code === 'session_expired' ? 'expired' : 'upstream', ev.error); break;
      default: break;
    }
  }
  close() { this.closedByUs = true; try { this.ws.close(1000); } catch { /* */ } }
}
