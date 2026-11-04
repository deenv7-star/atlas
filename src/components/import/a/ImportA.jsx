/**
 * ייבוא מתחם · Version A: "השכן המקצועי" in a conversation. atlas writes one short message at a time; the owner answers
 * with big taps in the composer at the bottom. The thread is derived from the flow state (never an event log), so a
 * refresh or "תיקון" always renders the same honest picture.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, MessageCircle, Mic } from 'lucide-react';
import { Wordmark } from '@/components/app/shell/shared';
import { HELP_WA } from '@/components/onboarding/v2/ui';
import { firstName } from '@/components/onboarding/y/model';
import { linkKind, linkOk, QUESTIONS, CANCEL_CHOICES, ARRIVAL_CHOICES, PARKING_CHOICES, KIND_CHOICES, stillMissing, unitsLabelHe } from '@/lib/import/model';
import { useImportFlow, useSave, LinksEditor, SourceBadges, ReadingList, PreviewCard, QuestionInput, FallbackInputs, SaveList, foundSentence } from '../shared';
import './a.css';

const EASE = [0.23, 1, 0.32, 1];
const label = (list, v) => list.find((c) => c.value === v)?.label || v;

function answerText(id, d, skipped) {
  if (skipped.includes(id)) return 'אחר כך';
  switch (id) {
    case 'business_name': return d.business_name;
    case 'property_type': return label(KIND_CHOICES.map((k) => ({ value: k.value, label: k.label })), d.property_type);
    case 'unit_count': return unitsLabelHe(d.property_type, d.unit_count);
    case 'check_in_time': return `כניסה ${d.check_in_time} · יציאה ${d.check_out_time}`;
    case 'arrival_instructions': return label(ARRIVAL_CHOICES, d.arrival_instructions);
    case 'parking': return label(PARKING_CHOICES, d.parking);
    case 'contact': return d.contact?.whatsapp;
    case 'house_rules': return d.house_rules?.length ? d.house_rules.join(' · ') : 'בלי כללים מיוחדים';
    case 'cancellation_policy': return label(CANCEL_CHOICES, d.cancellation_policy);
    default: return '';
  }
}

function Bubble({ who = 'atlas', children, wide = false, i = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={`ima-msg is-${who}${wide ? ' is-wide' : ''}`}
      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: EASE, delay: reduce ? 0 : Math.min(i, 3) * 0.12 }}>
      {children}
    </motion.div>
  );
}

export default function ImportA({ user }) {
  const nav = useNavigate();
  const f = useImportFlow(user);
  const { s, set, q } = f;
  const first = firstName(user);
  const save = useSave(user, s, s.phase === 'save' || s.phase === 'done');
  const [ready, setReady] = useState({ value: null, button: false });
  const endRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => { if (save.done && s.phase === 'save') { const t = setTimeout(() => set({ phase: 'done' }), reduce ? 0 : 450); return () => clearTimeout(t); } return undefined; }, [save.done, s.phase, set, reduce]);
  useLayoutEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: reduce ? 'auto' : 'smooth' }); }, [s.phase, s.qi, s.error, save.at, reduce]);

  const okLinks = s.links.filter(linkOk);
  const asked = s.phase === 'ask' || s.phase === 'save' || s.phase === 'done' ? s.queue.slice(0, s.phase === 'ask' ? s.qi : s.queue.length) : [];
  const total = s.queue.length;
  const fromLinks = s.mode !== 'fallback' && s.mode !== 'manual';
  const left = stillMissing(s.draft || {}, s.skipped);

  /* ── the thread ── */
  const thread = [];
  thread.push(<Bubble key="hi"><p className="ima-big">{first ? `שלום ${first}.` : 'שלום.'} בואו נכין את המתחם בלי להקליד.</p><p>יש לכם מודעה ב-Booking, ב-Airbnb או אתר? הדביקו כאן את הקישור. atlas ימלא את השאר.</p></Bubble>);
  if (s.phase !== 'start') {
    if (s.mode === 'links' || (!s.mode && okLinks.length)) thread.push(<Bubble key="links" who="me">{okLinks.map((l) => <span key={l} className="ima-linkchip" dir="ltr">{linkKind(l).label}</span>)}</Bubble>);
    if (s.mode === 'fallback' && s.phase !== 'fallback') thread.push(<Bubble key="fb" who="me">{[s.images.length ? `${s.images.length} צילומי מסך` : '', s.text ? 'התיאור מהמודעה' : ''].filter(Boolean).join(' + ') || 'שלחתי'}</Bubble>);
    if (s.mode === 'manual') thread.push(<Bubble key="man" who="me">אין לי קישור</Bubble>);
  }
  if (s.phase === 'error' || s.phase === 'fallback') {
    thread.push(<Bubble key="err"><p>{s.error || 'אין בעיה.'}</p><p>צלמו מסך מהמודעה או הדביקו את התיאור, ונקרא משם.</p></Bubble>);
  }
  if (s.phase === 'reading') thread.push(<Bubble key="read" wide><ReadingList kinds={s.kinds} mode={s.mode} /></Bubble>);
  if (s.draft && s.mode !== 'manual' && ['found', 'ask', 'save', 'done'].includes(s.phase)) {
    thread.push(<Bubble key="found-t"><p className="ima-big">מצאנו את המתחם שלכם.</p><p>{foundSentence(s.draft) ? `${foundSentence(s.draft)}. ` : ''}בדקו שהכל נכון. נגיעה בשורה מתקנת אותה.</p></Bubble>);
    thread.push(<Bubble key="found-c" wide><PreviewCard draft={s.draft} onFix={s.phase === 'found' ? f.fix : undefined} /></Bubble>);
  }
  if (['ask', 'save', 'done'].includes(s.phase) && total && !s.fixing && s.mode !== 'manual') {
    thread.push(<Bubble key="n" i={1}><p>{total === 1 ? 'נשארה שאלה אחת קצרה.' : `נשארו ${total} שאלות קצרות.`} כל אחת בנגיעה, ואפשר לדלג.</p></Bubble>);
  }
  asked.forEach((id) => {
    const qq = QUESTIONS[id];
    thread.push(<Bubble key={`q-${id}`}><p className="ima-big">{qq.title}</p></Bubble>);
    thread.push(<Bubble key={`a-${id}`} who="me">{answerText(id, s.draft || {}, s.skipped)}</Bubble>);
  });
  if (s.phase === 'ask' && q) thread.push(<Bubble key={`cur-${q.id}`}><p className="ima-big">{q.title}</p><p>{q.why}</p></Bubble>);
  if (s.phase === 'save' || s.phase === 'done') thread.push(<Bubble key="save" wide><SaveList steps={save.steps} at={save.at} error={save.error} onRetry={save.retry} /></Bubble>);
  if (s.phase === 'done') {
    thread.push(<Bubble key="done" i={1}><p className="ima-big">יש! המתחם מוכן.</p><p>{s.draft?.business_name ? `${s.draft.business_name} כבר ביומן. ` : ''}מעכשיו atlas יודע לענות לאורחים על {[s.draft?.parking && 'חניה', (s.draft?.check_in_time || s.draft?.check_out_time) && 'שעות', s.draft?.house_rules?.length && 'כללי הבית', s.draft?.arrival_instructions && 'הכניסה למתחם'].filter(Boolean).join(', ') || 'המתחם'}.</p>{left.length ? <p className="ima-mute">{left.length === 1 ? 'פרט אחד' : `${left.length} פרטים`} אפשר להשלים אחר כך בהגדרות.</p> : null}</Bubble>);
  }

  /* ── the composer (what the owner can do now) ── */
  let composer = null;
  if (s.phase === 'start') {
    composer = (
      <>
        <LinksEditor s={s} set={set} />
        <button type="button" className="im-btn im-press" disabled={!okLinks.length} onClick={() => f.run()}>ייבוא מהקישור</button>
        <div className="ima-row2">
          <button type="button" className="im-quiet im-press" onClick={() => set({ phase: 'fallback', mode: 'fallback', error: '' })}>אין לי קישור</button>
          <SourceBadges />
        </div>
      </>
    );
  } else if (s.phase === 'error' || s.phase === 'fallback') {
    composer = (
      <>
        <FallbackInputs s={s} set={set} />
        <button type="button" className="im-btn im-press" disabled={!s.images.length && !s.text.trim()} onClick={() => f.run({ fallback: true })}>קראו מכאן</button>
        <div className="ima-row2">
          <button type="button" className="im-quiet im-press" onClick={() => set({ phase: 'start', mode: null, error: '' })}>לנסות קישור אחר</button>
          <button type="button" className="im-quiet im-press" onClick={f.manual}>נענה על כמה שאלות</button>
        </div>
      </>
    );
  } else if (s.phase === 'found') {
    composer = (
      <>
        <button type="button" className="im-btn im-press" onClick={f.confirm}><Check aria-hidden />נכון, ממשיכים</button>
        <button type="button" className="im-quiet im-press" onClick={f.reset}>זה לא המתחם שלי</button>
      </>
    );
  } else if (s.phase === 'ask' && q) {
    composer = (
      <>
        <QuestionInput key={q.id} q={q} draft={s.draft} onAnswer={(v) => f.answer(q.id, v)} onReady={setReady} compact />
        {ready.button ? <button type="button" className="im-btn im-press" disabled={ready.value == null} onClick={() => f.answer(q.id, ready.value)}>{q.kind === 'rules' && !ready.value?.length ? 'אין כללים מיוחדים' : 'שמירה'}</button> : null}
        <div className="ima-row2">
          {s.qi > 0 ? <button type="button" className="im-quiet im-press" onClick={f.back}>חזרה</button> : <span />}
          <button type="button" className="im-quiet im-press" onClick={() => f.skip(q.id)}>אחר כך</button>
        </div>
      </>
    );
  } else if (s.phase === 'done') {
    composer = (
      <>
        <button type="button" className="im-btn im-press" onClick={() => { f.reset(); nav('/today'); }}>לעמוד היום</button>
        <p className="ima-voice"><Mic aria-hidden />בקרוב: להשלים את הפרטים בקול, בשיחה עם atlas.</p>
      </>
    );
  }

  const progress = s.phase === 'ask' && total ? Math.min(1, s.qi / total) : ['save', 'done'].includes(s.phase) ? 1 : s.phase === 'found' ? 0.15 : 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="im ima" dir="rtl" data-version="import-a" data-phase={s.phase}>
        <header className="ima-head">
          <button type="button" className="im-icon im-press" onClick={() => nav(-1)} aria-label="יציאה"><ArrowRight aria-hidden /></button>
          <span className="ima-logo"><Wordmark size={20} /></span>
          <a href={HELP_WA} target="_blank" rel="noopener noreferrer" className="im-icon im-press" aria-label="עזרה בוואטסאפ"><MessageCircle aria-hidden /></a>
          <span className="ima-bar" role="progressbar" aria-label="התקדמות" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><i style={{ transform: `scaleX(${progress})` }} /></span>
        </header>
        <main className="ima-thread" aria-live="polite">
          {thread}
          <div ref={endRef} style={{ height: 1 }} />
        </main>
        {composer ? <footer className="ima-composer" data-testid="import-composer"><div className="ima-composer-in">{composer}</div></footer> : null}
      </div>
    </MotionConfig>
  );
}
