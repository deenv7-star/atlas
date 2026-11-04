/**
 * "דברו עם atlas" v3, design B — "על הקצה": the Today sky up top carries one big live caption (what you say,
 * then what she says, Gemini-Live style); below, a frosted sheet holds the conversation — and atlas sits ON the
 * sheet's top edge, alive (Character.jsx). She leans over the edge while you talk, glances around while she
 * thinks, bounces on the edge while she speaks; a line of indigo light along the edge stretches with the voice
 * (iOS edge glow, in atlas colours). She flies out of the tab bar onto the edge when you tap her, and the whole
 * sheet (with her on it) rises when the conversation needs room. Cards slide out from under her into the sheet.
 * Opens in voice; "כתיבה" is one tap away; falls back to writing when the mic is not available.
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
import './screen-b3.css';

const minutes = (s) => (s == null ? null : Math.max(0, Math.floor(s / 60)));
const SKY = '/app-bg/today-hills';

function tabRect() {
  if (typeof document === 'undefined') return null;
  const el = [...document.querySelectorAll('.y2-ta-disc, .y2-gb--face')].find((e) => e.offsetParent);
  const r = el?.getBoundingClientRect();
  return r && r.width ? r : null;
}

/** The edge light: stretches and brightens with the live voice level (mic while you talk, hers while she speaks). */
function EdgeGlow({ state, levels }) {
  const ref = useRef(null);
  const st = useRef(state); st.current = state;
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current; if (!el || reduce) return undefined;
    let raf = 0; let v = 0.2;
    const tick = (now) => {
      const s = st.current; const { mic = 0, out = 0 } = levels?.() || {};
      const t = now / 1000;
      const target = s === 'hearing' ? 0.35 + mic * 0.9 : s === 'speaking' ? 0.4 + out * 0.9 : s === 'thinking' || s === 'connecting' ? 0.28 + 0.12 * Math.sin(t * 4) : s === 'listening' ? 0.24 : 0.12;
      v += (target - v) * 0.16;
      el.style.transform = `scaleX(${Math.min(1, v).toFixed(3)})`;
      el.style.opacity = String(Math.min(1, 0.25 + v).toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [levels, reduce]);
  return <i ref={ref} className="b3-edge" aria-hidden="true" />;
}

function ModeSwitch({ mode, onVoice, onText }) {
  return (
    <div className="b3-switch" role="group" aria-label="איך לשאול">
      <button type="button" aria-pressed={mode === 'voice'} onClick={mode === 'voice' ? undefined : onVoice}>
        {mode === 'voice' ? <motion.i layoutId="b3-sw" className="b3-sw-on" transition={SPRING} /> : null}<Mic size={17} strokeWidth={1.9} aria-hidden="true" /><span>דיבור</span>
      </button>
      <button type="button" aria-pressed={mode === 'text'} onClick={mode === 'text' ? undefined : onText}>
        {mode === 'text' ? <motion.i layoutId="b3-sw" className="b3-sw-on" transition={SPRING} /> : null}<Keyboard size={17} strokeWidth={1.9} aria-hidden="true" /><span>כתיבה</span>
      </button>
    </div>
  );
}

function NextStep({ step, onAsk }) {
  if (!step || (!step.ask && !step.options?.length)) return null;
  return (
    <motion.section className="b3-next" aria-label="הצעד הבא" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT, delay: 0.2 }}>
      <p className="b3-next-line">{step.line}</p>
      <div className="b3-chips">
        {step.ask
          ? <button type="button" className="b3-chip b3-chip--go" onClick={() => onAsk(step.ask)}>{step.label}</button>
          : step.options.map((o) => <button key={o.ask} type="button" className="b3-chip" onClick={() => onAsk(o.ask)}>{o.label}</button>)}
      </div>
    </motion.section>
  );
}

/** Cards slide out from under atlas into the sheet. */
const slide = { initial: { opacity: 0, y: -28, scale: 0.94 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: SPRING };

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
  const [vh] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight));

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

  // she looks down at whatever just slid into the sheet
  useEffect(() => {
    const id = setTimeout(() => {
      const el = scrollRef.current?.querySelector('[data-new]:last-of-type') || scrollRef.current?.lastElementChild;
      const r = el?.getBoundingClientRect(); if (!r) return;
      setGaze({ x: r.left + r.width / 2, y: Math.min(r.top + 40, (typeof window !== 'undefined' ? window.innerHeight : 800) - 80) });
      setTimeout(() => setGaze(null), 1300);
    }, 380);
    return () => clearTimeout(id);
  }, [v.turns.length, v.proposals.length, t.messages.length]);

  const close = () => { v.end(); if (reduce) { onClose(); return; } setClosing(true); setTimeout(onClose, 300); };
  const go = () => { v.end(); onClose(); onNavigate?.(); };
  const cards = v.proposals.map((p, i) => ({ p, i }));
  const mins = minutes(v.left);
  const live = ['listening', 'hearing', 'thinking', 'speaking', 'connecting'].includes(v.state);
  const talked = s.mode === 'text' ? t.messages.length > 0 || !!s.notice : v.turns.length > 0 || v.state === 'error';

  // the big live caption in the sky
  const lastUser = [...v.turns].reverse().find((x) => x.role === 'user');
  const lastAtlas = [...v.turns].reverse().find((x) => x.role === 'atlas');
  let big; let small;
  if (s.mode === 'text') { big = s.notice ? 'אפשר לכתוב לי' : t.busy ? 'רגע, חושבת…' : (s.owner ? `היי ${s.owner}, אני כאן` : 'אני כאן'); small = s.notice ? '' : 'כתבו מה צריך, ואני אבדוק'; }
  else if (v.state === 'error') { big = 'השיחה נעצרה'; small = ''; }
  else if (v.state === 'hearing') { big = 'שומעת אתכם…'; small = ''; }
  else if (v.state === 'thinking' || v.state === 'connecting') { big = s.line ? `${s.line}…` : 'רגע…'; small = lastUser ? `„${lastUser.text}”` : ''; }
  else if (v.state === 'speaking' && lastAtlas) { big = lastAtlas.text.split(/(?<=[.?!])\s/)[0]; small = ''; }
  else if (!v.turns.length) { big = s.owner ? `היי ${s.owner}, במה לעזור?` : 'במה לעזור?'; small = 'מי מגיע היום, מה פנוי בסוף השבוע, או "תכיני הזמנה"'; }
  else { big = s.line; small = ''; }
  if (v.note && s.mode === 'voice') small = v.note;

  const charState = s.mode === 'text' ? (t.busy ? 'thinking' : s.notice ? 'error' : 'idle') : v.state;
  const charMood = s.notice && s.mode === 'text' ? 'concerned' : s.feel.mood;
  const sheetTop = Math.round(talked ? Math.max(250, vh * 0.32) : Math.max(300, vh * 0.46));

  return createPortal(
    <div ref={rootRef} tabIndex={-1} className={`b3 b3--${s.mode}${talked ? ' is-talk' : ''}${closing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-label="דברו עם atlas" dir="rtl">
      <div className="b3-sky" aria-hidden="true">
        <picture>
          <source type="image/avif" media="(min-width: 768px)" srcSet={`${SKY}-d.avif`} />
          <source type="image/avif" srcSet={`${SKY}-m.avif`} />
          <source type="image/webp" media="(min-width: 768px)" srcSet={`${SKY}-d.webp`} />
          <source type="image/webp" srcSet={`${SKY}-m.webp`} />
          <img src={`${SKY}-m.jpg`} alt="" decoding="async" draggable={false} />
        </picture>
      </div>

      <header className="b3-top">
        <button type="button" className="b3-icon" onClick={close} aria-label="סגירה"><X size={22} strokeWidth={1.8} /></button>
        <ModeSwitch mode={s.mode} onVoice={s.toVoice} onText={s.toText} />
        <p className="b3-meta" aria-live="off">{v.demo ? 'הדגמה' : s.mode === 'voice' && mins != null ? `${mins} דק׳` : ''}</p>
      </header>

      <motion.div className="b3-say" role="status" aria-live="polite" initial={false} animate={{ height: sheetTop - 92 }} transition={SOFT}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p key={big} className={`b3-big${talked ? ' is-small' : ''}`} dir="auto" initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }} transition={SOFT}>{big}</motion.p>
        </AnimatePresence>
        {small ? <motion.p key={`s${small}`} className="b3-small" dir="auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...SOFT, delay: 0.1 }}>{small}</motion.p> : null}
      </motion.div>

      <motion.div className="b3-sheet" initial={reduce ? false : { y: vh }} animate={{ y: 0, top: sheetTop }} transition={{ ...SOFT, delay: 0.04 }} style={{ top: sheetTop }}>
        <div className="b3-perch" data-state={charState}>
          <Character size={128} state={charState} levels={v.levels} mood={charMood} pulse={s.feel.pulse} gaze={gaze} from={from} label={`atlas, ${s.mode === 'voice' ? s.line : 'כתיבה'}`} />
        </div>
        <EdgeGlow state={charState} levels={v.levels} />

        <main className="b3-scroll" ref={scrollRef}>
          <div className="b3-col">
            {s.mode === 'voice' ? (
              v.state === 'error' ? (
                <motion.section className="lc b3-error" {...slide}>
                  <p>{v.error?.message}</p>
                  <div className="b3-row">
                    <button type="button" className="lc-btn lc-btn--ok" onClick={() => v.start()}><RotateCcw size={18} strokeWidth={1.9} aria-hidden="true" />לנסות שוב</button>
                    <button type="button" className="lc-btn" onClick={s.toText}>לכתוב במקום</button>
                  </div>
                </motion.section>
              ) : (
                <>
                  {!v.turns.length ? <p className="b3-empty">פעולות קורות רק אחרי אישור שלכם.</p> : null}
                  <ol className="b3-turns">
                    {v.turns.map((x, i) => (x.role === 'user'
                      ? <motion.li key={x.id} data-new className="b3-you" dir="auto" initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING}>{x.text}</motion.li>
                      : (
                        <motion.li key={x.id} data-new className="b3-said" {...slide}>
                          <p className="b3-text" dir="auto">{x.text}</p>
                          {x.final ? <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.16 }}><DataCard kind={s.cardOf(v.turns, i)} f={facts} onNavigate={go} /></motion.div> : null}
                        </motion.li>
                      )))}
                  </ol>
                  {cards.map(({ p, i }) => (
                    <motion.div key={`p${i}`} data-new className="b3-act" {...slide} transition={{ ...SPRING, delay: 0.1 }}>
                      <LiveProposal p={p} page={page} onNavigate={go} onResolve={(st, r) => s.resolveVoice(i, st, r)} />
                    </motion.div>
                  ))}
                  {!cards.some(({ p }) => p.state === 'proposed') ? <NextStep step={s.step} onAsk={s.ask} /> : null}
                </>
              )
            ) : (
              <div className="as-root b3-ink">
                {s.notice ? (
                  <motion.section className="lc b3-notice" role="status" {...slide}>
                    <span className="lc-ic" aria-hidden="true"><MicOff size={20} strokeWidth={1.8} /></span>
                    <div>
                      <p className="b3-notice-title">{s.notice.text}</p>
                      {s.notice.how ? <p className="lc-fine">{s.notice.how}</p> : null}
                      {s.notice.code === 'mic_denied' || s.notice.code === 'mic_missing' ? (
                        <button type="button" className="lc-btn b3-retry" onClick={s.toVoice}><Mic size={18} strokeWidth={1.8} aria-hidden="true" />לנסות שוב בדיבור</button>
                      ) : null}
                    </div>
                  </motion.section>
                ) : null}
                {!t.messages.length ? (
                  <section className="b3-next b3-next--start" aria-label="במה נתחיל">
                    <p className="b3-next-line">אפשר להתחיל מכאן:</p>
                    <div className="b3-chips">{s.starters.map((o) => <button key={o.ask} type="button" className="b3-chip" onClick={() => s.ask(o.ask)}>{o.label}</button>)}</div>
                  </section>
                ) : t.messages.map((m, i) => (m.role === 'user'
                  ? <motion.p key={m.id} data-new className="b3-you" dir="auto" initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING}>{m.content}</motion.p>
                  : (
                    <motion.div key={m.id} data-new className="b3-said" {...slide}>
                      <div className="b3-text b3-text--t"><Answer msg={m} onRetry={t.retry} onNavigate={go} last={false} onResolve={s.resolveText} page={page} /></div>
                      {m.status === 'done' ? <DataCard kind={s.cardOf(t.messages, i)} f={facts} onNavigate={go} /> : null}
                    </motion.div>
                  )))}
                {s.step ? <NextStep step={s.step} onAsk={s.ask} /> : null}
              </div>
            )}
          </div>
        </main>

        {s.mode === 'voice' ? (
          <footer className="b3-dock">
            <button type="button" className={`b3-ctl${v.muted ? ' is-on' : ''}`} onClick={v.toggleMute} aria-pressed={v.muted} aria-label={v.muted ? 'ביטול השתקה' : 'השתקת המיקרופון'} disabled={!live}>
              {v.muted ? <MicOff size={22} strokeWidth={1.8} aria-hidden="true" /> : <Mic size={22} strokeWidth={1.8} aria-hidden="true" />}
            </button>
            {live
              ? <button type="button" className="b3-main" onClick={() => v.end()} aria-label="סיום השיחה הקולית"><Square size={20} strokeWidth={2} fill="currentColor" aria-hidden="true" /><span>סיום</span></button>
              : <button type="button" className="b3-main" onClick={s.toVoice} aria-label="שיחה קולית חדשה"><Mic size={22} strokeWidth={1.9} aria-hidden="true" /><span>לדבר</span></button>}
            <button type="button" className="b3-ctl" onClick={s.toText} aria-label="מעבר לכתיבה"><Keyboard size={22} strokeWidth={1.8} aria-hidden="true" /></button>
            {v.demo ? <p className="b3-fine">הדגמה: השיחה מתוסרטת מהנתונים בדפדפן הזה.</p> : null}
          </footer>
        ) : (
          <div className="b3-dock b3-dock--t as-root">
            <Composer onSend={s.ask} onStop={t.stop} busy={t.busy} inputRef={inputRef} autoFocus={!s.notice} placeholder="כתבו לי שאלה" onVoice={s.notice?.code === 'not_configured' || s.notice?.code === 'voice_not_ready' ? null : s.toVoice} />
          </div>
        )}
      </motion.div>
    </div>,
    document.body,
  );
}
