/**
 * Voice A, "שיחה": a calm full-screen call. The face is the only thing that moves; one line says what
 * atlas is doing; the last thing each side said is all the text there is. Proposals rise above the controls.
 * Motion: transform/opacity only, driven by a CSS variable from rAF; off under reduced motion.
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mic, MicOff, PhoneOff, Keyboard, RotateCcw } from 'lucide-react';
import { AtlasFace } from '@/components/mascot/AtlasFace.jsx';
import { ProposalCard } from '../ProposalCard.jsx';
import { useVoiceSession } from './useVoiceSession.js';
import { STATE_LINE, STATE_MOOD } from './status.js';
import './voice.css';

function useLevelVar(ref, levels, on) {
  useEffect(() => {
    if (!on) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    let raf = 0;
    const tick = () => {
      const { mic, out } = levels();
      ref.current?.style.setProperty('--lv', Math.max(mic, out).toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, levels, on]);
}

const minutes = (s) => (s == null ? null : Math.max(0, Math.floor(s / 60)));

export default function VoiceScreen({ facts, page, onClose, onNavigate }) {
  const v = useVoiceSession({ facts, page });
  const stage = useRef(null);
  const closeRef = useRef(null);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  useLevelVar(stage, v.levels, ['listening', 'hearing', 'speaking'].includes(v.state));

  useEffect(() => { v.start(); closeRef.current?.focus({ preventScroll: true }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    document.documentElement.classList.add('as-lock');
    const onKey = (e) => { if (e.key === 'Escape') { v.end(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.documentElement.classList.remove('as-lock'); document.removeEventListener('keydown', onKey); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => { v.end(); onClose(); };
  const lastUser = [...v.turns].reverse().find((t) => t.role === 'user');
  const lastAtlas = [...v.turns].reverse().find((t) => t.role === 'atlas');
  const open = v.proposals.map((p, i) => ({ p, i })).filter(({ p }) => p.state !== 'dismissed');
  const line = v.state === 'thinking' && v.toolLine ? v.toolLine : STATE_LINE[v.state] || '';
  const mins = minutes(v.left);

  return createPortal(
    <div className={`vc vc--a${open.length ? ' has-card' : ''}`} role="dialog" aria-modal="true" aria-label="שיחה קולית עם atlas" dir="rtl">
      <header className="vc-top">
        <button ref={closeRef} type="button" className="vc-icon" onClick={close} aria-label="סגירת השיחה"><X size={22} strokeWidth={1.75} /></button>
        <p className="vc-title">שיחה עם atlas</p>
        <p className="vc-meta" aria-live="off">{v.demo ? 'הדגמה' : mins != null ? `${mins} דק׳ להיום` : ''}</p>
      </header>

      <main className="vc-stage" ref={stage} data-state={v.state}>
        <div className="vc-face">
          <span className="vc-ring vc-ring--1" aria-hidden="true" />
          <span className="vc-ring vc-ring--2" aria-hidden="true" />
          <AtlasFace live mood={STATE_MOOD[v.state]} size={open.length ? 64 : 124} decorative />
        </div>
        <p className="vc-state" role="status">{line}</p>

        {v.state === 'error' ? (
          <div className="vc-error">
            <p>{v.error?.message}</p>
            <div className="vc-error-row">
              <button type="button" className="vc-pill vc-pill--primary" onClick={() => v.start()}><RotateCcw size={18} strokeWidth={1.75} aria-hidden="true" />לנסות שוב</button>
              <button type="button" className="vc-pill" onClick={close}>לכתוב במקום</button>
            </div>
          </div>
        ) : (
          <div className="vc-lines" aria-live="polite">
            {lastUser ? <p className="vc-said vc-said--user" dir="auto">{lastUser.text}</p> : <p className="vc-hint">אפשר לשאול מי מגיע היום, מה פנוי בסוף השבוע או כמה נכנס החודש.</p>}
            {lastAtlas && (!lastUser || v.turns.indexOf(lastAtlas) > v.turns.indexOf(lastUser)) ? <p className="vc-said vc-said--atlas" dir="auto">{lastAtlas.text}</p> : null}
          </div>
        )}
      </main>

      {open.length ? (
        <div className="vc-cards">
          {open.slice(-1).map(({ p, i }) => (
            <ProposalCard key={i} p={p} page={page} compact onNavigate={() => { close(); onNavigate?.(); }} onResolve={(st, r) => v.resolveProposal(i, st, r)} />
          ))}
        </div>
      ) : null}

      {typing ? (
        <form className="vc-type" onSubmit={(e) => { e.preventDefault(); if (v.sendText(draft)) setDraft(''); }}>
          <label className="as-sr" htmlFor="vc-input">השאלה שלכם, בכתב</label>
          <input id="vc-input" dir="auto" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="כתבו כאן" maxLength={500} autoComplete="off" />
          <button type="submit" className="vc-pill vc-pill--primary" disabled={!draft.trim()}>שליחה</button>
        </form>
      ) : null}

      <footer className="vc-controls">
        <div className="vc-ctl">
          <button type="button" className="vc-round vc-round--small" onClick={() => setTyping((t) => !t)} aria-pressed={typing} aria-label="כתיבה במקום דיבור">
            <Keyboard size={22} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <span aria-hidden="true">כתיבה</span>
        </div>
        <div className="vc-ctl">
          <button type="button" className={`vc-round${v.muted ? ' is-on' : ''}`} onClick={v.toggleMute} aria-pressed={v.muted} aria-label={v.muted ? 'ביטול השתקה' : 'השתקת המיקרופון'} disabled={v.state === 'error' || v.state === 'ended'}>
            {v.muted ? <MicOff size={26} strokeWidth={1.75} aria-hidden="true" /> : <Mic size={26} strokeWidth={1.75} aria-hidden="true" />}
          </button>
          <span aria-hidden="true">{v.muted ? 'מושתק' : 'השתקה'}</span>
        </div>
        <div className="vc-ctl">
          <button type="button" className="vc-round vc-round--end" onClick={close} aria-label="סיום השיחה">
            <PhoneOff size={26} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <span aria-hidden="true">סיום</span>
        </div>
      </footer>
      <p className="vc-fine">{v.demo ? 'הדגמה: השיחה מתוסרטת מהנתונים בדפדפן הזה.' : 'השמע לא נשמר אצלנו. פעולות קורות רק אחרי אישור שלכם.'}</p>
    </div>,
    document.body,
  );
}
