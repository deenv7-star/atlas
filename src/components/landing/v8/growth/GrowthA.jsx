/**
 * Landing growth section, version A "results-first" (19.10.2026, proposal).
 * Story: one direct booking pays for months of growth -> an owner's day without / with growth
 * (real photo + product UI, labelled as an example) -> ROI example the owner can tune -> tier cards.
 * Honest by design: what is built vs. opening to founding members is stated; no quotes or counts.
 */
import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, CalendarCheck, Clapperboard, BarChart3, Minus } from 'lucide-react';
import { GROWTH_NAME, GROWTH_STATUS, ROI, monthsCovered, FOUNDING, GROWTH_LINKS } from '@/config/growth';
import GrowthTiers from './GrowthTiers';
import './growth-a.css';

const nis = (n) => `₪${n.toLocaleString('en-US')}`;

const WITHOUT = [
  'מחכים ש-Booking יביא, ומשלמים עמלה',
  'אין זמן לצלם ולהעלות לאינסטגרם',
  'פניות מפוזרות בין טלפון, מסנג׳ר ומייל',
  'לא יודעים מה מהפרסום באמת עבד',
];
const WITH = [
  { t: '09:10', I: Clapperboard, s: 'סרטון חדש מוכן מהתמונות שלכם' },
  { t: '13:40', I: MessageCircle, s: 'פנייה מהמודעה נכנסה לוואטסאפ' },
  { t: '14:05', I: CalendarCheck, s: 'ההזמנה בלוח. ישירה, בלי עמלה' },
  { t: '30.11', I: BarChart3, s: 'הדוח החודשי: כמה זה הביא, בשקלים' },
];

function useInView(ref) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

function Roi() {
  const [night, setNight] = useState(ROI.nightPrice);
  const m = monthsCovered(night);
  return (
    <div className="ga-roi">
      <p className="ga-roi-k">הזמנה ישירה אחת של סופ״ש</p>
      <p className="ga-roi-v" aria-live="polite">
        <span>מכסה</span> <b className="num">{m.toLocaleString('he-IL')}</b> <span>חודשים של צמיחה</span>
      </p>
      <label className="ga-roi-in">
        <span>מחיר ללילה אצלכם</span>
        <input type="range" min="400" max="2000" step="50" value={night} onChange={(e) => setNight(Number(e.target.value))} aria-valuetext={`${night} שקלים`} />
        <b className="num" dir="ltr">{nis(night)}</b>
      </label>
      <p className="ga-roi-fine">{`דוגמה: ${ROI.nights} לילות מול תוספת של ${nis(ROI.addOn)} לחודש. התוצאות תלויות במתחם, בעונה ובתקציב הפרסום, ולא מבטיחים מספר הזמנות.`}</p>
    </div>
  );
}

export default function GrowthA() {
  const day = useRef(null);
  const on = useInView(day);
  return (
    <section id="growth" className="ga" aria-labelledby="growth-title">
      <div className="l5-wrap">
        <div className="ga-head">
          <p className="ga-badge"><span className="ga-dot" aria-hidden="true" />{`חדש: ${GROWTH_NAME}`}</p>
          <h2 id="growth-title" className="v8-h2">אטלס מסדר. <span className="is-ind">עכשיו גם מביא.</span></h2>
          <p className="v8-txt">דף הזמנה, סרטון ומודעה מהתמונות שלכם. כל פנייה נוחתת בוואטסאפ, וכל חודש רואים כמה זה הביא.</p>
        </div>

        <div ref={day} className={`ga-day${on ? ' is-on' : ''}`}>
          <div className="ga-col is-without">
            <h3 className="ga-col-h">יום רגיל, בלי צמיחה</h3>
            <ul>
              {WITHOUT.map((s) => <li key={s}><Minus size={16} strokeWidth={2.4} aria-hidden="true" /><span>{s}</span></li>)}
            </ul>
          </div>
          <figure className="ga-photo">
            <img src="/demo/growth/owner-window.webp" alt="בעלת מתחם מסתכלת בטלפון ליד החלון" width="720" height="751" loading="lazy" decoding="async" />
            <div className="ga-chip" aria-hidden="true">
              <span className="ga-chip-i"><MessageCircle size={16} strokeWidth={2.2} /></span>
              <span><b>פנייה חדשה מהמודעה</b><small>2 לילות · חנוכה · וואטסאפ</small></span>
            </div>
            <figcaption className="ga-cap">דוגמה להמחשה</figcaption>
          </figure>
          <div className="ga-col is-with">
            <h3 className="ga-col-h">אותו יום, עם צמיחה</h3>
            <ol>
              {WITH.map(({ t, I, s }, i) => (
                <li key={t} style={{ '--i': i }}>
                  <span className="ga-t num" dir="ltr">{t}</span>
                  <span className="ga-i"><I size={16} strokeWidth={2.2} aria-hidden="true" /></span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <Roi />

        <div className="ga-tiers">
          <GrowthTiers />
        </div>

        <p className="ga-honest">
          {`כבר בנוי: ${GROWTH_STATUS.ready.join(' ו')}. ${GROWTH_STATUS.soon.join(', ')}: נפתחים קודם לחברים המייסדים. `}
          <a href={GROWTH_LINKS.founding} target="_blank" rel="noopener noreferrer">{`שמירת מקום, ${FOUNDING.deadlineLabel}`}<span className="l5-sr"> (וואטסאפ, נפתח בחלון חדש)</span></a>
        </p>
      </div>
    </section>
  );
}
