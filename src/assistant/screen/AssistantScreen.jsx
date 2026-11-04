/**
 * "דברו עם atlas" v2, design B — "הבמה": a calm light room with one navy stage at the top where the voice lives
 * as a line of light. Under it, the whole conversation reads like a clean transcript: what the owner said in a
 * quiet line, each answer in a white card, a proposal as a card that waits for "אישור", and one next step.
 * Opens straight into voice; "כתיבה" is one tap away and the screen falls back to writing on its own.
 * RTL, Heebo, 44px+ targets, 16px inputs, transform/opacity motion only, still under reduced motion.
 */
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Mic, MicOff, Square, RotateCcw, Keyboard } from 'lucide-react';
import { ProposalCard } from '../ProposalCard.jsx';
import { Answer, Composer } from '../ui.jsx';
import { useScreen, usePinnedBottom } from './useScreen.js';
import { Wave } from './Wave.jsx';
import './screen-b.css';

const minutes = (s) => (s == null ? null : Math.max(0, Math.floor(s / 60)));

function ModeSwitch({ mode, onVoice, onText }) {
  return (
    <div className="bx-switch" role="group" aria-label="איך לשאול">
      <button type="button" aria-pressed={mode === 'voice'} onClick={mode === 'voice' ? undefined : onVoice}><Mic size={17} strokeWidth={1.9} aria-hidden="true" />דיבור</button>
      <button type="button" aria-pressed={mode === 'text'} onClick={mode === 'text' ? undefined : onText}><Keyboard size={17} strokeWidth={1.9} aria-hidden="true" />כתיבה</button>
    </div>
  );
}

/** The next step card: one suggestion (or 2-3 starters). Tapping only asks; a proposal still waits for אישור. */
function NextStep({ step, onAsk }) {
  if (!step || (!step.ask && !step.options?.length)) return null;
  return (
    <section className="bx-next" aria-label="הצעד הבא">
      <p className="bx-next-k">הצעד הבא</p>
      <p className="bx-next-line">{step.line}</p>
      <div className="bx-chips">
        {step.ask
          ? <button type="button" className="bx-chip bx-chip--go" onClick={() => onAsk(step.ask)}>{step.label}</button>
          : step.options.map((o) => <button key={o.ask} type="button" className="bx-chip" onClick={() => onAsk(o.ask)}>{o.label}</button>)}
      </div>
    </section>
  );
}

export default function AssistantScreen({ facts, page, onClose, onNavigate }) {
  const s = useScreen({ facts, page });
  const { v, t } = s;
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
    document.documentElement.classList.add('as-lock');
    const onKey = (e) => { if (e.key === 'Escape') { v.end(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.documentElement.classList.remove('as-lock'); document.removeEventListener('keydown', onKey); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const lastV = v.turns[v.turns.length - 1];
  const pinned = usePinnedBottom(scrollRef, [s.mode]);
  useEffect(() => { // to the newest line, again once cards have laid out
    const el = scrollRef.current; if (!el) return undefined;
    pinned.current = true;
    el.scrollTo({ top: el.scrollHeight });
    const id = setTimeout(() => el.scrollTo({ top: el.scrollHeight }), 320);
    return () => clearTimeout(id);
  },
    [t.messages.length, t.messages[t.messages.length - 1]?.content, v.turns.length, lastV?.text, v.proposals.length, s.mode, s.step?.line]);

  const close = () => { v.end(); onClose(); };
  const go = () => { close(); onNavigate?.(); };
  const cards = v.proposals.map((p, i) => ({ p, i })).filter(({ p }) => p.state !== 'dismissed');
  const mins = minutes(v.left);
  const live = ['listening', 'hearing', 'thinking', 'speaking', 'connecting'].includes(v.state);

  return createPortal(
    <div ref={rootRef} tabIndex={-1} className={`bx bx--${s.mode}`} role="dialog" aria-modal="true" aria-label="דברו עם atlas" dir="rtl">
      <header className="bx-top">
        <button type="button" className="bx-icon" onClick={close} aria-label="סגירה"><X size={22} strokeWidth={1.75} /></button>
        <ModeSwitch mode={s.mode} onVoice={s.toVoice} onText={s.toText} />
        <p className="bx-meta" aria-live="off">{v.demo ? 'הדגמה' : s.mode === 'voice' && mins != null ? `${mins} דק׳` : ''}</p>
      </header>

      {s.mode === 'voice' ? (
        <section className="bx-stage" data-state={v.state} aria-label="השיחה הקולית">
          <p className="bx-state" role="status"><i className="bx-dot" aria-hidden="true" />{v.state === 'error' ? 'השיחה נעצרה' : s.line}</p>
          <Wave state={v.state} levels={v.levels} height={88} label={s.line} />
          {v.note ? <p className="bx-stage-note">{v.note}</p> : <p className="bx-stage-note" aria-hidden={!s.lastUser}>{v.state === 'hearing' ? 'מדברים…' : ''}</p>}
        </section>
      ) : null}

      <main className="bx-scroll" ref={scrollRef}>
        <div className="bx-col">
          {s.mode === 'voice' ? (
            v.state === 'error' ? (
              <section className="bx-card bx-error">
                <p>{v.error?.message}</p>
                <div className="bx-row">
                  <button type="button" className="bx-btn bx-btn--primary" onClick={() => v.start()}><RotateCcw size={18} strokeWidth={1.75} aria-hidden="true" />לנסות שוב</button>
                  <button type="button" className="bx-btn" onClick={s.toText}>לכתוב במקום</button>
                </div>
              </section>
            ) : (
              <>
                {!v.turns.length ? <p className="bx-hint">אפשר לשאול מי מגיע היום, מה פנוי בסוף השבוע או כמה נכנס החודש.</p> : null}
                <ol className="bx-turns" aria-live="polite">
                  {v.turns.map((x) => (x.role === 'user'
                    ? <li key={x.id} className="bx-you" dir="auto">{x.text}</li>
                    : <li key={x.id} className="bx-card bx-atlas" dir="auto">{x.text}</li>))}
                </ol>
                {cards.map(({ p, i }) => (
                  <div key={i} className="bx-pc"><ProposalCard p={p} page={page} onNavigate={go} onResolve={(st, r) => v.resolveProposal(i, st, r)} /></div>
                ))}
                {!cards.some(({ p }) => p.state === 'proposed') ? <NextStep step={s.step} onAsk={s.ask} /> : null}
              </>
            )
          ) : (
            <div className="as-root bx-ink">
              {s.notice ? (
                <section className="bx-notice" role="status">
                  <span className="bx-notice-ic" aria-hidden="true"><MicOff size={20} strokeWidth={1.75} /></span>
                  <div>
                    <p className="bx-notice-title">{s.notice.text}</p>
                    {s.notice.how ? <p className="bx-notice-how">{s.notice.how}</p> : null}
                    {s.notice.code === 'mic_denied' || s.notice.code === 'mic_missing' ? (
                      <button type="button" className="bx-btn bx-btn--small" onClick={s.toVoice}><Mic size={18} strokeWidth={1.75} aria-hidden="true" />לנסות שוב בדיבור</button>
                    ) : null}
                  </div>
                </section>
              ) : null}
              {!t.messages.length ? (
                <section className="bx-next bx-next--start" aria-label="במה נתחיל">
                  <p className="bx-next-line bx-next-line--big">במה נתחיל?</p>
                  <div className="bx-chips">{s.starters.map((o) => <button key={o.ask} type="button" className="bx-chip" onClick={() => s.ask(o.ask)}>{o.label}</button>)}</div>
                </section>
              ) : t.messages.map((m) => (m.role === 'user'
                ? <p key={m.id} className="bx-you bx-you--t" dir="auto">{m.content}</p>
                : <div key={m.id} className="bx-card bx-card--t"><Answer msg={m} onRetry={t.retry} onNavigate={go} last={false} onResolve={t.resolveProposal} page={page} /></div>))}
              {s.step ? <NextStep step={s.step} onAsk={s.ask} /> : null}
            </div>
          )}
        </div>
      </main>

      {s.mode === 'voice' ? (
        <footer className="bx-dock">
          <div className="bx-bar">
            <button type="button" className={`bx-ctl${v.muted ? ' is-on' : ''}`} onClick={v.toggleMute} aria-pressed={v.muted} aria-label={v.muted ? 'ביטול השתקה' : 'השתקת המיקרופון'} disabled={!live}>
              {v.muted ? <MicOff size={22} strokeWidth={1.75} aria-hidden="true" /> : <Mic size={22} strokeWidth={1.75} aria-hidden="true" />}
            </button>
            {live
              ? <button type="button" className="bx-main" onClick={() => v.end()} aria-label="סיום השיחה הקולית"><Square size={20} strokeWidth={2} fill="currentColor" aria-hidden="true" /><span>סיום</span></button>
              : <button type="button" className="bx-main" onClick={s.toVoice} aria-label="שיחה קולית חדשה"><Mic size={22} strokeWidth={1.9} aria-hidden="true" /><span>לדבר</span></button>}
            <button type="button" className="bx-ctl" onClick={s.toText} aria-label="מעבר לכתיבה"><Keyboard size={22} strokeWidth={1.75} aria-hidden="true" /></button>
          </div>
          <p className="bx-fine">{v.demo ? 'הדגמה: השיחה מתוסרטת מהנתונים בדפדפן הזה.' : 'פעולות קורות רק אחרי אישור שלכם. השמע לא נשמר.'}</p>
        </footer>
      ) : (
        <div className="bx-dock bx-dock--t as-root">
          <Composer onSend={s.ask} onStop={t.stop} busy={t.busy} inputRef={inputRef} autoFocus={!s.notice} placeholder="כתבו שאלה" onVoice={s.notice?.code === 'not_configured' || s.notice?.code === 'voice_not_ready' ? null : s.toVoice} />
        </div>
      )}
    </div>,
    document.body,
  );
}
