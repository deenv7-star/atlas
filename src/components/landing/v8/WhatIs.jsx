/**
 * Right after the hero (UI/UX polish v1, Deen 20.10.2026 18:30: "not clear enough what atlas IS, what it does,
 * what the benefits are"). Two short visual parts:
 *  1. WhatIs: one sentence on what atlas is and who it is for, a before/after (scattered tools → one place)
 *     and the 3-step idea מחברים ערוצים → atlas מסדר → אתם מארחים.
 *  2. Benefits: 4 concrete benefits in host language, each icon with its own small reveal motion.
 * All motion is CSS (magic/what.css), transform/opacity only, bound to the reveal observer; reduced motion and
 * no-JS render the final state. The payment link is not live yet, so that benefit carries "בקרוב".
 */
import React from 'react';
import { ArrowLeft, CalendarCheck, CalendarDays, Check, Clock, FileSpreadsheet, HeartHandshake, Link2, MessageCircle, NotebookPen, RefreshCw, Sparkles, Wallet } from 'lucide-react';
import { Mark } from '../v5/ui';
import './magic/what.css';

const BEFORE = [
  { k: 'xls', icon: <FileSpreadsheet size={18} strokeWidth={2.2} aria-hidden="true" />, t: 'אקסל הזמנות', r: -5 },
  { k: 'note', icon: <NotebookPen size={18} strokeWidth={2.2} aria-hidden="true" />, t: 'מחברת מקדמות', r: 4 },
  { k: 'air', icon: <Mark ch="airbnb" size={18} />, t: 'יומן Airbnb', r: 3 },
  { k: 'bk', icon: <Mark ch="booking" size={18} />, t: 'יומן Booking.com', r: -3 },
  { k: 'wa', icon: <Mark ch="whatsapp" size={18} />, t: '3 קבוצות וואטסאפ', r: 6 },
];

const AFTER = [
  { I: CalendarDays, t: 'כל ההזמנות על לוח אחד' },
  { I: MessageCircle, t: 'הודעה מוכנה לכל אורח' },
  { I: Wallet, t: 'כל מקדמה ויתרה במעקב' },
];

const FLOW = [
  { I: RefreshCw, t: 'מחברים ערוצים', d: 'פעם אחת, 5 דקות' },
  { I: Sparkles, t: 'atlas מסדר', d: 'לוח, הודעות ותשלומים' },
  { I: HeartHandshake, t: 'אתם מארחים', d: 'והכל כבר מוכן' },
];

export function WhatIs() {
  return (
    <section id="what" className="ax-what" aria-labelledby="what-title">
      <div className="l5-wrap">
        <div className="ax-head" data-reveal>
          <p className="lm-kick">מה זה atlas</p>
          <h2 id="what-title" className="v8-h2">פחות בלגן. <span className="is-ind">יותר אירוח.</span></h2>
          <p className="ax-lead">atlas מרכז לבעלי צימרים ומתחמי נופש את הלוח, ההזמנות, התשלומים וההודעות לאורחים, במסך אחד. <span className="ax-lead-b">במקום אקסלים, מחברות וקבוצות וואטסאפ.</span></p>
          <p className="ax-who"><Check size={16} strokeWidth={2.6} aria-hidden="true" />מצימר אחד ועד מתחם שלם</p>
        </div>

        <div className="ax-ba">
          <div className="ax-before" data-reveal>
            <p className="ax-tag">היום</p>
            <ul aria-label="איך זה נראה היום">
              {BEFORE.map((b, i) => (
                <li key={b.k} style={{ '--r': `${b.r}deg`, '--i': i }}>{b.icon}{b.t}</li>
              ))}
            </ul>
          </div>
          <span className="ax-arrow" aria-hidden="true" data-reveal><ArrowLeft size={22} strokeWidth={2.4} /></span>
          <div className="ax-after" data-reveal>
            <p className="ax-tag is-on">עם atlas</p>
            <ul aria-label="איך זה נראה עם atlas">
              {AFTER.map(({ I, t }, i) => (
                <li key={t} style={{ '--i': i }}>
                  <span className="ax-after-ic" aria-hidden="true"><I size={18} strokeWidth={2.2} /></span>
                  <span className="ax-after-t">{t}</span>
                  <span className="ax-ok" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ol className="ax-flow" data-reveal aria-label="איך זה עובד">
          {FLOW.map(({ I, t, d }, i) => (
            <li key={t} style={{ '--i': i }}>
              <span className="ax-flow-ic" aria-hidden="true"><I size={22} strokeWidth={2.2} /></span>
              <b>{t}</b>
              <small>{d}</small>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const BENEFITS = [
  { k: 'dbl', I: CalendarCheck, t: 'בלי כפל הזמנות', d: 'כל הערוצים על לוח אחד, ו-atlas מתריע על חפיפה.' },
  { k: 'time', I: Clock, t: 'חוסכים שעות כל שבוע', d: 'הודעות לאורחים מוכנות מראש, והלוח מתעדכן לבד.' },
  { k: 'link', I: Link2, t: 'תשלום מראש בלינק', d: 'שולחים לאורח קישור, והמקדמה נרשמת.', soon: true },
  { k: 'money', I: Wallet, t: 'רואים כמה נכנס', d: 'כל מקדמה ויתרה, וכמה נכנס החודש.' },
];

export function Benefits() {
  return (
    <section id="benefits" className="ax-ben" aria-labelledby="ben-title">
      <div className="l5-wrap">
        <h2 id="ben-title" className="v8-h2 ax-ben-h" data-reveal>מה זה נותן <span className="is-ind">לכם.</span></h2>
        <ul className="ax-ben-list">
          {BENEFITS.map(({ k, I, t, d, soon }, i) => (
            <li key={k} className={`ax-b is-${k}`} data-reveal style={{ '--d': `${i * 90}ms` }}>
              <span className="ax-b-ic" aria-hidden="true"><I size={26} strokeWidth={2.2} /></span>
              <h3>{t}{soon && <span className="ax-soon">בקרוב</span>}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
