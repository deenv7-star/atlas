/**
 * One voice conversation with atlas: mic + socket + the brain's tools + proposals + the daily budget.
 *
 *   const v = useVoiceSession({ facts, page })
 *   v.start()  (call from the tap that opened voice: iOS unlocks audio only inside a user gesture)
 *   v.state    'idle' | 'connecting' | 'listening' | 'hearing' | 'thinking' | 'speaking' | 'ended' | 'error'
 *   v.turns    [{ id, role: 'user'|'atlas', text, final }]
 *   v.proposals[{ ...proposal, state }]  → <ProposalCard/>, done only on the owner's tap
 *   v.levels() → { mic, out } 0..1 for the visuals (read in rAF, not React state)
 *
 * Live: voice-session mints a 180 s slice; ~20 s before it ends the hook quietly opens the next slice,
 * seeds it with the last turns and moves the mic over. Tools run on the server (ai-chat {op:'tool'}).
 * Demo (no Supabase): a scripted conversation from the local snapshot, clearly the in-browser stand-in.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { startVoiceSession, endVoiceSession, reportVoiceEvent, runVoiceTool, VoiceError, VOICE_ERRORS, ASSISTANT_DEMO } from '../api.js';
import { VoiceAudio, RealtimeLink } from './realtime.js';
import { RENEW_BEFORE_S } from './config.js';
import { demoAnswer, demoProposal } from '../demoAnswer.js';
import { humanDay } from '../humanLines.js';
import { PLATFORM } from '../api.js';
import { statusLine } from './status.js';
import { createStartGuard } from './startGuard.js';
import { PERSONA } from '../../../supabase/functions/_shared/brain/persona.js';

const uid = () => Math.random().toString(36).slice(2, 9);
/** The last turns, for a renewed / reconnected slice (or a switch from writing to voice). */
export const summaryOf = (turns) => turns.filter((t) => t.final && t.text).slice(-6).map((t) => `${t.role === 'user' ? 'הבעלים' : 'atlas'}: ${t.text}`).join('\n');
/** Is the microphone already blocked? (no prompt is shown when it is; go straight to writing) */
async function micBlocked() {
  try { const r = await navigator.permissions?.query({ name: 'microphone' }); return r?.state === 'denied'; } catch { return false; }
}
const plain = (md) => String(md || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '').replace(/[*_#>|`]/g, '').replace(/^-{3,}.*$/gm, '').replace(/\n{2,}/g, '\n').split('\n').filter((l) => l.trim() && !/^\s*-+\s*$/.test(l)).slice(0, 2).join(' ').trim();

export function useVoiceSession({ facts, page = '', owner = '' }) {
  const [state, setState] = useState('idle');
  const [toolLine, setToolLine] = useState('');
  const [turns, setTurns] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);
  const [left, setLeft] = useState(null); // seconds left today (live) or null
  const [note, setNote] = useState('');   // a soft line under the state ("לא שמענו טוב…"), never an error
  const reconnected = useRef(false);
  const audio = useRef(null);
  const link = useRef(null);
  const slice = useRef(null); // { id, endsAt, remaining }
  const timers = useRef([]);
  const alive = useRef(true);
  const turnsRef = useRef([]);
  turnsRef.current = turns;
  const stateRef = useRef('idle');
  stateRef.current = state;
  const demoT = useRef(0);
  const guard = useRef(null);
  if (!guard.current) guard.current = createStartGuard();
  const opening = useRef(null); // the openSlice in flight (renewal and reconnect never open two slices at once)
  const failed = useRef(false);

  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };
  const upsertAtlas = useCallback((text, final) => setTurns((list) => {
    const last = list[list.length - 1];
    if (last && last.role === 'atlas' && !last.final) return [...list.slice(0, -1), { ...last, text, final }];
    return [...list, { id: uid(), role: 'atlas', text, final }].slice(-30);
  }), []);
  const addUser = useCallback((text) => text && setTurns((list) => [...list, { id: uid(), role: 'user', text, final: true }].slice(-30)), []);

  const fail = useCallback((code) => {
    failed.current = true;
    // tear the call down fully (no open mic / socket / slice left behind an error screen)
    timers.current.forEach(clearTimeout); timers.current = [];
    const l = link.current; link.current = null; l?.close();
    audio.current?.stop();
    endVoiceSession(slice.current?.id); slice.current = null;
    guard.current.release();
    if (!alive.current) return;
    setError({ code, message: VOICE_ERRORS[code] || VOICE_ERRORS.upstream });
    setState('error');
  }, []);

  /* ── tools: the realtime model decided; the server runs the tool with the owner's JWT ── */
  const onTool = useCallback(async (name, args) => {
    setToolLine(statusLine(name));
    const { result, proposal } = await runVoiceTool(name, args);
    if (proposal) setProposals((p) => [...p, { ...proposal, state: 'proposed' }].slice(-3));
    setToolLine('');
    return result;
  }, []);

  /* ── one slice = one socket ── */
  const openSlice = useCallback(({ resume = '' } = {}) => {
    if (opening.current) return opening.current;
    const p = openSliceNowRef.current({ resume }).finally(() => { if (opening.current === p) opening.current = null; });
    opening.current = p;
    return p;
  }, []); // reads the latest openSliceNow through a ref
  const openSliceRef = useRef(openSlice);
  openSliceRef.current = openSlice;
  const openSliceNowRef = useRef(null);

  const openSliceNow = async ({ resume = '' } = {}) => {
    const s = await startVoiceSession({ page, resume });
    let renewTimer = 0;
    const next = new RealtimeLink({
      secret: s.client_secret, url: s.ws_url, model: s.model, audio: audio.current,
      on: {
        open: () => {
          if (resume) next.seed(turnsRef.current.filter((t) => t.final));
          const prev = link.current; link.current = next;
          audio.current.onChunk = (pcm) => link.current?.pushAudio(pcm);
          prev?.close();
          setState((st) => (st === 'connecting' ? 'listening' : st));
        },
        state: (st) => { if (!alive.current) return; setState(st); if (st === 'hearing' || st === 'speaking') setNote(''); },
        unanswered: () => alive.current && setNote(PERSONA.notHeard),
        user: addUser,
        atlas: upsertAtlas,
        tool: onTool,
        error: (code) => { if (link.current === next || !link.current) fail(code === 'expired' ? 'upstream' : code); },
        // telemetry: socket / server errors inside this slice → voice-session logs (no DB write)
        event: (kind, detail) => reportVoiceEvent(kind, { session_id: s.session_id, state: stateRef.current, ...detail }),
        closed: (info) => {
          if (info.byUs) return; // renewal / hang-up: that path already ended the slice
          clearTimeout(renewTimer);
          // the socket closed on its own: end the slice now (charged by seconds used) and send the close code/reason
          console.warn('[atlas voice] socket closed', info.code, info.reason || '', `${Math.round(info.age_ms / 1000)}s`);
          endVoiceSession(s.session_id, { ...info, state: stateRef.current });
          if (slice.current?.id === s.session_id) slice.current = null;
          if (link.current !== next && link.current) return; // an older socket; the current one is fine
          if (!alive.current) return;
          if (failed.current) { link.current = null; return; } // a fatal error already ended the call
          // dropped (network, slice ended early): reconnect once, quietly, with what was said
          if (!reconnected.current) {
            reconnected.current = true; setState('connecting');
            openSliceRef.current({ resume: summaryOf(turnsRef.current) }).catch((e) => fail(e instanceof VoiceError ? e.code : 'network'));
            return;
          }
          link.current = null;
          if (!info.open_ms) { fail('network'); return; } // never connected twice in a row: say so, offer writing
          guard.current.release();
          setState((st) => (st === 'error' ? st : 'ended'));
        },
      },
    });
    slice.current = { id: s.session_id, endsAt: Date.now() + s.seconds * 1000, remaining: s.remaining_today };
    setLeft(s.remaining_today + s.seconds);
    // renew before the slice ends, while there is budget left
    if (s.remaining_today >= 15) {
      const renew = async (waited = 0) => {
        if (!alive.current || link.current !== next) return; // only the live socket renews (a dead slice's timer never opens a 2nd)
        // never cut atlas mid-answer: wait (up to 15 s) for a quiet moment before moving to the next slice
        if (waited < 15 && (stateRef.current === 'speaking' || stateRef.current === 'thinking' || stateRef.current === 'hearing')) { later(() => renew(waited + 1), 1000); return; }
        const prevId = s.session_id;
        try { await openSliceRef.current({ resume: summaryOf(turnsRef.current) }); endVoiceSession(prevId); } catch (e) { if (e?.code === 'daily_limit') setLeft(0); }
      };
      renewTimer = later(() => renew(0), Math.max(5, s.seconds - RENEW_BEFORE_S) * 1000);
    }
    return next;
  };
  openSliceNowRef.current = openSliceNow; // latest page / handlers, read when a slice opens

  /* ── demo: scripted, from the local snapshot only ── */
  const runDemo = useCallback(() => {
    const q1 = 'מי מגיע היום?';
    const a1 = humanDay(facts, owner) || plain(demoAnswer(q1, facts, { native: PLATFORM === 'ios' })) || 'היום אין כניסות.';
    const q2 = PERSONA.askBooking;
    const p2 = demoProposal(q2, facts);
    const step = (ms, fn) => later(() => alive.current && fn(), (demoT.current += ms));
    demoT.current = 0;
    step(650, () => setState('listening'));
    step(1100, () => setState('hearing'));
    step(1300, () => { addUser(q1); setState('thinking'); setToolLine(statusLine('get_day_overview')); });
    step(1100, () => { setToolLine(''); setState('speaking'); upsertAtlas(a1, false); });
    step(2300, () => { upsertAtlas(a1, true); setState('listening'); });
    if (p2) {
      step(900, () => setState('hearing'));
      step(1300, () => { addUser(q2); setState('thinking'); setToolLine(statusLine('propose_booking')); });
      step(1100, () => { setToolLine(''); setProposals([{ ...p2, state: 'proposed' }]); setState('speaking'); upsertAtlas(p2.say, false); });
      step(2100, () => { upsertAtlas(p2.say, true); setState('listening'); });
    }
  }, [facts, owner, addUser, upsertAtlas]);

  /** Review only (demo builds): ?voiceShot=listening|hearing|thinking|speaking|confirm|whatsapp|denied|error|text freezes one moment. */
  const shot = useCallback((name) => {
    const q1 = 'מי מגיע היום?';
    const a1 = humanDay(facts, owner) || plain(demoAnswer(q1, facts)) || 'היום אין כניסות.';
    const q2 = PERSONA.askBooking;
    const p2 = demoProposal(q2, facts);
    if (name === 'denied') { setError({ code: 'mic_denied', message: VOICE_ERRORS.mic_denied }); setState('error'); return; }
    if (name === 'error') { setError({ code: 'network', message: VOICE_ERRORS.network }); setState('error'); return; }
    if (name === 'text') { setState('ended'); return; }
    if (name === 'listening') { setState('listening'); return; }
    if (name === 'hearing') { setTurns([]); setState('hearing'); return; }
    addUser(q1);
    if (name === 'thinking') { setState('thinking'); setToolLine(statusLine('get_day_overview')); return; }
    upsertAtlas(a1, name !== 'speaking');
    if (name === 'speaking') { setState('speaking'); return; }
    const q3 = 'תשלחו תזכורת על התשלום לאורח';
    const p3 = name === 'whatsapp' ? demoProposal(q3, facts) : null;
    const [q, p] = p3 ? [q3, p3] : [q2, p2];
    addUser(q);
    if (p) setProposals([{ ...p, state: 'proposed' }]);
    upsertAtlas(p?.say || '', true);
    setState('listening');
  }, [facts, owner, addUser, upsertAtlas]);

  /** start({ resume }) — call inside the tap. `resume`: what was already said in writing, so voice continues it. */
  const start = useCallback(async ({ resume = '' } = {}) => {
    if (!guard.current.tryEnter()) return; // one tap = one session (double tap / effect + tap opened two on 04.11)
    failed.current = false;
    setError(null); setNote(''); setState('connecting'); reconnected.current = false; alive.current = true;
    if (ASSISTANT_DEMO) {
      const frozen = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('voiceShot') : null;
      if (frozen) shot(frozen); else runDemo();
      return;
    }
    try {
      if (await micBlocked()) { const e = new Error('mic'); e.code = 'mic_denied'; throw e; }
      audio.current = new VoiceAudio();
      await audio.current.start();
      await openSlice({ resume });
    } catch (e) {
      audio.current?.stop();
      reportVoiceEvent('start_failed', { code: e instanceof VoiceError ? e.code : e?.code || 'upstream' });
      fail(e instanceof VoiceError ? e.code : e?.code || 'upstream');
    }
  }, [openSlice, runDemo, shot, fail]);

  const end = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    link.current?.close(); link.current = null;
    audio.current?.stop();
    endVoiceSession(slice.current?.id); slice.current = null;
    guard.current.release();
    setState('ended');
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => { audio.current?.setMuted(!m); return !m; }), []);
  const sendText = useCallback((text) => {
    const t = String(text || '').trim();
    if (!t) return false;
    if (ASSISTANT_DEMO) { // the in-browser stand-in answers a tapped next step the same way
      addUser(t); setState('thinking');
      const p = demoProposal(t, facts);
      later(() => {
        if (!alive.current) return;
        if (p) setProposals((list) => [...list, { ...p, state: 'proposed' }].slice(-3));
        upsertAtlas(p ? p.say : plain(demoAnswer(t, facts, { native: PLATFORM === 'ios' })), true); setState('listening');
      }, 900);
      return true;
    }
    if (!link.current) return false;
    addUser(t); link.current.sayText(t); return true;
  }, [addUser, upsertAtlas, facts]);
  const resolveProposal = useCallback((i, st, result = null) => setProposals((list) => list.map((p, j) => (j === i ? { ...p, state: st, result } : p))), []);

  /** Visual levels; demo animates calmly so the screen can be reviewed without a mic. */
  const levels = useCallback(() => {
    if (ASSISTANT_DEMO) {
      const t = performance.now() / 1000;
      return { mic: state === 'hearing' ? 0.35 + 0.3 * Math.abs(Math.sin(t * 5.3)) : 0.04, out: state === 'speaking' ? 0.3 + 0.35 * Math.abs(Math.sin(t * 7.1) * Math.cos(t * 2.3)) : 0 };
    }
    const a = audio.current;
    return { mic: a && !muted ? a.level : 0, out: a ? a.readOut() : 0 };
  }, [state, muted]);

  // the "speaking" state follows the actual audio still playing
  useEffect(() => {
    if (ASSISTANT_DEMO || state !== 'listening') return undefined;
    const t = setInterval(() => { if (audio.current?.speaking) setState('speaking'); }, 200);
    return () => clearInterval(t);
  }, [state]);
  useEffect(() => {
    if (ASSISTANT_DEMO || state !== 'speaking') return undefined;
    const t = setInterval(() => { if (!audio.current?.speaking) setState('listening'); }, 250);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => () => { alive.current = false; timers.current.forEach(clearTimeout); link.current?.close(); audio.current?.stop(); endVoiceSession(slice.current?.id); }, []);

  return { state, toolLine, note, turns, proposals, muted, error, left, start, end, toggleMute, sendText, resolveProposal, levels, demo: ASSISTANT_DEMO };
}
