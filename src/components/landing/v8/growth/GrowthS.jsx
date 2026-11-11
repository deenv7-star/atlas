/**
 * Landing growth section, version S "showcase" (20.10.2026, Deen: the old section read like a second pricing
 * and left half of the desktop width empty). Now it only shows the three tools that open to founding members
 * first, each as a large mock-up that fills its tile: a short video made from the complex's photos, a seasonal
 * ad, and the monthly "how much it brought" report. No price here: the growth price is one plan line inside
 * the main pricing section (Pricing8 `growth`), so the page tells one pricing story.
 * Honest by design: every tile says "בקרוב", the mock-ups are labelled as an illustration with example data,
 * and the line under them names only what is built today (GROWTH_STATUS.ready).
 * Photos: the hero pool (already cached by the hero on phones) and the porch host from people photos B.
 */
import React, { useRef } from 'react';
import { ArrowDown, Play, Film, Megaphone, BarChart3 } from 'lucide-react';
import { Mark } from '../../v5/ui';
import { useReveal } from '../../v5/motion';
import { useGrowthMotion } from '../motion/growthMotion';
import { GROWTH_NAME, GROWTH_STATUS, GROWTH_LINKS, ROI, nis } from '@/config/growth';
import './growth-s.css';

const POOL = '/landing-hero/pool-p480.webp';
const POOL_AV = '/landing-hero/pool-p480.avif';
const HOST = '/landing-v8/ph/p-hostess-560';

/* example report numbers (labelled "דוגמה"): 3 direct weekend bookings at the ROI example night price */
const BOOKINGS = 3;
const REVENUE = BOOKINGS * ROI.nights * ROI.nightPrice;
const SAVED = Math.round(REVENUE * 0.15);
const BARS = [28, 40, 34, 52, 61, 78];
const MONTHS = ['מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳'];

function Photo({ avif, webp, w, h, alt = '', className = '' }) {
  return (
    <picture className={className}>
      {avif && <source type="image/avif" srcSet={avif} />}
      <img src={webp} alt={alt} width={w} height={h} loading="lazy" decoding="async" />
    </picture>
  );
}

function MockVideo() {
  return (
    <div className="gs-vid" aria-hidden="true">
      <div className="gs-src">
        <span className="gs-src-k">מהתמונות שלכם</span>
        <ul>
          <li><Photo avif={POOL_AV} webp={POOL} w={480} h={960} /></li>
          <li><Photo avif={`${HOST}.avif`} webp={`${HOST}.webp`} w={560} h={700} /></li>
          <li className="is-more"><span className="num" dir="ltr">+12</span></li>
        </ul>
      </div>
      <div className="gs-reel">
        <Photo avif={POOL_AV} webp={POOL} w={480} h={960} className="gs-reel-ph" />
        <div className="gs-reel-bars"><i className="is-done" /><i className="is-on" /><i /></div>
        <span className="gs-reel-play"><Play size={22} strokeWidth={2.4} /></span>
        <div className="gs-reel-cap">
          <b>סופ״ש פנוי בצימר הגפן</b>
          <span>2 לילות · בריכה פרטית</span>
        </div>
        <span className="gs-reel-dur num" dir="ltr">0:15</span>
      </div>
    </div>
  );
}

const SEASONS = ['סוכות', 'חנוכה', 'פסח', 'קיץ'];
function MockAd() {
  /* the mock ad stays hidden from assistive tech; only its button is real (WEB-003): it opens WhatsApp to
     schedule the growth call, so "שלחו הודעה" is never a dead control */
  return (
    <div className="gs-ad-wrap">
      <ul className="gs-seasons" aria-hidden="true">
        {SEASONS.map((s) => <li key={s} className={s === 'חנוכה' ? 'is-on' : ''}>{s}</li>)}
      </ul>
      <div className="gs-ad">
        <div className="gs-ad-hd" aria-hidden="true">
          <Photo avif={POOL_AV} webp={POOL} w={480} h={960} className="gs-ad-av" />
          <p><b>צימר הגפן</b><span>ממומן</span></p>
        </div>
        <Photo avif={`${HOST}.avif`} webp={`${HOST}.webp`} w={560} h={700} className="gs-ad-ph" />
        <div className="gs-ad-ft">
          <p className="gs-ad-h" aria-hidden="true">חנוכה בגליל: 2 לילות, ארוחת בוקר במרפסת</p>
          <a className="gs-ad-btn" href={GROWTH_LINKS.call} target="_blank" rel="noopener noreferrer" aria-label="שלחו הודעה: קביעת שיחה על חבילת הצמיחה בוואטסאפ (נפתח בחלון חדש)"><Mark ch="whatsapp" size={16} />שלחו הודעה</a>
        </div>
      </div>
    </div>
  );
}

function MockReport() {
  const max = Math.max(...BARS);
  return (
    <div className="gs-rep" aria-hidden="true">
      <div className="gs-rep-hd">
        <b>דוח אוקטובר</b>
        <span className="gs-rep-tag">דוגמה</span>
      </div>
      <p className="gs-rep-k">הזמנות ישירות מהמודעות</p>
      <p className="gs-rep-n num" dir="ltr">{nis(REVENUE)}</p>
      <div className="gs-rep-chart">
        {BARS.map((v, i) => (
          <div key={MONTHS[i]} className={`gs-rep-bar${i === BARS.length - 1 ? ' is-now' : ''}`}>
            <i style={{ '--h': `${Math.round((v / max) * 100)}%` }} />
            <span>{MONTHS[i]}</span>
          </div>
        ))}
      </div>
      <dl className="gs-rep-rows">
        <div><dt>פניות מהמודעות</dt><dd className="num" dir="ltr">12</dd></div>
        <div><dt>הזמנות</dt><dd className="num" dir="ltr">{BOOKINGS}</dd></div>
        <div className="is-key"><dt>עמלת ערוץ שנחסכה</dt><dd className="num" dir="ltr">{nis(SAVED)}</dd></div>
      </dl>
    </div>
  );
}

const TILES = [
  { k: 'video', I: Film, t: GROWTH_STATUS.soon[0], d: 'סרטונים קצרים לקמפיין באינסטגרם ובטיקטוק, מהתמונות של המתחם.', M: MockVideo },
  { k: 'ad', I: Megaphone, t: GROWTH_STATUS.soon[1], d: 'קמפיין ב-Meta וב-Google לכל עונה, ודף נחיתה או אתר למתחם. הפניות מגיעות ישר לוואטסאפ שלכם.', M: MockAd },
  { k: 'report', I: BarChart3, t: GROWTH_STATUS.soon[2], d: 'כל חודש רואים כמה פניות והזמנות הביאו הקמפיינים.', M: MockReport },
];

export default function GrowthS() {
  // mounted lazily, after the page-level reveal ran: reveal its own tiles
  const ref = useRef(null);
  useReveal(ref);
  useGrowthMotion(ref);
  return (
    <section ref={ref} id="growth" className="gs" aria-labelledby="growth-title">
      <div className="l5-wrap">
        <header className="gs-head" data-reveal>
          <p className="gs-kick"><span>{GROWTH_NAME}</span><span className="gs-soon">בקרוב</span></p>
          <h2 id="growth-title" className="gs-h">יותר הזמנות ישירות. <span>בלי עמלה.</span></h2>
          <p className="gs-lede">קמפיינים ודף נחיתה או אתר למתחם, מהתמונות שכבר יש לכם. מתחילים בשיחה קצרה.</p>
        </header>

        <ul className="gs-tiles">
          {TILES.map(({ k, I, t, d, M }, i) => (
            <li key={k} className={`gs-tile is-${k}`} data-reveal style={{ '--d': `${i * 60}ms` }}>
              <div className="gs-vis"><M /></div>
              <div className="gs-copy">
                <p className="gs-tag"><I size={16} strokeWidth={2.2} aria-hidden="true" />בקרוב</p>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="gs-foot">
          <p className="gs-ex">הדמיה להמחשה, נתוני דוגמה.</p>
          <p className="gs-ready">{`כבר היום עם atlas: ${GROWTH_STATUS.ready.join(' ו')}.`}</p>
          <a className="gs-link" href="#pricing-growth">המחיר של צמיחה<ArrowDown size={16} strokeWidth={2.2} aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}
