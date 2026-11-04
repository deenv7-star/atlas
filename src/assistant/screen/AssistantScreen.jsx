/**
 * "דברו עם atlas" v3, design A — "בשמיים": the Today sky continues behind, and atlas herself floats in it, big and
 * alive (Character.jsx). She flies up out of the tab bar when you tap her. While you talk she leans in; while she
 * thinks she glances around; when she answers she bounces with her voice and the answer rises out of her as a
 * frosted speech card with a tail, followed by the live card (today's arrivals, balances, a booking sliding into
 * the calendar).
 * She always fills the free sky (useSkyFit): the conversation sits at the bottom, just above the dock, and atlas
 * takes the space above it, centred, and only shrinks when the conversation needs the room. While she hears you,
 * thinks or speaks she comes closer (bigger), and while she thinks her answer card is already rising under her
 * (a quiet placeholder that turns into the real answer). Transforms only (y + scale), springs, still under reduced motion.
 * Opens in voice; "כתיבה" is one tap away; falls back to writing on its own when the mic is not available.
 * RTL, Heebo, 44px+ targets, 16px inputs, transform/opacity motion, still under reduced motion.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion, MotionConfig } from 'framer-motion';
import { X, Mic, MicOff, Square, RotateCcw, Keyboard } from 'lucide-react';
import { Answer, Composer } from '../ui.jsx';
import { useScreen, usePinnedBottom } from './useScreen.js';
import { Character } from './Character.jsx';
import { DataCard, LiveProposal, SPRING, SOFT } from './LiveCards.jsx';
import { PERSONA } from '../../../supabase/functions/_shared/brain/persona.js'; // she/we: one switch (ATLAS_PERSON)
import './screen-a3.css';

const minutes = (s) => (s == null ? null : Math.max(0, Math.floor(s / 60)));
const SKY = '/app-bg/today-hills';
const COMPACT = 140;       // the strip atlas keeps above a long conversation
const FOCUS = new Set(['hearing', 'thinking', 'speaking']); // she comes closer

/**
 * Where atlas sits and how big she is, from the sky the conversation leaves free:
 * region = COMPACT + (scroller height − conversation height). Her group (face + caption) is centred in it, a little
 * above the middle. Measured with ResizeObserver, so new cards, chips, the keyboard and rotation all re-fit her.
 */
function useSkyFit({ bodyRef, colRef, capRef, size, focus, talked }) {
  const est = () => (typeof window === 'undefined' ? 560 : Math.max(COMPACT, window.innerHeight - 200));
  const [m, setM] = useState(() => ({ region: est(), cap: 44 }));
  useLayoutEffect(() => {
    const body = bodyRef.current; const col = colRef.current; const cap = capRef.current;
    if (!body || !col || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const free = body.clientHeight - COMPACT - col.offsetHeight;
      const next = { region: Math.round(COMPACT + Math.max(0, free)), cap: Math.round(cap?.offsetHeight || 44) };
      setM((o) => (Math.abs(o.region - next.region) < 2 && o.cap === next.cap ? o : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    [body, col, cap].forEach((e) => e && ro.observe(e));
    return () => ro.disconnect();
  }, [bodyRef, colRef, capRef]);
  const PAD_T = 4; const PAD_B = 14; const GAP = 10;
  const max = focus ? 1 : 0.87;           // idle/listening 0.87 × size; hearing/thinking/speaking full size
  const min = 84 / size;                   // never smaller than the compact face
  const room = m.region - PAD_T - PAD_B - GAP - m.cap;
  const scale = Math.max(min, Math.min(max, room / size));
  const group = size * scale + GAP + m.cap;
  // alone: optical centre, a touch high. In a conversation: closer to it, so her answer reads as coming from her
  const top = PAD_T + Math.max(0, m.region - PAD_T - PAD_B - group) * (talked ? 0.64 : 0.44);
  return { scale, y: Math.round(top), capY: Math.round(top + size * scale + GAP), region: m.region };
}

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
  const bodyRef = useRef(null);
  const colRef = useRef(null);
  const capRef = useRef(null);
  // rendered at her largest (focus) size and scaled down, so she is never upscaled (crisp on 3x screens)
  const [big] = useState(() => (typeof window === 'undefined' ? 212 : window.innerHeight < 720 ? 156 : window.innerHeight >= 860 && window.innerWidth >= 1024 ? 236 : 212));

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
  const caption = s.mode === 'text' ? (s.notice ? PERSONA.writeHere : t.busy ? PERSONA.states.thinking : PERSONA.writeToMe) : v.state === 'error' ? 'השיחה נעצרה' : s.line;
  const charState = s.mode === 'text' ? (t.busy ? 'thinking' : s.notice ? 'error' : 'idle') : v.state;
  const charMood = s.notice && s.mode === 'text' ? 'concerned' : s.feel.mood;
  const fit = useSkyFit({ bodyRef, colRef, capRef, size: big, focus: FOCUS.has(charState), talked });
  // her answer is already on its way: a quiet card rises under her while she thinks, and becomes the answer
  const atlasN = v.turns.filter((x) => x.role === 'atlas').length;
  const pending = s.mode === 'voice' && v.state === 'thinking' && lastV?.role === 'user';
  const lastAtlasId = [...v.turns].reverse().find((x) => x.role === 'atlas')?.id;
  // while the conversation still fits under her, older lines glide up as a new one arrives (no jump);
  // once it scrolls, plain scrolling takes over. After a glide the scroller re-pins to the newest line.
  const glide = s.mode === 'voice' && !reduce && fit.region > COMPACT + 8;
  const repin = () => { const el = scrollRef.current; if (el && pinned.current) el.scrollTop = el.scrollHeight; };
  const wasPending = useRef(false);
  const grew = useRef(null); // the answer that grew out of the placeholder: no second entrance, its words fade in
  if (wasPending.current && !pending && lastV?.role === 'atlas' && grew.current !== lastV.id) grew.current = lastV.id;
  useEffect(() => { wasPending.current = pending; }, [pending]);

  return createPortal(
    <MotionConfig reducedMotion="user">
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

      <div className="a3-body" ref={bodyRef}>
      <section className="a3-stage" data-state={charState} data-focus={FOCUS.has(charState) || undefined} aria-label="atlas">
        <motion.div className="a3-char" style={{ width: big, height: big, marginLeft: -big / 2 }} initial={false} animate={{ y: fit.y, scale: fit.scale }} transition={SOFT}>
          <i className="a3-aura" aria-hidden="true" />
          <Character size={big} state={charState} levels={v.levels} mood={charMood} pulse={s.feel.pulse} gaze={gaze} from={from} label={`atlas, ${caption}`} />
        </motion.div>
        <motion.div ref={capRef} className="a3-caption" role="status" initial={false} animate={{ y: fit.capY }} transition={SOFT}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p key={caption} className="a3-state" initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }} transition={SOFT}>{caption}</motion.p>
          </AnimatePresence>
          {!talked && s.mode === 'voice' ? <p className="a3-hint">{s.owner ? `היי ${s.owner}, ` : ''}אפשר לשאול מי מגיע היום, מה פנוי בסוף השבוע, {PERSONA.hintPrepare}.</p> : null}
          {v.note ? <p className="a3-hint">{v.note}</p> : null}
        </motion.div>
      </section>

      <motion.main className="a3-scroll" ref={scrollRef} layoutScroll>
        <div className="a3-fill">
        <motion.div className="a3-col" ref={colRef} layout={glide ? 'position' : false} transition={SOFT} onLayoutAnimationComplete={repin}>
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
                      <motion.li key={x.id} data-new className="a3-said" {...(x.id === lastAtlasId && grew.current === x.id ? { initial: false } : rise)}>
                        <motion.div layoutId={x.id === lastAtlasId ? `a3-said-${atlasN - 1}` : undefined} transition={SOFT} className="lc a3-bubble" dir="auto">
                          <motion.span className="a3-bubble-text" initial={grew.current === x.id ? { opacity: 0, y: 6 } : false} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT, delay: 0.06 }}>{x.text}</motion.span>
                        </motion.div>
                        {x.final ? <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.18 }}><DataCard kind={s.cardOf(v.turns, i)} f={facts} onNavigate={go} /></motion.div> : null}
                      </motion.li>
                    )))}
                  {pending ? (
                    <motion.li key="a3-pending" className="a3-said" initial={{ opacity: 0, y: -28, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...SPRING, delay: 0.12 }}>
                      <motion.div layoutId={`a3-said-${atlasN}`} transition={SOFT} className="lc a3-bubble a3-wait" aria-hidden="true"><i /><i /><i /></motion.div>
                    </motion.li>
                  ) : null}
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
        </motion.div>
        </div>
      </motion.main>
      </div>

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
          <Composer onSend={s.ask} onStop={t.stop} busy={t.busy} inputRef={inputRef} autoFocus={!s.notice} placeholder={PERSONA.placeholder} onVoice={s.notice?.code === 'not_configured' || s.notice?.code === 'voice_not_ready' ? null : s.toVoice} />
        </div>
      )}
    </div>
    </MotionConfig>,
    document.body,
  );
}
