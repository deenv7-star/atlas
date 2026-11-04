// atlas voice: microphone → PCM16 mono 24 kHz chunks (~40 ms) for the realtime socket. Also reports a level 0..1.
// Served from /public so CSP script-src 'self' covers it (no blob: worklets).
class AtlasCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 24000;
    this.pos = 0;
    this.out = new Int16Array(960);
    this.n = 0;
    this.peak = 0;
    this.muted = false;
    this.port.onmessage = (e) => { if (e.data && 'muted' in e.data) this.muted = !!e.data.muted; };
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i += 1) { const a = Math.abs(ch[i]); if (a > this.peak) this.peak = a; }
    // linear resample to 24 kHz
    while (this.pos < ch.length) {
      const i = Math.floor(this.pos); const f = this.pos - i;
      const s = i + 1 < ch.length ? ch[i] * (1 - f) + ch[i + 1] * f : ch[i];
      const v = this.muted ? 0 : Math.max(-1, Math.min(1, s));
      this.out[this.n++] = v < 0 ? v * 0x8000 : v * 0x7fff;
      if (this.n === this.out.length) {
        this.port.postMessage({ pcm: this.out.buffer, level: this.muted ? 0 : Math.min(1, this.peak * 1.6) }, [this.out.buffer]);
        this.out = new Int16Array(960); this.n = 0; this.peak = 0;
      }
      this.pos += this.ratio;
    }
    this.pos -= ch.length;
    return true;
  }
}
registerProcessor('atlas-capture', AtlasCapture);
