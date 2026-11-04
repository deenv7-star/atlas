/**
 * "דברו עם atlas" v3, design A — "בשמיים": the Today sky continues behind, and atlas herself floats in it, big and
 * alive (Character.jsx). She flies up out of the tab bar when you tap her. While you talk she leans in; while she
 * thinks she glances around; when she answers she bounces with her voice and the answer rises out of her as a
 * frosted speech card with a tail, followed by the live card (today's arrivals, balances, a booking sliding into
 * the calendar). Once there is a conversation she rises to the top and shrinks, still reacting.
 * Opens in voice; "כתיבה" is one tap away; falls back to writing on its own when the mic is not available.
 * RTL, Heebo, 44px+ targets, 16px inputs, transform/opacity motion, still under reduced motion.
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Mic, MicOff, Square, RotateCcw, Keyboard } from 'lucide-react';
import { Answer, Composer } from '../ui.jsx';
import { useScreen, usePinnedBottom } from './useScreen.js';
import { Character } from './Character.jsx';
import { DataCard, LiveProposal, SPRING, SOFT } from './LiveCards.jsx';
import './screen-a3.css';

const minutes = (s) => (s == null ? null : Math.max(0, Math.floor(s / 60)));
const SKY = '/app-bg/today-hills';

function tabRect() {
  if (typeof document === 'undefined') return null;
  const el = [...document.querySelectorAll('.y2-ta-disc, .y2-gb--face')].find((e) => e.offsetParent);
  const r = el?.getBoundingClientRect();
  return r && r.width ? r : null;
}

function ModeSwitch({ mode, onVoice, onText }) {
  return (
    <div className="a3-switch" role="group" aria-label="איך לשאול">
      <button type="button" aria-pressed={mode === 'voice'} onClick={mode === 'voice' ? undefined : onVoice}>
        {mode === 'voice' ? <motion.i layoutId="a3-sw" className="a3-sw-on" transition={SPRING} /> : null}<Mic size={17} strokeWidth={1.9} aria-hidden="true" /><span>דיבור</span>
      </button>
      <button type="button" aria-pressed={mode === 'text'} onClick={mode === 'text' ? undefined : onText}>
        {mode === 'text' ? <motion.i layoutId="a3-sw" className="a3-sw-on" transition={SPRING} /> : null}<Keyboard size={17} strokeWidth={1.9} aria-hidden="true" /><span>כתיבה</span>
      </button>
    </div>
  );
}

function NextStep({ step, onAsk }) {
  if (!step || (!step.ask && !step.options?.length)) return null;
  return (
    <motion.section className="a3-next" aria-label="הצעד הבא" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT, delay: 0.2 }}>
      <p className="a3-next-line">{step.line}</p>
      <div className="a3-chips">
        {step.ask
          ? <button type="button" className="a3-chip a3-chip--go" onClick={() => onAsk(step.ask)}>{step.label}</button>
          : step.options.map((o) => <button key={o.ask} type="button" className="a3-chip" onClick={() => onAsk(o.ask)}>{o.label}</button>)}
      </div>
    </motion.section>
  );
}

/** An answer rises out of atlas: a speech card whose tail points up at her. */
const rise = { initial: { opacity: 0, y: -36, scale: 0.86 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: SPRING };

export default function AssistantScreen({ facts, page, onClose, onNavigate }) {
  const s = useScreen({ facts, page });
  const { v, t } = s;
  const reduce = useReducedMotion();
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [from] = useState(tabRect);
  const [closing, setClosing] = useState(false);
  const [gaze, setGaze] = useState(null);
  const [hero] = useState(() => (typeof window === 'undefined' ? 320 : Math.round(Math.min(340, Math.max(250, window.innerHeight * 0.4)))));

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
    document.documentElement.classList.add('as-lock');
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => { document.documentElement.classList.remove('as-lock'); document.removeEventListener('keydown', onKey); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lastV = v.turns[v.turns.length - 1];
  const pinned = usePinnedBottom(scrollRef, [s.mode]);
  useEffect(() => {
    const el = scrollRef.current; if (!el) return undefined;
    pinned.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
    const id = setTimeout(() => el.scrollTo({ top: el.scrollHeight }), 420);
    return () => clearTimeout(id);
  }, [t.messages.length, t.messages[t.messages.length - 1]?.content, v.turns.length, lastV?.text, v.proposals.length, s.mode, s.step?.line]); // eslint-disable-line react-hooks/exhaustive-deps

  // her eyes go to whatever just appeared
  const lookAtNewest = () => {
    const el = scrollRef.current?.querySelector('[data-new]:last-of-type') || scrollRef.current?.lastElementChild;
    const r = el?.getBoundingClientRect(); if (!r) return;
    setGaze({ x: r.left + r.width / 2, y: r.top + 30 });
    setTimeout(() => setGaze(null), 1300);
  };
  useEffect(() => { const id = setTimeout(lookAtNewest, 380); return () => clearTimeout(id); }, [v.turns.length, v.proposals.length, t.messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => { v.end(); if (reduce) { onClose(); return; } setClosing(true); setTimeout(onClose, 260); };
  const go = () => { v.end(); onClose(); onNavigate?.(); };
  const cards = v.proposals.map((p, i) => ({ p, i }));
  const mins = minutes(v.left);
  const live = ['listening', 'hearing', 'thinking', 'speaking', 'connecting'].includes(v.state);
  const talked = s.mode === 'text' ? t.messages.length > 0 || !!s.notice : v.turns.length > 0 || v.state === 'error';
  const caption = s.mode === 'text' ? (s.notice ? 'אפשר לכתוב לי' : t.busy ? 'רגע, חושבת' : 'כתבו לי') : v.state === 'error' ? 'השיחה נעצרה' : s.line;
  const charState = s.mode === 'text' ? (t.busy ? 'thinking' : s.notice ? 'error' : 'idle') : v.state;
  const charMood = s.notice && s.mode === 'text' ? 'concerned' : s.feel.mood;

  return createPortal(
    <div ref={rootRef} tabIndex={-1} className={`a3 a3--${s.mode}${talked ? ' is-talk' : ''}${closing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-label="דברו עם atlas" dir="rtl">
      <div className="a3-sky" aria-hidden="true">
        <picture>
          <source type="image/avif" media="(min-width: 768px)" srcSet={`${SKY}-d.avif`} />
          <source type="image/avif" srcSet={`${SKY}-m.avif`} />
          <source type="image/webp" media="(min-width: 768px)" srcSet={`${SKY}-d.webp`} />
          <source type="image/webp" srcSet={`${SKY}-m.webp`} />
          <img src={`${SKY}-m.jpg`} alt="" decoding="async" draggable={false} />
        </picture>
        <i className="a3-veil" />
      </div>

      <header className="a3-top">
        <button type="button" className="a3-icon" onClick={close} aria-label="סגירה"><X size={22} strokeWidth={1.8} /></button>
        <ModeSwitch mode={s.mode} onVoice={s.toVoice} onText={s.toText} />
        <p className="a3-meta" aria-live="off">{v.demo ? 'הדגמה' : s.mode === 'voice' && mins != null ? `${mins} דק׳` : ''}</p>
      </header>

      <motion.section className="a3-stage" data-state={charState} aria-label="atlas" initial={false}
        animate={{ height: talked ? 128 : hero }} transition={SOFT}>
        <motion.div className="a3-char" initial={false} animate={{ scale: talked ? 0.5 : 1, y: 0 }} transition={SOFT}>
          <i className="a3-aura" aria-hidden="true" />
          <Character size={184} state={charState} levels={v.levels} mood={charMood} pulse={s.feel.pulse} gaze={gaze} from={from} label={`atlas, ${caption}`} />
        </motion.div>
        <div className="a3-caption" role="status">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p key={caption} className="a3-state" initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }} transition={SOFT}>{caption}</motion.p>
          </AnimatePresence>
          {!talked && s.mode === 'voice' ? <p className="a3-hint">{s.owner ? `היי ${s.owner}, ` : ''}אפשר לשאול מי מגיע היום, מה פנוי בסוף השבוע, או לבקש שאכין הזמנה.</p> : null}
          {v.note ? <p className="a3-hint">{v.note}</p> : null}
        </div>
      </motion.section>

      <main className="a3-scroll" ref={scrollRef}>
        <div className="a3-col">
          {s.mode === 'voice' ? (
            v.state === 'error' ? (
              <motion.section className="lc a3-error" {...rise}>
                <p>{v.error?.message}</p>
                <div className="a3-row">
                  <button type="button" className="lc-btn lc-btn--ok" onClick={() => v.start()}><RotateCcw size={18} strokeWidth={1.9} aria-hidden="true" />לנסות שוב</button>
                  <button type="button" className="lc-btn" onClick={s.toText}>לכתוב במקום</button>
                </div>
              </motion.section>
            ) : (
              <>
                <ol className="a3-turns" aria-live="polite">
                  {v.turns.map((x, i) => (x.role === 'user'
                    ? <motion.li key={x.id} data-new className="a3-you" dir="auto" initial={{ opacity: 0, x: -24, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={SPRING}>{x.text}</motion.li>
                    : (
                      <motion.li key={x.id} data-new className="a3-said" {...rise}>
                        <div className="lc a3-bubble" dir="auto">{x.text}</div>
                        {x.final ? <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.18 }}><DataCard kind={s.cardOf(v.turns, i)} f={facts} onNavigate={go} /></motion.div> : null}
                      </motion.li>
                    )))}
                </ol>
                {cards.map(({ p, i }) => (
                  <motion.div key={`p${i}`} data-new className="a3-act" initial={{ opacity: 0, y: -30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...SPRING, delay: 0.1 }}>
                    <LiveProposal p={p} page={page} onNavigate={go} onResolve={(st, r) => s.resolveVoice(i, st, r)} />
                  </motion.div>
                ))}
                {!cards.some(({ p }) => p.state === 'proposed') ? <NextStep step={s.step} onAsk={s.ask} /> : null}
              </>
            )
          ) : (
            <div className="as-root a3-ink">
              {s.notice ? (
                <motion.section className="lc a3-notice" role="status" {...rise}>
                  <span className="lc-ic" aria-hidden="true"><MicOff size={20} strokeWidth={1.8} /></span>
                  <div>
                    <p className="a3-notice-title">{s.notice.text}</p>
                    {s.notice.how ? <p className="lc-fine">{s.notice.how}</p> : null}
                    {s.notice.code === 'mic_denied' || s.notice.code === 'mic_missing' ? (
                      <button type="button" className="lc-btn a3-retry" onClick={s.toVoice}><Mic size={18} strokeWidth={1.8} aria-hidden="true" />לנסות שוב בדיבור</button>
                    ) : null}
                  </div>
                </motion.section>
              ) : null}
              {!t.messages.length ? (
                <section className="a3-next a3-next--start" aria-label="במה נתחיל">
                  <p className="a3-next-line a3-next-line--big">{s.owner ? `במה נתחיל, ${s.owner}?` : 'במה נתחיל?'}</p>
                  <div className="a3-chips">{s.starters.map((o) => <button key={o.ask} type="button" className="a3-chip" onClick={() => s.ask(o.ask)}>{o.label}</button>)}</div>
                </section>
              ) : t.messages.map((m, i) => (m.role === 'user'
                ? <motion.p key={m.id} data-new className="a3-you a3-you--t" dir="auto" initial={{ opacity: 0, x: -24, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={SPRING}>{m.content}</motion.p>
                : (
                  <motion.div key={m.id} data-new className="a3-said" {...rise}>
                    <div className="lc a3-bubble a3-bubble--t"><Answer msg={m} onRetry={t.retry} onNavigate={go} last={false} onResolve={s.resolveText} page={page} /></div>
                    {m.status === 'done' ? <DataCard kind={s.cardOf(t.messages, i)} f={facts} onNavigate={go} /> : null}
                  </motion.div>
                )))}
              {s.step ? <NextStep step={s.step} onAsk={s.ask} /> : null}
            </div>
          )}
        </div>
      </main>

      {s.mode === 'voice' ? (
        <motion.footer className="a3-dock" initial={reduce ? false : { y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...SPRING, delay: 0.12 }}>
          <div className="a3-bar">
            <button type="button" className={`a3-ctl${v.muted ? ' is-on' : ''}`} onClick={v.toggleMute} aria-pressed={v.muted} aria-label={v.muted ? 'ביטול השתקה' : 'השתקת המיקרופון'} disabled={!live}>
              {v.muted ? <MicOff size={22} strokeWidth={1.8} aria-hidden="true" /> : <Mic size={22} strokeWidth={1.8} aria-hidden="true" />}
            </button>
            {live
              ? <button type="button" className="a3-main" onClick={() => v.end()} aria-label="סיום השיחה הקולית"><Square size={18} strokeWidth={2} fill="currentColor" aria-hidden="true" /><span>סיום</span></button>
              : <button type="button" className="a3-main" onClick={s.toVoice} aria-label="שיחה קולית חדשה"><Mic size={22} strokeWidth={1.9} aria-hidden="true" /><span>לדבר</span></button>}
            <button type="button" className="a3-ctl" onClick={s.toText} aria-label="מעבר לכתיבה"><Keyboard size={22} strokeWidth={1.8} aria-hidden="true" /></button>
          </div>
          <p className="a3-fine">{v.demo ? 'הדגמה: השיחה מתוסרטת מהנתונים בדפדפן הזה.' : 'פעולות קורות רק אחרי אישור שלכם. השמע לא נשמר.'}</p>
        </motion.footer>
      ) : (
        <div className="a3-dock a3-dock--t as-root">
          <Composer onSend={s.ask} onStop={t.stop} busy={t.busy} inputRef={inputRef} autoFocus={!s.notice} placeholder="כתבו לי שאלה" onVoice={s.notice?.code === 'not_configured' || s.notice?.code === 'voice_not_ready' ? null : s.toVoice} />
        </div>
      )}
    </div>,
    document.body,
  );
}
