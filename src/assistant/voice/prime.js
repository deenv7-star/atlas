/**
 * iOS (Safari and the Capacitor WKWebView) only lets audio start inside the tap itself. The mic button calls
 * primeVoiceAudio() synchronously in its click handler; the voice screen (lazy-loaded a moment later) takes it.
 */
let primed = null;
export function primeVoiceAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!primed || primed.state === 'closed') { try { primed = new AC({ sampleRate: 24000 }); } catch { primed = new AC(); } }
    primed.resume?.().catch(() => {});
  } catch { /* no audio */ }
}
export function takePrimedAudio() { const c = primed; primed = null; return c && c.state !== 'closed' ? c : null; }
