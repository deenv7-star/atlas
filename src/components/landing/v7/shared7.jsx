/**
 * Landing v7 shared bits (brand/refs-landing-deen.md): light header, floating chips (avatar
 * notifications, stat chips), a CSS phone frame, the product-facts row and the photo credits.
 * Photos are real, free-licence (Unsplash / Pexels), cool-graded, webp, in public/landing-v7.
 * Chip content is example product data (a booking, a payment, a message), never a testimonial.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCheck, Star } from 'lucide-react';
import { Mark, Wordmark } from '../v5/ui';

export const IMG = '/landing-v7';

export const AV = {
  w1: `${IMG}/av-woman1.webp`,
  w2: `${IMG}/av-woman2.webp`,
  m1: `${IMG}/av-man1.webp`,
  m3: `${IMG}/av-man3.webp`,
  m5: `${IMG}/av-man5.webp`,
};

const DEFAULT_NAV = [['#product', 'המוצר'], ['#how', 'איך מתחילים'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

export function V7Header({ links = DEFAULT_NAV }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 16);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={`l7-hdr${solid ? ' is-solid' : ''}`}>
      <div className="l5-wrap l7-hdr-in">
        <Link to="/" className="l5-logo" aria-label="atlas, לדף הבית"><Wordmark /></Link>
        <nav className="l7-nav" aria-label="ניווט ראשי">
          {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className="l7-hdr-end">
          <Link to="/login" className="l7-login">כניסה</Link>
          <Link to="/register" className="l7-hdr-cta">להתחיל חינם</Link>
        </div>
      </div>
    </header>
  );
}

function Avatar({ src, size = 36, alt = '' }) {
  return <img className="l7-av" src={src} alt={alt} width={size} height={size} decoding="async" style={{ '--s': `${size}px` }} />;
}

/** Notification chip: avatar (or channel mark) + title + subline. */
export function Chip({ av, ch, icon, title, sub, className = '', style }) {
  return (
    <div className={`l7-chip ${className}`} style={style}>
      <span className="l7-chip-lead">
        {av && <Avatar src={av} />}
        {icon}
        {ch && <span className="l7-chip-ch"><Mark ch={ch} size={14} /></span>}
      </span>
      <span className="l7-chip-txt"><b>{title}</b>{sub && <small>{sub}</small>}</span>
    </div>
  );
}

export function BookingChip({ className = '', style }) {
  return <Chip className={className} style={style} av={AV.w2} ch="booking" title="הזמנה חדשה מ-Booking.com" sub="מאיה כ. · 3 לילות · סוויטת האלון" />;
}

export function PaidChip({ amount = '₪750', sub = 'מקדמה · נועה לוי', className = '', style }) {
  return (
    <Chip
      className={`is-paid ${className}`}
      style={style}
      icon={<span className="l7-ic is-mint"><Check size={16} strokeWidth={3} /></span>}
      title={<><span className="num" dir="ltr">{amount}</span> התקבל</>}
      sub={sub}
    />
  );
}

export function WaChip({ className = '', style }) {
  return (
    <Chip
      className={className}
      style={style}
      icon={<span className="l7-ic is-wa"><Mark ch="whatsapp" size={16} /></span>}
      title={<>הוראות הגעה נשלחו <CheckCheck size={15} strokeWidth={2.25} className="l7-ticks" aria-hidden="true" /></>}
      sub="וואטסאפ לנועה · 18:00"
    />
  );
}

export function ReviewChip({ className = '', style }) {
  return (
    <div className={`l7-chip is-review ${className}`} style={style}>
      <span className="l7-chip-lead"><Avatar src={AV.m1} /></span>
      <span className="l7-chip-txt">
        <b className="l7-stars" aria-label="דירוג 4.9 מתוך 5">
          {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={13} strokeWidth={0} fill="currentColor" aria-hidden="true" />)}
          <span className="num" dir="ltr">4.9</span>
        </b>
        <small>ביקורת חדשה מאורח · Airbnb</small>
      </span>
    </div>
  );
}

/** Small round avatar with a status line, for B's floating faces. */
export function FaceChip({ src, line, tone = 'indigo', className = '', style }) {
  return (
    <div className={`l7-face ${className}`} style={style}>
      <img src={src} alt="" width="56" height="56" loading="lazy" decoding="async" />
      <span className={`l7-face-tag is-${tone}`}>{line}</span>
    </div>
  );
}

/** CSS phone (no device image): rounded body, island, a screen slot. */
export function Phone({ children, className = '' }) {
  return (
    <div className={`l7-phone ${className}`} aria-hidden="true">
      <div className="l7-phone-scr">
        <div className="l7-phone-bar"><span className="num" dir="ltr">9:41</span><i /></div>
        {children}
      </div>
    </div>
  );
}

/** Product facts only (no customer counts). */
export const FACTS = [
  { n: '3', u: 'ערוצים', t: 'Airbnb, Booking.com וישיר על לוח אחד' },
  { n: '10', u: 'דקות', t: 'מההרשמה ועד לוח מסונכרן' },
  { n: '14', u: 'ימים', t: 'ניסיון חינם, בלי כרטיס אשראי' },
  { n: '₪0', u: 'עמלה', t: 'על הזמנות מעמוד ההזמנה הישירה' },
];

export function FactsRow({ className = '' }) {
  return (
    <ul className={`l7-facts ${className}`}>
      {FACTS.map((f, i) => (
        <li key={f.u} data-reveal style={{ '--d': `${i * 70}ms` }}>
          <b className="num" dir="ltr">{f.n}</b>
          <span className="l7-facts-u">{f.u}</span>
          <p>{f.t}</p>
        </li>
      ))}
    </ul>
  );
}

export function PhotoCredits() {
  return (
    <p className="l7-credits">
      צילומים: Unsplash ו-Pexels (רישיון חופשי). הנתונים בכרטיסים הם דוגמה.
    </p>
  );
}
