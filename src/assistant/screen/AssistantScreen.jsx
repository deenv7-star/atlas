/**
 * "דברו עם atlas" v2, design A — "האור": a deep navy room, one indigo light that is the voice.
 * Opens straight into a live voice conversation; "כתיבה" is one tap away at the top, and the screen falls
 * back to writing on its own when the mic is not available. The latest answer sits in a calm card, a
 * proposal is a white card that waits for "אישור", and one next step is always offered (nextStep.js).
 * RTL, Heebo, 44px+ targets, 16px inputs, transform/opacity motion only, still under reduced motion.
 */
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Mic, MicOff, Square, RotateCcw, Keyboard } from 'lucide-react';
import { ProposalCard } from '../ProposalCard.jsx';
import { Answer, Composer } from '../ui.jsx';
import { useScreen } from './useScreen.js';
import { Orb } from './Orb.jsx';
import './screen-a.css';

const minutes = (s) => (s == null ? null : Math.max(0, Math.floor(s / 60)));

function ModeSwitch({ mode, onVoice, onText }) {
  return (
    <div className="ax-switch" role="group" aria-label="איך לשאול">
      <button type="button" aria-pressed={mode === 'voice'} onClick={mode === 'voice' ? undefined : onVoice}>דיבור</button>
      <button type="button" aria-pressed={mode === 'text'} onClick={mode === 'text' ? undefined : onText}>כתיבה</button>
    </div>
  );
}

/** The one next step (or 2-3 starters when the owner is not sure). Tapping only ASKS; proposals still need אישור. */
function NextStep({ step, onAsk, dark = true }) {
  if (!step) return null;
  if (step.ask) {
    return (
      <div className={`ax-next${dark ? '' : ' is-light'}`}>
        <p className="ax-next-line">{step.line}</p>
        <div className="ax-chips"><button type="button" className="ax-chip ax-chip--go" onClick={() => onAsk(step.ask)}>{step.label}</button></div>
      </div>
    );
  }
  if (!step.options?.length) return null;
  return (
    <div className={`ax-next${dark ? '' : ' is-light'}`}>
      <p className="ax-next-line">{step.line}</p>
      <div className="ax-chips">{step.options.map((o) => <button key={o.ask} type="button" className="ax-chip" onClick={() => onAsk(o.ask)}>{o.label}</button>)}</div>
    </div>
  );
}

export default function AssistantScreen({ facts, page, onClose, onNavigate }) {
  const s = useScreen({ facts, page });
  const { v, t } = s;
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true }); // focus the dialog itself: no ring flashes on a control
    document.documentElement.classList.add('as-lock');
    const onKey = (e) => { if (e.key === 'Escape') { v.end(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.documentElement.classList.remove('as-lock'); document.removeEventListener('keydown', onKey); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [t.messages.length, t.messages[t.messages.length - 1]?.content, s.mode, s.step?.line]);

  const close = () => { v.end(); onClose(); };
  const open = v.proposals.map((p, i) => ({ p, i })).filter(({ p }) => p.state !== 'dismissed');
  const card = open.length ? open[open.length - 1] : null;
  const mins = minutes(v.left);
  const live = ['listening', 'hearing', 'thinking', 'speaking', 'connecting'].includes(v.state);

  return createPortal(
    <div ref={rootRef} tabIndex={-1} className={`ax ax--${s.mode}${card ? ' has-card' : ''}`} role="dialog" aria-modal="true" aria-label="דברו עם atlas" dir="rtl">
      <header className="ax-top">
        <button type="button" className="ax-icon" onClick={close} aria-label="סגירה"><X size={22} strokeWidth={1.75} /></button>
        <ModeSwitch mode={s.mode} onVoice={s.toVoice} onText={s.toText} />
        <p className="ax-meta" aria-live="off">{v.demo ? 'הדגמה' : s.mode === 'voice' && mins != null ? `${mins} דק׳` : ''}</p>
      </header>

      {s.mode === 'voice' ? (
        <>
          <main className="ax-stage" data-state={v.state}>
            <div className="ax-light">
              <Orb state={v.state} levels={v.levels} size={card ? 76 : 168} label={s.line} />
            </div>
            <p className="ax-state" role="status">{v.state === 'error' ? '' : s.line}</p>
            {v.note ? <p className="ax-soft">{v.note}</p> : null}

            {v.state === 'error' ? (
              <div className="ax-error">
                <p>{v.error?.message}</p>
                <div className="ax-row">
                  <button type="button" className="ax-btn ax-btn--primary" onClick={() => v.start()}><RotateCcw size={18} strokeWidth={1.75} aria-hidden="true" />לנסות שוב</button>
                  <button type="button" className="ax-btn" onClick={s.toText}>לכתוב במקום</button>
                </div>
              </div>
            ) : (
              <div className="ax-lines" aria-live="polite">
                {s.lastUser ? <p className="ax-you" dir="auto">{s.lastUser.text}</p> : !s.lastAtlas ? <p className="ax-soft ax-hint">שאלו מי מגיע היום, מה פנוי בסוף השבוע או כמה נכנס החודש.</p> : null}
                {s.lastAtlas && !card ? <article className="ax-answer" dir="auto">{s.lastAtlas.text}</article> : null}
              </div>
            )}

            {card ? (
              <div className="ax-card">
                {s.lastAtlas ? <p className="ax-card-say" dir="auto">{s.lastAtlas.text}</p> : null}
                <ProposalCard p={card.p} page={page} compact onNavigate={() => { close(); onNavigate?.(); }} onResolve={(st, r) => v.resolveProposal(card.i, st, r)} />
              </div>
            ) : null}
            {!card && v.state !== 'error' ? <NextStep step={s.step} onAsk={s.ask} /> : null}
          </main>

          <footer className="ax-controls">
            <button type="button" className={`ax-round${v.muted ? ' is-on' : ''}`} onClick={v.toggleMute} aria-pressed={v.muted} aria-label={v.muted ? 'ביטול השתקה' : 'השתקת המיקרופון'} disabled={!live}>
              {v.muted ? <MicOff size={24} strokeWidth={1.75} aria-hidden="true" /> : <Mic size={24} strokeWidth={1.75} aria-hidden="true" />}
            </button>
            {live ? (
              <button type="button" className="ax-round ax-round--end" onClick={() => v.end()} aria-label="סיום השיחה הקולית"><Square size={22} strokeWidth={2} fill="currentColor" aria-hidden="true" /></button>
            ) : (
              <button type="button" className="ax-round ax-round--go" onClick={s.toVoice} aria-label="שיחה קולית חדשה"><Mic size={26} strokeWidth={1.9} aria-hidden="true" /></button>
            )}
            <button type="button" className="ax-round" onClick={s.toText} aria-label="מעבר לכתיבה"><Keyboard size={24} strokeWidth={1.75} aria-hidden="true" /></button>
          </footer>
          <p className="ax-fine">{v.demo ? 'הדגמה: השיחה מתוסרטת מהנתונים בדפדפן הזה.' : 'פעולות קורות רק אחרי אישור שלכם. השמע לא נשמר.'}</p>
        </>
      ) : (
        <>
          <main className="ax-thread" ref={scrollRef}>
            <div className="ax-col as-root ax-ink">
              {s.notice ? (
                <section className="ax-notice" role="status">
                  <p className="ax-notice-title">{s.notice.text}</p>
                  {s.notice.how ? <p className="ax-notice-how">{s.notice.how}</p> : null}
                  {s.notice.code === 'mic_denied' || s.notice.code === 'mic_missing' ? (
                    <button type="button" className="ax-btn ax-btn--small" onClick={s.toVoice}><Mic size={18} strokeWidth={1.75} aria-hidden="true" />לנסות שוב בדיבור</button>
                  ) : null}
                </section>
              ) : null}
              {!t.messages.length ? (
                <div className="ax-empty">
                  <p className="ax-empty-title">במה נתחיל?</p>
                  <div className="ax-chips">{s.starters.map((o) => <button key={o.ask} type="button" className="ax-chip" onClick={() => s.ask(o.ask)}>{o.label}</button>)}</div>
                </div>
              ) : t.messages.map((m) => (m.role === 'user'
                ? <p key={m.id} className="ax-q" dir="auto">{m.content}</p>
                : <Answer key={m.id} msg={m} onRetry={t.retry} onNavigate={() => { close(); onNavigate?.(); }} last={false} onResolve={t.resolveProposal} page={page} />))}
              {s.step ? <NextStep step={s.step} onAsk={s.ask} /> : null}
            </div>
          </main>
          <div className="ax-dock as-root ax-ink">
            <Composer onSend={s.ask} onStop={t.stop} busy={t.busy} inputRef={inputRef} autoFocus={!s.notice} placeholder="כתבו שאלה" onVoice={s.notice?.code === 'not_configured' || s.notice?.code === 'voice_not_ready' ? null : s.toVoice} />
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
