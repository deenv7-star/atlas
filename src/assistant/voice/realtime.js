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

/** Mic peak (0..1, after the worklet's ×1.6) above which the owner is talking over atlas. */
export const BARGE_IN_LEVEL = 0.32;
/** Server error codes that end the conversation. Everything else (e.g. a response.create that raced an
 *  active response) is logged and ignored: one hiccup must never close the call. */
export const FATAL_ERRORS = new Set(['session_expired', 'invalid_api_key', 'authentication_error', 'unauthorized', 'session_not_found', 'invalid_client_secret']);
/** After the owner stops talking, how long to wait for atlas to start answering before nudging it once. */
export const ANSWER_WATCHDOG_MS = 3500;

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
    this.node.port.onmessage = (e) => {
      const lv = e.data.level || 0;
      this.level = this.level * 0.6 + lv * 0.4;
      // Echo gate: while atlas speaks, the phone speaker leaks into the mic (WKWebView does not echo-cancel
      // Web Audio playback). Unless the owner is clearly talking over it, send silence so atlas does not
      // "hear itself", cut its own answer and then answer nothing. A real barge-in is loud and still goes through.
      const gate = this.speaking && lv < BARGE_IN_LEVEL;
      this.onChunk?.(gate ? new Int16Array(e.data.pcm.byteLength / 2).buffer : e.data.pcm);
    };
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
    this.active = false;      // a response is in progress on the server
    this.toolOutputs = 0;     // outputs sent since the last response; answer them once the response is done
    this.watch = 0;           // watchdog timer: a turn that got no answer
    this.nudged = false;
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
    this.respond();
  }
  /** Ask for an answer only when none is running (a second response.create errors on the server). */
  respond() {
    if (this.active) { this.toolOutputs = Math.max(this.toolOutputs, 1); return; }
    this.active = true; this.send({ type: 'response.create' });
  }
  /** The owner finished a turn: if atlas has not started answering soon, nudge once, then let the UI say so. */
  arm() {
    clearTimeout(this.watch); this.nudged = false;
    this.watch = setTimeout(() => {
      if (this.active || this.pendingTools) return;
      this.nudged = true; this.respond();
      this.watch = setTimeout(() => { if (!this.active && !this.pendingTools) this.on.state?.('listening'); this.on.unanswered?.(); }, ANSWER_WATCHDOG_MS);
    }, ANSWER_WATCHDOG_MS);
  }
  async handle(ev) {
    const { on } = this;
    switch (ev.type) {
      case 'input_audio_buffer.speech_started': clearTimeout(this.watch); this.audio.flush(); on.state?.('hearing'); break;
      case 'input_audio_buffer.speech_stopped': on.state?.('thinking'); this.arm(); break;
      case 'conversation.item.input_audio_transcription.completed': if (ev.transcript) on.user?.(cleanCaption(ev.transcript).trim()); break;
      case 'response.created': this.active = true; clearTimeout(this.watch); break;
      case 'response.output_audio.delta': case 'response.audio.delta': clearTimeout(this.watch); on.state?.('speaking'); this.audio.play(unb64(ev.delta)); break;
      case 'response.output_audio_transcript.delta': case 'response.audio_transcript.delta':
        this.atlasText += ev.delta || ''; on.atlas?.(cleanCaption(this.atlasText), false); break;
      case 'response.output_audio_transcript.done': case 'response.audio_transcript.done':
        on.atlas?.(cleanCaption(ev.transcript || this.atlasText).trim(), true); this.atlasText = ''; break;
      case 'response.function_call_arguments.done': {
        this.pendingTools += 1; clearTimeout(this.watch); on.state?.('thinking');
        let output;
        try { output = await on.tool?.(ev.name, ev.arguments, ev.call_id); } catch { output = { error: 'lookup_failed', say: 'אמרו שלא הצלחתם לבדוק כרגע והציעו צעד אחר.' }; }
        this.send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: ev.call_id, output: JSON.stringify(output ?? {}) } });
        this.pendingTools -= 1; this.toolOutputs += 1;
        // answer the tool results once: now if the model's response already ended, else on response.done
        if (!this.pendingTools && !this.active) { this.toolOutputs = 0; this.respond(); }
        break;
      }
      case 'response.done': {
        this.active = false;
        const st = ev.response?.status;
        if (this.toolOutputs && !this.pendingTools) { this.toolOutputs = 0; this.respond(); break; }
        if (this.pendingTools) break;
        // a response that ended with no words (failed / cut / empty): ask once more instead of leaving silence
        const said = (ev.response?.output || []).some((o) => o.type === 'function_call' || (o.content || []).some((c) => c.transcript || c.text));
        if ((st === 'failed' || st === 'incomplete' || !said) && st !== 'cancelled' && !this.nudged) { this.nudged = true; this.respond(); break; }
        setTimeout(() => { if (!this.audio.speaking && !this.active) on.state?.('listening'); }, 120);
        break;
      }
      case 'error': {
        const code = ev.error?.code || ev.error?.type || '';
        if (FATAL_ERRORS.has(code)) { on.error?.(code === 'session_expired' ? 'expired' : 'upstream', ev.error); break; }
        if (/active_response|already has an active response/i.test(`${code} ${ev.error?.message || ''}`)) this.active = true;
        console.warn('[atlas voice] ignored', code || ev.error?.message); // eslint-disable-line no-console
        break;
      }
      default: break;
    }
  }
  close() { clearTimeout(this.watch); this.closedByUs = true; try { this.ws.close(1000); } catch { /* */ } }
}
