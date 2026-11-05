/**
 * ייבוא מתחם · Version B: one card per screen. A big question, big taps, a progress strip, one primary button pinned to
 * the bottom. Same flow, questions and saves as version A (useImportFlow); only the pacing and look differ.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, MessageCircle, Mic, Globe } from 'lucide-react';
import { Wordmark } from '@/components/app/shell/shared';
import { HELP_WA } from '@/components/onboarding/v2/ui';
import { firstName } from '@/components/onboarding/y/model';
import { linkOk, linkKind, stillMissing } from '@/lib/import/model';
import { useImportFlow, useSave, LinksEditor, ReadingList, PreviewCard, QuestionInput, FallbackInputs, SaveList, foundSentence } from '../shared';
import './b.css';

const EASE = [0.23, 1, 0.32, 1];

export default function ImportB({ user }) {
  const nav = useNavigate();
  const f = useImportFlow(user);
  const { s, set, q } = f;
  const first = firstName(user);
  const reduce = useReducedMotion();
  const save = useSave(user, s, s.phase === 'save' || s.phase === 'done');
  const [ready, setReady] = useState({ value: null, button: false });
  const [dir, setDir] = useState(1);
  const footRef = useRef(null);
  const rootRef = useRef(null);
  const prev = useRef({ phase: s.phase, qi: s.qi });

  useEffect(() => { if (save.done && s.phase === 'save') { const t = setTimeout(() => set({ phase: 'done' }), reduce ? 0 : 450); return () => clearTimeout(t); } return undefined; }, [save.done, s.phase, set, reduce]);
  useEffect(() => {
    const back = s.phase === prev.current.phase && s.qi < prev.current.qi;
    setDir(back ? -1 : 1); prev.current = { phase: s.phase, qi: s.qi };
    window.scrollTo({ top: 0 });
  }, [s.phase, s.qi]);
  useLayoutEffect(() => {
    const el = footRef.current; const root = rootRef.current;
    if (!root) return undefined;
    if (!el) { root.style.setProperty('--imb-foot', '32px'); return undefined; }
    const ro = new ResizeObserver(() => root.style.setProperty('--imb-foot', `${el.offsetHeight + 20}px`));
    ro.observe(el);
    return () => ro.disconnect();
  });

  const okLinks = s.links.filter(linkOk);
  // audit 05.11 COPY-1: a website import is 'האתר', not 'המודעה'
  const siteOnly = okLinks.length > 0 && okLinks.every((l) => linkKind(l).kind === 'site');
  const total = s.queue.length;
  const left = stillMissing(s.draft || {}, s.skipped);
  const key = s.phase === 'ask' ? `ask-${q?.id}` : s.phase;

  let head = null; let body = null; let foot = null;
  if (s.phase === 'start') {
    head = { eyebrow: first ? `שלום ${first}` : 'ייבוא המתחם', title: 'הדביקו קישור למתחם שלכם', sub: 'מ-Booking, מ-Airbnb או מהאתר. והשאר יתמלא לבד, בלי להקליד.' };
    body = (
      <>
        <div className="imb-srcs" aria-hidden>
          <span><b>B</b>Booking.com</span><span><b>A</b>Airbnb</span><span><b><Globe /></b>האתר שלכם</span>
        </div>
        <LinksEditor s={s} set={set} />
        <p className="imb-note">רק קריאה. שום דבר לא משתנה במודעה שלכם.</p>
      </>
    );
    foot = (
      <>
        <button type="button" className="im-btn im-press" disabled={!okLinks.length} onClick={() => f.run()}>ייבוא מהקישור</button>
        <button type="button" className="im-quiet im-press" onClick={() => set({ phase: 'fallback', mode: 'fallback', error: '' })}>אין לי קישור</button>
      </>
    );
  } else if (s.phase === 'reading') {
    head = { title: s.mode === 'fallback' ? 'קוראים את מה ששלחתם' : siteOnly ? 'קוראים את האתר' : 'קוראים את המודעה', sub: 'זה לוקח כחצי דקה. אפשר להישאר כאן.' };
    body = (
      <>
        <div className="imb-skel" aria-hidden><i /><span /><span /><span /></div>
        <div className="imb-panel"><ReadingList kinds={s.kinds} mode={s.mode} /></div>
      </>
    );
  } else if (s.phase === 'error' || s.phase === 'fallback') {
    head = s.error
      ? { title: 'לא הצלחנו לקרוא את הקישור', sub: 'לפעמים Booking ו-Airbnb חוסמים קריאה. צלמו מסך מהמודעה או הדביקו את התיאור.' }
      : { title: 'בלי קישור? גם טוב', sub: 'צלמו מסך מהמודעה או הדביקו את התיאור, ונקרא משם.' };
    body = <FallbackInputs s={s} set={set} />;
    foot = (
      <>
        <button type="button" className="im-btn im-press" disabled={!s.images.length && !s.text.trim()} onClick={() => f.run({ fallback: true })}>קראו מכאן</button>
        <div className="imb-row2">
          <button type="button" className="im-quiet im-press" onClick={() => set({ phase: 'start', mode: null, error: '' })}>קישור אחר</button>
          <button type="button" className="im-quiet im-press" onClick={f.manual}>נענה על כמה שאלות</button>
        </div>
      </>
    );
  } else if (s.phase === 'found') {
    head = { eyebrow: foundSentence(s.draft) || 'מצאנו', title: 'מצאנו את המתחם שלכם', sub: 'בדקו שהכל נכון. נגיעה בשורה מתקנת אותה.' };
    body = <PreviewCard draft={s.draft} onFix={f.fix} eyebrow={s.mode === 'fallback' ? 'ממה ששלחתם' : siteOnly ? 'מהאתר שלכם' : 'מהמודעה שלכם'} />;
    foot = (
      <>
        <button type="button" className="im-btn im-press" onClick={f.confirm}><Check aria-hidden />נכון, ממשיכים</button>
        <button type="button" className="im-quiet im-press" onClick={f.reset}>זה לא המתחם שלי</button>
      </>
    );
  } else if (s.phase === 'ask' && q) {
    head = { eyebrow: s.fixing ? 'תיקון' : `שאלה ${s.qi + 1} מתוך ${total}`, title: q.title, sub: q.why };
    body = <QuestionInput key={q.id} q={q} draft={s.draft} onAnswer={(v) => f.answer(q.id, v)} onReady={setReady} />;
    foot = (
      <>
        {ready.button ? <button type="button" className="im-btn im-press" disabled={ready.value == null} onClick={() => f.answer(q.id, ready.value)}>{q.kind === 'rules' && !ready.value?.length ? 'אין כללים מיוחדים' : 'שמירה'}</button> : null}
        <button type="button" className="im-quiet im-press" onClick={() => f.skip(q.id)}>אחר כך</button>
      </>
    );
  } else if (s.phase === 'save') {
    head = { title: 'מסדרים את המתחם', sub: 'עוד כמה שניות.' };
    body = <SaveList steps={save.steps} at={save.at} error={save.error} onRetry={save.retry} />;
  } else if (s.phase === 'done') {
    const knows = [s.draft?.parking && 'חניה', (s.draft?.check_in_time || s.draft?.check_out_time) && 'שעות כניסה ויציאה', s.draft?.arrival_instructions && 'הכניסה למתחם', s.draft?.house_rules?.length && 'כללי הבית', s.draft?.cancellation_policy && 'ביטולים', s.draft?.guest_faq?.length && 'שאלות נפוצות'].filter(Boolean);
    head = { title: 'יש! המתחם מוכן.', sub: s.draft?.business_name ? `${s.draft.business_name} כבר ביומן.` : 'היחידות כבר ביומן.', big: true };
    body = (
      <>
        {knows.length ? (
          <div className="imb-panel">
            <p className="imb-panel-t">מעכשיו אפשר לשאול את atlas על</p>
            <ul className="imb-knows">{knows.map((k) => <li key={k}><span aria-hidden><Check /></span>{k}</li>)}</ul>
          </div>
        ) : null}
        {left.length ? <p className="imb-note">{left.length === 1 ? 'פרט אחד' : `${left.length} פרטים`} אפשר להשלים אחר כך בהגדרות, תחת העסק.</p> : null}
        <p className="imb-voice"><Mic aria-hidden />בקרוב: להשלים את הפרטים בקול, בשיחה עם atlas.</p>
      </>
    );
    foot = <button type="button" className="im-btn im-press" onClick={() => { f.reset(); nav('/today'); }}>לעמוד היום</button>;
  }

  const segs = s.phase === 'ask' && !s.fixing ? total : 0;
  const variants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? -24 : 24 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
    exit: (d) => ({ opacity: 0, x: d > 0 ? 16 : -16, transition: { duration: 0.14, ease: EASE } }),
  };
  const canBack = s.phase === 'ask' || s.phase === 'found' || s.phase === 'fallback' || s.phase === 'error';
  const goBack = () => {
    if (s.phase === 'ask') return f.back();
    if (s.phase === 'found' || s.phase === 'fallback' || s.phase === 'error') return set({ phase: 'start', error: '', mode: null });
    return nav(-1);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div ref={rootRef} className="im imb" dir="rtl" data-version="import-b" data-phase={s.phase}>
        <header className="imb-head">
          {canBack ? (
            <button type="button" className="im-icon im-press" onClick={goBack} aria-label="חזרה"><ArrowRight aria-hidden /></button>
          ) : (
            <button type="button" className="im-icon im-press" onClick={() => nav(-1)} aria-label="יציאה"><ArrowRight aria-hidden /></button>
          )}
          {segs ? (
            <div className="imb-prog" role="progressbar" aria-label={`שאלה ${s.qi + 1} מתוך ${total}`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={s.qi}>
              {Array.from({ length: total }, (_, n) => <span key={n}><i style={{ transform: `scaleX(${n < s.qi ? 1 : n === s.qi ? 0.35 : 0})` }} /></span>)}
            </div>
          ) : <span className="imb-logo"><Wordmark size={20} /></span>}
          <a href={HELP_WA} target="_blank" rel="noopener noreferrer" className="im-icon im-press" aria-label="עזרה בוואטסאפ"><MessageCircle aria-hidden /></a>
        </header>
        <main className="imb-main">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.section key={key} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" className="imb-screen" aria-labelledby="imb-title">
              {head?.eyebrow ? <p className="imb-eyebrow">{head.eyebrow}</p> : null}
              <h1 id="imb-title" className={`imb-h1${head?.big ? ' is-big' : ''}`}>{head?.title}</h1>
              {head?.sub ? <p className="imb-sub">{head.sub}</p> : null}
              <div className="imb-body">{body}</div>
            </motion.section>
          </AnimatePresence>
        </main>
        {foot ? <footer ref={footRef} className="imb-foot" data-testid="import-composer"><div className="imb-foot-in">{foot}</div></footer> : null}
      </div>
    </MotionConfig>
  );
}
