/**
 * Landing growth section, version C "editorial calm" (19.10.2026, proposal).
 * One idea per screen: a big statement -> one real product visual (the real atlas direct-booking page,
 * captured in demo mode, rising out of the unit photo it is built from) -> three short steps ->
 * one money sentence -> one focused offer. The base plan stays in the pricing section below.
 * Honest by design: unbuilt parts are marked "בקרוב, קודם למייסדים"; the example is labelled "דוגמה".
 * Prices, founding terms and links: src/config/growth.js only.
 */
import React, { useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { GROWTH_NAME, GROWTH_OFFER, FOUNDING, ROI, GROWTH_LINKS, wholeMonthsCovered, nis } from '@/config/growth';
import useReveal from './useReveal';
import './growth-c.css';

const STEPS = [
  { h: 'מעלים תמונות.', p: 'atlas מציג אותן בדף הזמנה משלכם, עם התאריכים הפנויים מהיומן.' },
  { h: 'מפרסמים.', p: 'סרטון קצר לאינסטגרם ומודעה מוכנה לכל עונה, מהתמונות של המתחם.', soon: true },
  { h: 'מקבלים פנייה.', p: 'היא נכנסת ללידים ב-atlas, ומשם לוואטסאפ בלחיצה. בלי עמלת ערוץ.' },
];

const NEW_TAB = ' (וואטסאפ, נפתח בחלון חדש)';

export default function GrowthC() {
  const ref = useRef(null);
  useReveal(ref);
  const months = wholeMonthsCovered();
  return (
    <section ref={ref} id="growth" className="gc" aria-labelledby="growth-title">
      <div className="l5-wrap">
        <header className="gc-head">
          <p className="gc-kick" data-r>{GROWTH_NAME}</p>
          <h2 id="growth-title" className="gc-h" data-r style={{ '--d': 1 }}>
            <span>אתם מארחים. atlas מסדר.</span> <span className="gc-ind">ועכשיו גם מביא הזמנות.</span>
          </h2>
          <p className="gc-lede" data-r style={{ '--d': 2 }}>מהתמונות של המתחם: דף הזמנה ישירה, סרטון ומודעה. כל פנייה נוחתת אצלכם.</p>
        </header>

        <figure className="gc-vis" data-r>
          <div className="gc-stage">
            <img className="gc-photo" src="/demo/units/unit-2.webp" alt="" width="1200" height="800" loading="lazy" decoding="async" />
            <img className="gc-screen" src="/demo/growth/g-book.webp" alt="דף ההזמנה הישירה של צימר הזית ב-atlas: תמונה, פרטי המתחם ובחירת תאריכים (נתוני דוגמה)" width="804" height="1748" loading="lazy" decoding="async" />
          </div>
          <figcaption className="gc-cap">דוגמה: דף הזמנה ישירה ב-atlas, מהתמונות ומהיומן של המתחם.</figcaption>
        </figure>

        <ol className="gc-steps">
          {STEPS.map((s, i) => (
            <li key={s.h} className="gc-step" data-r style={{ '--d': i }}>
              <span className="gc-n num" aria-hidden="true">{i + 1}</span>
              <h3 className="gc-step-h">{s.h}</h3>
              <p className="gc-step-p">{s.p}</p>
              {s.soon && <p className="gc-soon">בקרוב, קודם למייסדים</p>}
            </li>
          ))}
        </ol>

        <blockquote className="gc-roi" data-r>
          <p className="gc-roi-q">
            הזמנה ישירה אחת של סופ״ש מכסה כ-<span className="gc-ind num">{months}</span> חודשים של צמיחה.
          </p>
          <footer className="gc-roi-f">
            {`דוגמה: ${ROI.nights} לילות ב-${nis(ROI.nightPrice)} מול תוספת של ${nis(ROI.addOn)} לחודש. התוצאות תלויות במתחם ובעונה, ולא מבטיחים מספר הזמנות.`}
          </footer>
        </blockquote>

        <div className="gc-offer" data-r>
          <div className="gc-offer-main">
            <h3 className="gc-offer-h">{GROWTH_OFFER.name}</h3>
            <p className="gc-offer-sub">כולל את כל מערכת הניהול, לכל מתחם.</p>
            <p className="gc-price"><b className="num" dir="ltr">{nis(GROWTH_OFFER.price)}</b><span>לחודש</span></p>
          </div>
          <div className="gc-offer-side">
            <p className="gc-found">
              <b>{'מייסדים: '}<span className="num" dir="ltr">{nis(FOUNDING.monthly)}</span>{' לחודש, '}{`נעול ל-${FOUNDING.lockMonths} חודשים.`}</b>
              <span>{`ל-${FOUNDING.cap} המתחמים הראשונים, ${FOUNDING.deadlineLabel}.`}</span>
              {FOUNDING.remaining != null && <span>{`נשארו ${FOUNDING.remaining} מתוך ${FOUNDING.cap}.`}</span>}
            </p>
            <a className="gc-cta" href={GROWTH_LINKS.founding} target="_blank" rel="noopener noreferrer">
              <span>שמירת מקום כמייסדים</span><ArrowLeft size={18} strokeWidth={2} aria-hidden="true" /><span className="l5-sr">{NEW_TAB}</span>
            </a>
            <a className="gc-link" href={GROWTH_LINKS.guided} target="_blank" rel="noopener noreferrer">
              רוצים ליווי מלא? בואו נדבר<span className="l5-sr">{NEW_TAB}</span>
            </a>
          </div>
          <p className="gc-offer-fine">תקציב הפרסום שלכם, משולם ישירות ל-Meta ול-Google.</p>
        </div>
      </div>
    </section>
  );
}
