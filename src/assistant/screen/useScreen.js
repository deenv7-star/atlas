/**
 * The assistant screen's brain, shared by both designs: one conversation that is voice-first and can switch
 * to writing (and back) without losing what was said.
 *   mode    'voice' | 'text' — opens in voice (the tap unlocked audio); writing is one tap away
 *   notice  why we fell back to writing (mic blocked / missing / voice off / minutes used), with a voice retry
 *   step    the next step to offer after the latest answer (nextStep.js), from real data only
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVoiceSession, summaryOf } from '../voice/useVoiceSession.js';
import { useAssistant } from '../useAssistant.js';
import { nextStep, optionsOf } from '../nextStep.js';
import { assistantMode } from '../launcher.jsx';
import { primeVoiceAudio } from '../voice/prime.js';
import { VOICE_ENABLED } from '../voice/config.js';
import { STATE_LINE } from '../voice/status.js';
import { ASSISTANT_DEMO } from '../api.js';

/** Voice errors that mean "write instead" rather than "try again". */
const TO_TEXT = new Set(['mic_denied', 'mic_missing', 'not_configured', 'voice_not_ready', 'daily_limit']);
const HOW_TO_ALLOW = {
  mic_denied: 'כדי לדבר: באייפון, הגדרות ← atlas ← מיקרופון. בדפדפן, סמל המנעול ליד הכתובת.',
};

export function useScreen({ facts, page }) {
  const shot = typeof window !== 'undefined' && ASSISTANT_DEMO ? new URLSearchParams(window.location.search).get('voiceShot') : null;
  const [mode, setMode] = useState(() => (VOICE_ENABLED && shot !== 'text' ? assistantMode() : 'text'));
  const [notice, setNotice] = useState(null);
  const v = useVoiceSession({ facts, page });
  const t = useAssistant({ facts, page });
  const seeded = useRef(0);
  const lastStep = useRef('');

  // live: start at once (the tap unlocked audio). Demo: wait for the local data (max 2.5 s) so the stand-in answers from it.
  const [waited, setWaited] = useState(!ASSISTANT_DEMO);
  useEffect(() => { if (waited) return undefined; const id = setTimeout(() => setWaited(true), 2500); return () => clearTimeout(id); }, [waited]);
  const ready = waited || facts != null;
  const started = useRef(false);
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    if (mode === 'voice') v.start();
    else if (shot === 'text' && !t.messages.length) t.send('מי מגיע היום?'); // review shot "text": a short written exchange
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // voice cannot run here → write instead, and say why once
  useEffect(() => {
    if (v.state !== 'error' || !TO_TEXT.has(v.error?.code)) return;
    setNotice({ code: v.error.code, text: v.error.message, how: HOW_TO_ALLOW[v.error.code] || '' });
    setMode('text');
  }, [v.state, v.error]);


  const toText = useCallback(() => {
    const fresh = v.turns.slice(seeded.current);
    seeded.current = v.turns.length;
    if (v.state !== 'ended' && v.state !== 'error' && v.state !== 'idle') v.end();
    t.seed(fresh);
    setMode('text');
  }, [v, t]);

  const toVoice = useCallback(() => { // call inside the tap
    primeVoiceAudio();
    setNotice(null); setMode('voice');
    const said = t.messages.filter((m) => m.status === 'done' && m.content && !m.voice).map((m) => ({ role: m.role === 'user' ? 'user' : 'atlas', text: m.content, final: true }));
    v.start({ resume: summaryOf(said) });
  }, [v, t]);

  /* the latest exchange, for the next step */
  const lastUserV = [...v.turns].reverse().find((x) => x.role === 'user');
  const lastAtlasV = [...v.turns].reverse().find((x) => x.role === 'atlas');
  const lastT = [...t.messages].reverse().find((m) => m.role === 'assistant');
  const lastQ = [...t.messages].reverse().find((m) => m.role === 'user');
  const voiceAnswered = lastAtlasV?.final && (!lastUserV || v.turns.indexOf(lastAtlasV) > v.turns.indexOf(lastUserV));
  const textAnswered = lastT?.status === 'done' && !t.busy;
  const step = useMemo(() => {
    if (mode === 'voice' && voiceAnswered && !['thinking', 'hearing'].includes(v.state)) return nextStep(facts, { question: lastUserV?.text || '', answer: lastAtlasV?.text || '', last: lastStep.current });
    if (mode === 'text' && textAnswered) return nextStep(facts, { question: lastQ?.content || '', answer: lastT?.content || '', last: lastStep.current });
    return null;
  }, [mode, voiceAnswered, textAnswered, v.state, facts, lastUserV?.text, lastAtlasV?.text, lastQ?.content, lastT?.content]);

  const ask = useCallback((q) => {
    if (!q) return false;
    lastStep.current = q;
    return mode === 'voice' ? v.sendText(q) : t.send(q);
  }, [mode, v, t]);

  const line = v.state === 'thinking' && v.toolLine ? v.toolLine : STATE_LINE[v.state] || '';
  return { mode, notice, v, t, step, ask, toText, toVoice, line, lastUser: lastUserV, lastAtlas: voiceAnswered || v.state === 'speaking' ? lastAtlasV : null, starters: optionsOf(facts), shot };
}
