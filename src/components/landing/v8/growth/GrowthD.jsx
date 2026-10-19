/**
 * Landing growth section, version D "product-led" (19.10.2026, proposal).
 * The real atlas UI does the selling: three real screens (direct-booking page, its date picker with price,
 * the lead it creates), captured from the app in demo mode, inside the official Apple iPhone 17 Pro bezel
 * (Apple Design Resources). The phone stays put while three short chapters scroll past; each chapter swaps
 * the screen (opacity + a small scale, nothing else). Then what opens next for founding members, then one offer.
 * Honest by design: the phone shows only what is built today; unbuilt parts are listed as "בקרוב".
 * Prices, founding terms and links: src/config/growth.js only.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { GROWTH_NAME, GROWTH_OFFER, FOUNDING, GROWTH_STATUS, GROWTH_LINKS, nis } from '@/config/growth';
import './growth-d.css';

const G = '/demo/growth';
const CHAPTERS = [
  { h: 'דף הזמנה משלכם.', p: 'התמונות, הפרטים והמחיר של המתחם בכתובת אחת לשלוח לכל אורח.', src: `${G}/g-book.webp`, alt: 'דף ההזמנה הישירה של צימר הזית ב-atlas (נתוני דוגמה)' },
  { h: 'התאריכים הפנויים, מהיומן.', p: 'האורח בוחר תאריכים ורואה מחיר. מה שכבר תפוס ביומן מסומן כתפוס.', src: `${G}/g-book-dates.webp`, alt: 'בחירת תאריכים בדף ההזמנה: 26 עד 28 באוקטובר, 2 לילות, ₪2,200 (נתוני דוגמה)' },
  { h: 'הפנייה נוחתת אצלכם.', p: 'ישר ללידים ב-atlas, ומשם לוואטסאפ בלחיצה. בלי עמלת ערוץ.', src: `${G}/g-leads.webp`, alt: 'מסך הלידים ב-atlas: פנייה חדשה של מיכל אברהם מהדף הישיר (נתוני דוגמה)' },
];
const NEW_TAB = ' (וואטסאפ, נפתח בחלון חדש)';

/** Which chapter sits in the reading band of the viewport. One IntersectionObserver, no scroll listener. */
function useActiveChapter(listRef) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === 'undefined') return undefined;
    const items = [...list.querySelectorAll('[data-ch]')];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(Number(en.target.dataset.ch)); });
    }, { rootMargin: '-58% 0px -28% 0px', threshold: 0 });
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [listRef]);
  return active;
}

function Phone({ active }) {
  return (
    <div className="gd-phone" role="img" aria-label={CHAPTERS[active].alt}>
      <div className="gd-screen">
        {CHAPTERS.map((c, i) => (
          <img key={c.src} src={c.src} alt="" width="804" height="1748" loading="lazy" decoding="async" className={i === active ? 'is-on' : ''} />
        ))}
      </div>
      <img className="gd-bezel" src={`${G}/iphone17pro-silver.webp`} alt="" width="675" height="1380" loading="lazy" decoding="async" />
    </div>
  );
}

export default function GrowthD() {
  const list = useRef(null);
  const active = useActiveChapter(list);
  return (
    <section id="growth" className="gd" aria-labelledby="growth-title">
      <div className="l5-wrap">
        <header className="gd-head">
          <p className="gd-kick">{GROWTH_NAME}</p>
          <h2 id="growth-title" className="gd-h">מהתמונות של המתחם <span className="gd-ind">להזמנה ישירה.</span></h2>
          <p className="gd-lede">ככה זה נראה ב-atlas, היום. בלי עמלת ערוץ על מה שמגיע ישר אליכם.</p>
        </header>

        <div className="gd-story">
          <div className="gd-stick">
            <Phone active={active} />
            <p className="gd-ex">דוגמה, מסכים אמיתיים מ-atlas</p>
            {/* phones: the active chapter's words sit under the phone, inside the sticky area, so they are never
                covered by it or by the sticky CTA. Visual copy only; the list below carries the text for screen readers. */}
            <div className="gd-cap" aria-hidden="true">
              {CHAPTERS.map((c, i) => (
                <div key={c.h} className={`gd-cap-i${i === active ? ' is-on' : ''}`}>
                  <p className="gd-chap-h">{c.h}</p>
                  <p className="gd-chap-p">{c.p}</p>
                </div>
              ))}
            </div>
          </div>
          <ol ref={list} className="gd-ch">
            {CHAPTERS.map((c, i) => (
              <li key={c.h} data-ch={i} className={`gd-chap${i === active ? ' is-on' : ''}`}>
                <h3 className="gd-chap-h">{c.h}</h3>
                <p className="gd-chap-p">{c.p}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="gd-next">
          <p className="gd-next-k">בקרוב, קודם למייסדים</p>
          <ul className="gd-next-l">
            {GROWTH_STATUS.soon.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>

        <div className="gd-offer">
          <div className="gd-offer-top">
            <h3 className="gd-offer-h">{GROWTH_OFFER.name}</h3>
            <p className="gd-offer-sub">כולל את כל מערכת הניהול</p>
          </div>
          <dl className="gd-rows">
            <div className="gd-row">
              <dt>לחודש, לכל מתחם</dt>
              <dd className="num" dir="ltr">{nis(GROWTH_OFFER.price)}</dd>
            </div>
            <div className="gd-row is-found">
              <dt><b>מחיר מייסדים</b><span>{`נעול ל-${FOUNDING.lockMonths} חודשים · ל-${FOUNDING.cap} הראשונים · ${FOUNDING.deadlineLabel}`}</span></dt>
              <dd className="num" dir="ltr">{nis(FOUNDING.monthly)}</dd>
            </div>
          </dl>
          {FOUNDING.remaining != null && <p className="gd-left">{`נשארו ${FOUNDING.remaining} מתוך ${FOUNDING.cap}`}</p>}
          <a className="gd-cta" href={GROWTH_LINKS.founding} target="_blank" rel="noopener noreferrer">
            <span>שמירת מקום כמייסדים</span><ArrowLeft size={18} strokeWidth={2} aria-hidden="true" /><span className="l5-sr">{NEW_TAB}</span>
          </a>
          <p className="gd-fine">
            {'תקציב הפרסום שלכם, משולם ישירות ל-Meta ול-Google. '}
            <a href={GROWTH_LINKS.guided} target="_blank" rel="noopener noreferrer">רוצים ליווי מלא?<span className="l5-sr">{NEW_TAB}</span></a>
          </p>
        </div>
      </div>
    </section>
  );
}
