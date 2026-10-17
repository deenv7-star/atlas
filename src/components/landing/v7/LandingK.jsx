/**
 * Landing v7 K "תמונה חיה" (living photo bento), from Deen's Horizon Courts / Finovate / Teamway
 * references. A big rounded photo hero inset in the page (guests jumping into the pool, cool daylight)
 * with a giant white headline and floating product chips; a rich bento of real photo tiles mixed with
 * bold solid indigo tiles and sky / mint / lilac tiles, each with one short line and one product fact;
 * an auto-scrolling strip of real moments and product notifications; product numbers; pricing; FAQ;
 * a bold indigo final CTA.
 *
 * Nothing on the page is a testimonial, a customer logo or a customer count. Names next to faces are
 * example guests inside example bookings. Photos: free-licence Pexels / Unsplash, cool-graded.
 */
import React, { useRef } from 'react';
import {
  Check, CheckCheck, ChevronDown, CalendarDays, Wallet, MessageCircle, FileText, SprayCan, Star,
  LogIn, LogOut, Bell, Sparkles,
} from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { useReveal, useInView, useCountUp } from '../v5/motion';
import { Mark } from '../v5/ui';
import { Faq, Footer, SignupButton } from '../v5/LandingV5';
import { V7Header, PhotoCredits } from './shared7';
import { KL, FACES, Face, KlPricing, KlFinal } from './shared7kl';
import '../v5/landing-v5.css';
import '../v6/landing-v6.css';
import './landing-v7.css';
import './landing-v7kl.css';
import './landing-v7k.css';

const NAV = [['#product', 'המוצר'], ['#moments', 'רגעים'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

/* ---------------- small chips ---------------- */
function Chip({ lead, title, sub, className = '', style }) {
  return (
    <div className={`lk-chip ${className}`} style={style}>
      <span className="lk-chip-lead">{lead}</span>
      <span className="lk-chip-txt"><b>{title}</b>{sub && <small>{sub}</small>}</span>
    </div>
  );
}

function FaceLead({ f, ch }) {
  return (
    <>
      <Face f={f} size={40} lazy={false} />
      {ch && <span className="lk-chip-ch"><Mark ch={ch} size={13} /></span>}
    </>
  );
}

/* ---------------- hero ---------------- */
function Hero() {
  return (
    <section className="lk-hero" aria-labelledby="hero-title">
      <div className="l7-inset">
        <div className="lk-hero-box">
          <picture className="lk-hero-img">
            <source media="(max-width: 767px)" srcSet={`${KL}/k-hero-m.webp`} width="900" height="1200" />
            <img src={`${KL}/k-hero.webp`} alt="ילדים קופצים לבריכה של מתחם אירוח ביום בהיר" width="1800" height="1035" fetchPriority="high" decoding="async" />
          </picture>
          <div className="lk-hero-shade" aria-hidden="true" />
          <div className="lk-hero-copy">
            <p className="lk-pill l5-in" style={{ '--i': 0 }}><span className="lk-live" aria-hidden="true" />ניהול צימרים ומתחמי אירוח</p>
            <h1 id="hero-title" className="lk-h1">
              <span className="l5-h1-line" style={{ '--i': 1 }}>הצימר מלא.</span>
              <span className="l5-h1-line" style={{ '--i': 2 }}>הראש פנוי.</span>
            </h1>
          </div>
          <div className="lk-hero-foot">
            <p className="lk-lead l5-in" style={{ '--i': 3 }}>הזמנות מכל הערוצים, תשלומים והודעות לאורחים מתנהלים לבד. אתם נשארים עם האורחים.</p>
            <div className="lk-cta l5-in" style={{ '--i': 4 }}>
              <SignupButton className="is-lg is-white" />
              <a href="#product" className="lk-glass">איך זה עובד<ChevronDown size={18} strokeWidth={2} aria-hidden="true" /></a>
            </div>
          </div>
          <div className="lk-hero-chips" aria-hidden="true">
            <Chip className="is-c1 l7-float" style={{ '--i': 0 }} lead={<FaceLead f={FACES.maya} ch="booking" />} title="הזמנה חדשה מ-Booking.com" sub="מאיה כ. · 3 לילות · סוויטת האלון" />
            <Chip className="is-c2 l7-float" style={{ '--i': 1 }} lead={<span className="lk-ic is-mint"><Check size={18} strokeWidth={3} /></span>} title={<><span className="num" dir="ltr">₪750</span> התקבל</>} sub="מקדמה · נועה ל." />
            <Chip className="is-c3 l7-float" style={{ '--i': 2 }} lead={<span className="lk-ic is-wa"><Mark ch="whatsapp" size={18} /></span>} title={<>הוראות הגעה נשלחו <CheckCheck size={15} strokeWidth={2.25} className="lk-ticks" /></>} sub="וואטסאפ לנועה · 18:00" />
            <div className="lk-stack is-c4 l7-float" style={{ '--i': 3 }}>
              <span className="lk-stack-faces">
                {[FACES.noa, FACES.tom, FACES.shir, FACES.adam].map((f) => <Face key={f.src} f={f} size={34} lazy={false} />)}
              </span>
              <span className="lk-stack-txt"><b>4 הגעות היום</b><small>כולן שולמו</small></span>
            </div>
            <div className="lk-stat is-c5 l7-float" style={{ '--i': 4 }}>
              <b className="num">3</b>
              <span>ערוצים<br />לוח אחד</span>
            </div>
          </div>
        </div>
      </div>
      <ul className="lk-channels l5-wrap" aria-label="ATLAS מתחברת ל">
        <li><Mark ch="airbnb" size={20} />Airbnb</li>
        <li><Mark ch="booking" size={20} />Booking.com</li>
        <li><Mark ch="gcal" size={20} />Google Calendar</li>
        <li><Mark ch="whatsapp" size={20} />WhatsApp</li>
        <li><Mark ch="direct" size={20} />הזמנה ישירה</li>
      </ul>
    </section>
  );
}

/* ---------------- bento ---------------- */
const CAL_ROWS = [
  { u: 'האלון', bars: [[0, 2, 'airbnb', 'מיכל ר.'], [3, 3, 'direct', 'אבי כ.']] },
  { u: 'הזית', bars: [[1, 3, 'booking', 'Jonas M.'], [5, 2, 'direct', 'נועה ל.']] },
  { u: 'התאנה', bars: [[0, 2, 'direct', 'דנה א.'], [2, 4, 'airbnb', 'יוסי ב.']] },
  { u: 'הגפן', bars: [[0, 3, 'booking', 'Marc D.'], [4, 3, 'booking', 'מאיה כ.', 1]] },
];

function MiniCal() {
  return (
    <div className="lk-cal" aria-hidden="true">
      {CAL_ROWS.map((r, ri) => (
        <div key={r.u} className="lk-cal-row">
          <span className="lk-cal-u">{r.u}</span>
          <span className="lk-cal-lane">
            {r.bars.map(([s, n, ch, g, isNew], bi) => (
              <span key={g} className={`lk-bar is-${ch}${isNew ? ' is-new' : ''}`} style={{ '--s': s, '--n': n, '--d': `${ri * 90 + bi * 140}ms` }}>
                {ch !== 'direct' && <Mark ch={ch} size={11} />}<b>{g}</b>{isNew && <em>חדש</em>}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function Pays() {
  return (
    <ul className="lk-pays" aria-hidden="true">
      <li><span className="lk-ic is-mint is-sm"><Check size={14} strokeWidth={3} /></span><span><b>נועה ל.</b><small>מקדמה 30%</small></span><b className="num" dir="ltr">₪750</b></li>
      <li><span className="lk-ic is-ind is-sm"><Bell size={14} strokeWidth={2.4} /></span><span><b>אבי כ.</b><small>תזכורת ליתרה נשלחה</small></span><b className="num" dir="ltr">₪900</b></li>
    </ul>
  );
}

function Chat() {
  return (
    <div className="lk-chat" aria-hidden="true">
      <p className="lk-msg is-out">היי נועה, מחכים לכם מחר מ-15:00. הקוד לדלת: 4821 <CheckCheck size={14} strokeWidth={2.25} className="lk-ticks" /></p>
      <p className="lk-msg is-in">תודה! נגיע בסביבות 16:00</p>
    </div>
  );
}

function Bars() {
  return (
    <div className="lk-rep" aria-hidden="true">
      {[['Airbnb', 62, 'airbnb'], ['Booking', 84, 'booking'], ['ישיר', 100, 'direct']].map(([l, h, c], i) => (
        <span key={l} className={`lk-rep-col is-${c}`} style={{ '--h': `${h}%`, '--d': `${i * 120}ms` }}><i /><small>{l}</small></span>
      ))}
    </div>
  );
}

function Day() {
  return (
    <ul className="lk-day" aria-hidden="true">
      <li><LogOut size={16} strokeWidth={2} /><span>יציאה · סוויטת האלון</span><b className="num">11:00</b></li>
      <li className="is-on"><SprayCan size={16} strokeWidth={2} /><span>ניקיון שובץ לדנה</span><b className="num">12:00</b></li>
      <li><LogIn size={16} strokeWidth={2} /><span>הגעה · נועה ל.</span><b className="num">15:00</b></li>
    </ul>
  );
}

function PhotoTile({ src, w, h, pos = '50% 50%', title, text, chip, className = '' }) {
  return (
    <li className={`lk-t is-photo ${className}`} data-reveal>
      <img src={src} alt="" width={w} height={h} loading="lazy" decoding="async" style={{ objectPosition: pos }} />
      {chip && <div className="lk-t-chip">{chip}</div>}
      <div className="lk-t-cap">
        <h3>{title}</h3>
        {text && <p>{text}</p>}
      </div>
    </li>
  );
}

function ColorTile({ tone, icon: I, kick, title, text, stat, children, className = '' }) {
  return (
    <li className={`lk-t is-${tone} ${className}`} data-reveal>
      <p className="lk-kick"><I size={16} strokeWidth={2.2} aria-hidden="true" />{kick}</p>
      <h3>{title}</h3>
      {text && <p className="lk-t-txt">{text}</p>}
      <div className="lk-t-ui">{children}</div>
      {stat && <p className="lk-t-stat"><b className="num">{stat[0]}</b><span>{stat[1]}</span></p>}
    </li>
  );
}

function Bento() {
  return (
    <section id="product" className="l5-sec lk-bento-sec" aria-labelledby="bento-title">
      <div className="l5-wrap">
        <div className="kl-head" data-reveal>
          <h2 id="bento-title" className="kl-h2">כל מה שקורה במתחם. <span className="is-ind">במקום אחד.</span></h2>
          <p className="kl-txt">מההזמנה הראשונה ועד הדוח של סוף החודש. ATLAS עובדת ברקע, אתם עם האנשים.</p>
        </div>
        <ul className="lk-bento">
          <PhotoTile
            className="is-a"
            src={`${KL}/hostdoor.webp`} w={800} h={1200} pos="50% 30%"
            title="מקבלים אורחים, לא שיחות טלפון."
            text="הקוד לדלת והוראות ההגעה כבר אצלם."
            chip={<Chip lead={<span className="lk-ic is-ind"><LogIn size={16} strokeWidth={2.4} /></span>} title="צ׳ק-אין 15:00" sub="הקוד נשלח בוואטסאפ" />}
          />
          <ColorTile className="is-b" tone="ind" icon={CalendarDays} kick="לוח שנה" title="שלושה ערוצים. לוח אחד." stat={['3', 'Airbnb, Booking.com וישיר, מסונכרנים']}>
            <MiniCal />
          </ColorTile>
          <PhotoTile
            className="is-c"
            src={`${KL}/pool4.webp`} w={1400} h={560} pos="50% 40%"
            title="אורחים שחוזרים מזמינים ישר."
            chip={<Chip lead={<span className="lk-ic is-ind"><Mark ch="direct" size={16} /></span>} title={<><span className="num" dir="ltr">₪0</span> עמלה</>} sub="על הזמנה מהעמוד הישיר שלכם" />}
          />
          <ColorTile className="is-d" tone="mint" icon={Wallet} kick="תשלומים" title="המקדמה נכנסת לבד.">
            <Pays />
          </ColorTile>
          <ColorTile className="is-e" tone="sky" icon={MessageCircle} kick="וואטסאפ" title="הודעות שיוצאות בזמן." stat={['24/7', 'נשלח אוטומטית, בשמכם']}>
            <Chat />
          </ColorTile>
          <PhotoTile
            className="is-f"
            src={`${KL}/hammock.webp`} w={1200} h={800} pos="50% 45%"
            title="והזמן שלכם חוזר אליכם."
            text="פחות טלפונים, פחות אקסלים."
          />
          <ColorTile className="is-g" tone="lilac" icon={FileText} kick="דוחות" title="סוף החודש? הדוח מוכן." stat={['PDF', 'או CSV לרואה החשבון, בלחיצה']}>
            <Bars />
          </ColorTile>
          <PhotoTile
            className="is-h"
            src={`${KL}/splash.webp`} w={1100} h={733} pos="50% 40%"
            title="סופ״ש מלא, בלי בלגן."
            chip={<Chip lead={<span className="lk-ic is-mint"><Sparkles size={16} strokeWidth={2.2} /></span>} title="4 יחידות · 4 הגעות" sub="הכל מסודר בלוח היומי" />}
          />
          <ColorTile className="is-i" tone="ind" icon={SprayCan} kick="הצוות" title="הצוות יודע מה לנקות, ומתי." text="לוח יומי אחד: יציאות, ניקיון והגעות.">
            <Day />
          </ColorTile>
        </ul>
        <p className="kl-cap" data-reveal>הנתונים בכרטיסים הם דוגמה.</p>
      </div>
    </section>
  );
}

/* ---------------- moments marquee ---------------- */
const ROW_A = [
  { p: 'laugh', w: 1000, h: 666, pos: '50% 35%' },
  { n: 'ind', I: CalendarDays, t: 'הזמנה חדשה · Airbnb', s: 'שירן ג. · 2 לילות · הזית', f: FACES.shir },
  { p: 'coffee', w: 1100, h: 733, pos: '45% 45%' },
  { n: 'mint', I: Check, t: '₪2,140 התקבל', s: 'Booking.com · Jonas M.' },
  { p: 'dive', w: 1100, h: 733, pos: '50% 30%' },
  { n: 'sky', I: MessageCircle, t: 'הוראות הגעה נשלחו', s: 'וואטסאפ לנועה ל. · 18:00', f: FACES.noa },
  { p: 'selfie', w: 800, h: 1040, pos: '50% 30%' },
];
const ROW_B = [
  { n: 'lilac', I: Star, t: 'ביקורת חדשה מאורח', s: '★ 5 · Airbnb · תום ש.', f: FACES.tom },
  { p: 'welcome', w: 1100, h: 733, pos: '60% 40%' },
  { n: 'ind', I: SprayCan, t: 'ניקיון הושלם', s: 'בקתת הזית · מוכנה ל-15:00' },
  { p: 'tablet', w: 1000, h: 666, pos: '40% 40%' },
  { n: 'mint', I: Bell, t: 'תזכורת ליתרה נשלחה', s: 'אבי כ. · ₪900' },
  { p: 'hammock', w: 1200, h: 800, pos: '50% 45%' },
  { n: 'sky', I: FileText, t: 'הדוח של אוקטובר מוכן', s: 'הכנסות לפי ערוץ ויחידה' },
];

function Moment({ m }) {
  if (m.p) {
    return <li className="lk-m is-photo"><img src={`${KL}/${m.p}.webp`} alt="" width={m.w} height={m.h} decoding="async" style={{ objectPosition: m.pos }} /></li>;
  }
  const I = m.I;
  return (
    <li className={`lk-m is-note is-${m.n}`}>
      <span className="lk-m-top">
        {m.f ? <Face f={m.f} size={40} /> : <span className="lk-m-ic"><I size={18} strokeWidth={2.2} /></span>}
        <small>עכשיו</small>
      </span>
      <b>{m.t}</b>
      <span className="lk-m-sub">{m.s}</span>
    </li>
  );
}

function Track({ items, rev = false }) {
  return (
    <div className={`lk-track${rev ? ' is-rev' : ''}`}>
      <ul className="lk-run">{items.map((m, i) => <Moment key={i} m={m} />)}</ul>
      <ul className="lk-run" aria-hidden="true">{items.map((m, i) => <Moment key={i} m={m} />)}</ul>
    </div>
  );
}

function Moments() {
  return (
    <section id="moments" className="l5-sec lk-moments" aria-labelledby="moments-title">
      <div className="l5-wrap">
        <div className="kl-head is-center" data-reveal>
          <h2 id="moments-title" className="kl-h2">רגעים אמיתיים. <span className="is-ind">המערכת ברקע.</span></h2>
          <p className="kl-txt">כל מה שהאורחים חווים, וכל מה ש-ATLAS עושה בשבילכם בזמן הזה.</p>
        </div>
      </div>
      <div className="lk-marquee" aria-hidden="true">
        <Track items={ROW_A} />
        <Track items={ROW_B} rev />
      </div>
    </section>
  );
}

/* ---------------- product numbers ---------------- */
const NUMS = [
  { to: 3, pre: '', u: 'ערוצים', t: 'Airbnb, Booking.com וישיר על לוח אחד', tone: 'ind' },
  { to: 10, pre: '', u: 'דקות', t: 'מההרשמה ועד לוח מסונכרן', tone: 'sky' },
  { to: 14, pre: '', u: 'ימים', t: 'ניסיון חינם, בלי כרטיס אשראי', tone: 'mint' },
  { to: 0, pre: '₪', u: 'עמלה', t: 'על הזמנות מעמוד ההזמנה הישירה', tone: 'lilac' },
];

function Num({ n, start, i }) {
  const v = useCountUp(n.to, start, 900 + i * 120);
  return (
    <li className={`lk-num is-${n.tone}`} data-reveal style={{ '--d': `${i * 80}ms` }}>
      <b className="num" dir="ltr">{n.pre}{v}</b>
      <span className="lk-num-u">{n.u}</span>
      <p>{n.t}</p>
    </li>
  );
}

function Numbers() {
  const ref = useRef(null);
  const seen = useInView(ref, { margin: '0px 0px -15% 0px' });
  return (
    <section className="lk-nums-sec" aria-labelledby="nums-title">
      <div className="l5-wrap">
        <h2 id="nums-title" className="kl-h2 is-sm" data-reveal>המוצר, במספרים.</h2>
        <ul ref={ref} className="lk-nums">
          {NUMS.map((n, i) => <Num key={n.u} n={n} start={seen} i={i} />)}
        </ul>
      </div>
    </section>
  );
}

export default function LandingK() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l6 l7 kl lk" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main">
        <Hero />
        <Bento />
        <Moments />
        <Numbers />
        <KlPricing />
        <Faq limit={5} />
        <KlFinal title={<>המתחם מתמלא.<br />ATLAS עושה את השאר.</>} />
      </main>
      <PhotoCredits />
      <Footer />
      <CookieConsent revealAfter=".lk-hero" />
    </div>
  );
}
