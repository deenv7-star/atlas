/**
 * The entry point: the header button "דברו עם atlas" and the open/closed state of the assistant screen.
 * v2 (04.11.2026): a tap opens straight into a live voice conversation (the tap itself unlocks audio on iOS);
 * the screen has an obvious switch to writing, and falls back to writing when the mic is not available.
 * Tiny on purpose (no markdown, no data): the screen itself is lazy-loaded on first open.
 */
import React, { useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { VOICE_ENABLED } from './voice/config.js';
import { primeVoiceAudio } from './voice/prime.js';
import './launcher.css';

let open = false;
let everOpened = false;
let opener = null;
let mode = 'voice'; // 'voice' | 'text': how the screen opens
const subs = new Set();
const emit = () => subs.forEach((s) => s());
// review builds: ?voiceShot=<state> opens the screen frozen in that state (demo data only; see useVoiceSession)
if (typeof window !== 'undefined' && /[?&]voiceShot=/.test(window.location.search)) { open = true; everOpened = true; mode = /voiceShot=text/.test(window.location.search) ? 'text' : 'voice'; }
export const assistantMode = () => mode;
/** Open the assistant. `how`: 'voice' (default, when voice is on) | 'text'. Call inside the tap. */
export function openAssistant(how = 'voice', from = null) {
  mode = how === 'text' || !VOICE_ENABLED ? 'text' : 'voice';
  if (mode === 'voice') primeVoiceAudio();
  setAssistantOpen(true, from);
}
export function setAssistantOpen(v, from) {
  open = !!v;
  if (open) { everOpened = true; if (from) opener = from; }
  if (typeof document !== 'undefined') document.documentElement.toggleAttribute('data-assistant-open', open);
  emit();
  if (!open && opener) { const el = opener; setTimeout(() => el?.focus?.(), 0); }
}
const subscribe = (cb) => { subs.add(cb); return () => subs.delete(cb); };
export function useAssistantOpen() {
  const isOpen = useSyncExternalStore(subscribe, () => open, () => false);
  const mounted = useSyncExternalStore(subscribe, () => everOpened, () => false);
  return { isOpen, mounted };
}

/** Five calm bars: reads as "talk" at a glance, not as a sparkle. */
function VoiceGlyph() {
  return (
    <svg className="as-open-glyph" viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      {[[4, 10, 14], [8, 7, 17], [12, 4, 20], [16, 7, 17], [20, 10, 14]].map(([x, y1, y2]) => <path key={x} d={`M${x} ${y1}V${y2}`} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />)}
    </svg>
  );
}

export function AskAtlasButton({ className = '' }) {
  const { isOpen } = useAssistantOpen();
  const { pathname } = useLocation();
  if (pathname.startsWith('/ai-assistant')) return null; // the full page is already open
  return (
    <button
      type="button"
      className={`as-open ${className}`}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label={VOICE_ENABLED ? 'דברו עם atlas' : 'שאלו את atlas'}
      onClick={(e) => (isOpen ? setAssistantOpen(false) : openAssistant('voice', e.currentTarget))}
    >
      <VoiceGlyph />
      <span className="as-open-label" aria-hidden="true">{VOICE_ENABLED ? 'דברו עם atlas' : 'שאלו את atlas'}</span>
    </button>
  );
}
