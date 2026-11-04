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
import { startVoiceSession, endVoiceSession, runVoiceTool, VoiceError, VOICE_ERRORS, ASSISTANT_DEMO } from '../api.js';
import { VoiceAudio, RealtimeLink } from './realtime.js';
import { RENEW_BEFORE_S } from './config.js';
import { demoAnswer, demoProposal } from '../demoAnswer.js';
import { statusLine } from './status.js';

const uid = () => Math.random().toString(36).slice(2, 9);
const plain = (md) => String(md || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '').replace(/[*_#>|`]/g, '').replace(/^-{3,}.*$/gm, '').replace(/\n{2,}/g, '\n').split('\n').filter((l) => l.trim() && !/^\s*-+\s*$/.test(l)).slice(0, 2).join(' ').trim();

export function useVoiceSession({ facts, page = '' }) {
  const [state, setState] = useState('idle');
  const [toolLine, setToolLine] = useState('');
  const [turns, setTurns] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);
  const [left, setLeft] = useState(null); // seconds left today (live) or null
  const audio = useRef(null);
  const link = useRef(null);
  const slice = useRef(null); // { id, endsAt, remaining }
  const timers = useRef([]);
  const alive = useRef(true);
  const turnsRef = useRef([]);
  turnsRef.current = turns;
  const demoT = useRef(0);

  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };
  const upsertAtlas = useCallback((text, final) => setTurns((list) => {
    const last = list[list.length - 1];
    if (last && last.role === 'atlas' && !last.final) return [...list.slice(0, -1), { ...last, text, final }];
    return [...list, { id: uid(), role: 'atlas', text, final }].slice(-30);
  }), []);
  const addUser = useCallback((text) => text && setTurns((list) => [...list, { id: uid(), role: 'user', text, final: true }].slice(-30)), []);

  const fail = useCallback((code) => {
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
  const openSlice = useCallback(async ({ resume = '' } = {}) => {
    const s = await startVoiceSession({ page, resume });
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
        state: (st) => alive.current && setState(st),
        user: addUser,
        atlas: upsertAtlas,
        tool: onTool,
        error: (code) => { if (link.current === next || !link.current) fail(code === 'expired' ? 'upstream' : code); },
        closed: ({ byUs }) => { if (!byUs && link.current === next && alive.current) setState((st) => (st === 'error' ? st : 'ended')); },
      },
    });
    slice.current = { id: s.session_id, endsAt: Date.now() + s.seconds * 1000, remaining: s.remaining_today };
    setLeft(s.remaining_today + s.seconds);
    // renew before the slice ends, while there is budget left
    if (s.remaining_today >= 15) {
      later(async () => {
        if (!alive.current) return;
        const prevId = slice.current?.id;
        const summary = turnsRef.current.filter((t) => t.final).slice(-6).map((t) => `${t.role === 'user' ? 'הבעלים' : 'atlas'}: ${t.text}`).join('\n');
        try { await openSlice({ resume: summary }); endVoiceSession(prevId); } catch (e) { if (e?.code === 'daily_limit') setLeft(0); }
      }, Math.max(5, s.seconds - RENEW_BEFORE_S) * 1000);
    }
    return next;
  }, [page, addUser, upsertAtlas, onTool, fail]);

  /* ── demo: scripted, from the local snapshot only ── */
  const runDemo = useCallback(() => {
    const q1 = 'מי מגיע היום?';
    const a1 = plain(demoAnswer(q1, facts)) || 'היום אין כניסות.';
    const q2 = 'תכינו הזמנה חדשה לנועה לסוף השבוע';
    const p2 = demoProposal(q2, facts);
    const step = (ms, fn) => later(() => alive.current && fn(), (demoT.current += ms));
    demoT.current = 0;
    step(700, () => setState('listening'));
    step(1400, () => setState('hearing'));
    step(1500, () => { addUser(q1); setState('thinking'); setToolLine(statusLine('get_day_overview')); });
    step(1100, () => { setToolLine(''); setState('speaking'); upsertAtlas(a1, false); });
    step(2600, () => { upsertAtlas(a1, true); setState('listening'); });
    if (p2) {
      step(1600, () => setState('hearing'));
      step(1500, () => { addUser(q2); setState('thinking'); setToolLine(statusLine('propose_booking')); });
      step(1100, () => { setToolLine(''); setProposals([{ ...p2, state: 'proposed' }]); setState('speaking'); upsertAtlas(p2.say, false); });
      step(2400, () => { upsertAtlas(p2.say, true); setState('listening'); });
    }
  }, [facts, addUser, upsertAtlas]);

  /** Review only (demo builds): ?voiceShot=listening|hearing|thinking|speaking|confirm|whatsapp|error freezes one moment. */
  const shot = useCallback((name) => {
    const q1 = 'מי מגיע היום?';
    const a1 = plain(demoAnswer(q1, facts)) || 'היום אין כניסות.';
    const q2 = 'תכינו הזמנה חדשה לנועה לסוף השבוע';
    const p2 = demoProposal(q2, facts);
    if (name === 'error') { setError({ code: 'mic_denied', message: VOICE_ERRORS.mic_denied }); setState('error'); return; }
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
  }, [facts, addUser, upsertAtlas]);

  const start = useCallback(async () => {
    setError(null); setState('connecting');
    if (ASSISTANT_DEMO) {
      const frozen = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('voiceShot') : null;
      if (frozen) shot(frozen); else runDemo();
      return;
    }
    try {
      audio.current = new VoiceAudio();
      await audio.current.start();
      await openSlice();
    } catch (e) {
      audio.current?.stop();
      fail(e instanceof VoiceError ? e.code : e?.code || 'upstream');
    }
  }, [openSlice, runDemo, shot, fail]);

  const end = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    link.current?.close(); link.current = null;
    audio.current?.stop();
    endVoiceSession(slice.current?.id); slice.current = null;
    setState('ended');
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => { audio.current?.setMuted(!m); return !m; }), []);
  const sendText = useCallback((text) => { const t = String(text || '').trim(); if (!t || !link.current) return false; addUser(t); link.current.sayText(t); return true; }, [addUser]);
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

  return { state, toolLine, turns, proposals, muted, error, left, start, end, toggleMute, sendText, resolveProposal, levels, demo: ASSISTANT_DEMO };
}
