/**
 * Voice B, "שיחה כתובה": the conversation written down as it happens. Everything atlas heard, checked and
 * prepared stays on the page (like the text assistant), so a proposal can be read in full before "אישור".
 * One live dock at the bottom: end, a level meter that says who is talking, mute.
 * Motion: transform/opacity only, one CSS variable (--lv) from rAF; none under reduced motion.
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mic, MicOff, PhoneOff, Keyboard, Check, RotateCcw } from 'lucide-react';
import { AtlasFace } from '@/components/mascot/AtlasFace';
import { ProposalCard } from '../ProposalCard.jsx';
import { useVoiceSession } from './useVoiceSession.js';
import { STATE_LINE, STATE_MOOD } from './status.js';
import './voice.css';
import './voice-b.css';

const BARS = [0.55, 0.8, 1, 0.8, 0.55];

function useLevelVar(ref, levels, on) {
  useEffect(() => {
    if (!on || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0;
    const tick = () => { const { mic, out } = levels(); ref.current?.style.setProperty('--lv', Math.max(mic, out).toFixed(3)); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, levels, on]);
}

/** Tool activity as rows in the transcript: "בודקים את היום" → "בדקנו" once it finished. */
function useActivity(toolLine, turns) {
  const [rows, setRows] = useState([]);
  const prev = useRef('');
  useEffect(() => {
    if (toolLine && toolLine !== prev.current) {
      const after = turns.length ? turns[turns.length - 1].id : 'start';
      setRows((r) => [...r.map((x) => ({ ...x, done: true })), { id: `${after}-${r.length}`, after, text: toolLine, done: false }].slice(-12));
    }
    if (!toolLine && prev.current) setRows((r) => r.map((x) => ({ ...x, done: true })));
    prev.current = toolLine;
  }, [toolLine]); // eslint-disable-line react-hooks/exhaustive-deps
  return rows;
}

const minutes = (s) => (s == null ? null : Math.max(0, Math.floor(s / 60)));

export default function VoiceScreen({ facts, page, onClose, onNavigate }) {
  const v = useVoiceSession({ facts, page });
  const dock = useRef(null);
  const scroll = useRef(null);
  const closeRef = useRef(null);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const activity = useActivity(v.toolLine, v.turns);
  useLevelVar(dock, v.levels, ['listening', 'hearing', 'speaking'].includes(v.state));

  useEffect(() => { v.start(); closeRef.current?.focus({ preventScroll: true }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    document.documentElement.classList.add('as-lock');
    const onKey = (e) => { if (e.key === 'Escape') { v.end(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.documentElement.classList.remove('as-lock'); document.removeEventListener('keydown', onKey); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const lastText = v.turns.length ? v.turns[v.turns.length - 1].text.length : 0;
  useEffect(() => { const el = scroll.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'auto' }); }, [v.turns.length, lastText, v.proposals.length, activity.length]);

  const close = () => { v.end(); onClose(); };
  const line = v.state === 'thinking' && v.toolLine ? v.toolLine : STATE_LINE[v.state] || '';
  const mins = minutes(v.left);
  const who = v.state === 'speaking' ? 'atlas' : v.state === 'hearing' ? 'you' : 'idle';

  // the written conversation: turns with activity rows after the turn they followed, then proposals
  const items = [];
  for (const a of activity.filter((x) => x.after === 'start')) items.push({ k: a.id, a });
  for (const t of v.turns) {
    items.push({ k: t.id, t });
    for (const a of activity.filter((x) => x.after === t.id)) items.push({ k: a.id, a });
  }

  return createPortal(
    <div className="vc vc--b" role="dialog" aria-modal="true" aria-label="שיחה קולית עם atlas" dir="rtl">
      <header className="vb-head">
        <button ref={closeRef} type="button" className="vc-icon" onClick={close} aria-label="סגירת השיחה"><X size={22} strokeWidth={1.75} /></button>
        <AtlasFace live mood={STATE_MOOD[v.state]} size={36} decorative />
        <div className="vb-head-txt">
          <p className="vb-name">שיחה עם atlas</p>
          <p className="vb-state" role="status"><span className={`vb-dot vb-dot--${v.state}`} aria-hidden="true" />{line}</p>
        </div>
        <button type="button" className={`vc-icon${typing ? ' is-on' : ''}`} onClick={() => setTyping((t) => !t)} aria-pressed={typing} aria-label="כתיבה במקום דיבור">
          <Keyboard size={22} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </header>

      <div className="vb-scroll" ref={scroll}>
        <div className="vb-thread" aria-live="polite">
          {!v.turns.length && v.state !== 'error' ? (
            <div className="vb-empty">
              <p className="vb-empty-title">דברו בחופשיות</p>
              <p>אפשר לשאול מי מגיע היום, מה פנוי בסוף השבוע או כמה נכנס החודש. כל מה שנאמר נכתב כאן.</p>
            </div>
          ) : null}
          {items.map(({ k, t, a }) => (t ? (
            t.role === 'user'
              ? <p key={k} className="vb-user" dir="auto">{t.text}</p>
              : <p key={k} className={`vb-atlas${t.final ? '' : ' is-live'}`} dir="auto">{t.text}</p>
          ) : (
            <p key={k} className={`vb-act${a.done ? ' is-done' : ''}`}>
              {a.done ? <Check size={16} strokeWidth={1.75} aria-hidden="true" /> : <span className="vb-spin" aria-hidden="true" />}
              <span>{a.done ? a.text.replace(/^בודקים/, 'בדקנו').replace(/^מחפשים/, 'חיפשנו').replace(/^מכינים/, 'הכנו').replace(/^פותחים/, 'פתחנו') : a.text}</span>
            </p>
          )))}
          {v.proposals.map((p, i) => (
            <ProposalCard key={i} p={p} page={page} onNavigate={() => { close(); onNavigate?.(); }} onResolve={(st, r) => v.resolveProposal(i, st, r)} />
          ))}
          {v.state === 'error' ? (
            <div className="vb-error" role="alert">
              <p>{v.error?.message}</p>
              <div className="vc-error-row">
                <button type="button" className="vc-pill vc-pill--primary" onClick={() => v.start()}><RotateCcw size={18} strokeWidth={1.75} aria-hidden="true" />לנסות שוב</button>
                <button type="button" className="vc-pill" onClick={close}>לכתוב במקום</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {typing ? (
        <form className="vc-type" onSubmit={(e) => { e.preventDefault(); if (v.sendText(draft)) setDraft(''); }}>
          <label className="as-sr" htmlFor="vb-input">השאלה שלכם, בכתב</label>
          <input id="vb-input" dir="auto" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="כתבו כאן" maxLength={500} autoComplete="off" />
          <button type="submit" className="vc-pill vc-pill--primary" disabled={!draft.trim()}>שליחה</button>
        </form>
      ) : null}

      <footer className="vb-dock" ref={dock} data-who={who}>
        <button type="button" className="vb-btn vb-btn--end" onClick={close} aria-label="סיום השיחה"><PhoneOff size={24} strokeWidth={1.75} aria-hidden="true" /></button>
        <div className="vb-meter" aria-hidden="true">
          <span className="vb-bars">{BARS.map((w, i) => <i key={i} style={{ '--w': w }} />)}</span>
          <span className="vb-meter-txt">{v.muted ? 'המיקרופון מושתק' : who === 'atlas' ? 'atlas מדבר' : who === 'you' ? 'שומעים אתכם' : v.demo ? 'הדגמה' : mins != null ? `${mins} דקות להיום` : 'מקשיבים'}</span>
        </div>
        <button type="button" className={`vb-btn${v.muted ? ' is-on' : ''}`} onClick={v.toggleMute} aria-pressed={v.muted} aria-label={v.muted ? 'ביטול השתקה' : 'השתקת המיקרופון'} disabled={v.state === 'error' || v.state === 'ended'}>
          {v.muted ? <MicOff size={24} strokeWidth={1.75} aria-hidden="true" /> : <Mic size={24} strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </footer>
      <p className="vc-fine">{v.demo ? 'הדגמה: השיחה מתוסרטת מהנתונים בדפדפן הזה.' : 'השמע לא נשמר אצלנו. פעולות קורות רק אחרי אישור שלכם.'}</p>
    </div>,
    document.body,
  );
}
