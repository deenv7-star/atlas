/**
 * Landing hero "כל המתחם. במבט אחד." (restored from landing v9 Q, commit ea07f10).
 *
 * A full-bleed aerial photo of a pool complex in the green, a huge white headline, and three glass
 * notifications arriving (new booking, WhatsApp confirmation, deposit). Static: no scroll-driven
 * shrink, so the rest of the current landing follows it untouched.
 *
 * The photo is art-directed: a 1:2 portrait crop for phones, the full 4:3 frame from tablets up,
 * AVIF first with a WebP fallback. The same files are preloaded from index.html for "/" only.
 * Every name and amount in the notifications is example data.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Mark } from '../v5/ui';
import { CTA_SIGNUP, CTA_NOTE } from '../v5/content';
import { FACES } from './shared8';
import './hero-photo.css';

const P = '/landing-hero';
const PORTRAIT = '(max-aspect-ratio: 2/3)';
const set = (ext, list) => list.map(([f, w]) => `${P}/${f}.${ext} ${w}w`).join(', ');
const PORT = [['pool-p480', 480], ['pool-p720', 720]];
const LAND = [['pool-960', 960], ['pool-1280', 1280], ['pool-1920', 1920]];

const NTFS = [
  { ch: 'booking', title: 'הזמנה חדשה מ-Booking.com', sub: 'שירן ג. · הזית · 2 לילות', time: '08:12' },
  { ch: 'whatsapp', title: 'אישור נשלח בוואטסאפ', sub: 'משפחת לוי · עם הוראות הגעה', time: '09:00' },
  { face: 'noa', title: 'נועה ל. שילמה מקדמה', sub: '‏₪1,250 · האלון · נרשם לבד', time: '10:24' },
];

function Notif({ ch, face, title, sub, time, i }) {
  return (
    <div className="ph-ntf" style={{ '--i': i }}>
      <span className="ph-ntf-ic" aria-hidden="true">
        {face
          ? <img className="ph-face" src={FACES[face].src} alt="" width="40" height="40" decoding="async" />
          : <span className={`ph-ntf-mk is-${ch}`}><Mark ch={ch} size={ch === 'booking' ? 22 : 20} /></span>}
      </span>
      <span className="ph-ntf-tx"><b>{title}</b><small>{sub}</small></span>
      <span className="ph-ntf-t num" dir="ltr">{time}</span>
    </div>
  );
}

export default function HeroPhoto() {
  return (
    <section className="ph-hero" aria-labelledby="hero-title">
      <picture className="ph-photo">
        <source media={PORTRAIT} type="image/avif" srcSet={set('avif', PORT)} sizes="100vw" />
        <source media={PORTRAIT} type="image/webp" srcSet={set('webp', PORT)} sizes="100vw" />
        <source type="image/avif" srcSet={set('avif', LAND)} sizes="100vw" />
        <img
          src={`${P}/pool-1280.webp`}
          srcSet={set('webp', LAND)}
          sizes="100vw"
          alt="מתחם אירוח עם בריכה בין עצים, מבט מלמעלה"
          width="1920"
          height="1440"
          fetchPriority="high"
        />
      </picture>
      <i className="ph-scrim" aria-hidden="true" />
      <div className="ph-in">
        <div className="ph-copy">
          <h1 id="hero-title" className="ph-h1">כל המתחם.<br />במבט אחד.</h1>
          <p className="ph-sub">הזמנות מכל הערוצים, וואטסאפ לאורחים ותשלומים, במסך אחד שעובד בשבילכם.</p>
          <div className="ph-ctas">
            <Link to="/register" className="ph-btn">
              <span>{CTA_SIGNUP}</span>
              <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" className="ph-btn-ar" />
            </Link>
            <a href="#features" className="ph-ghost">איך זה נראה</a>
          </div>
          <p className="ph-note"><Check size={15} strokeWidth={2.6} aria-hidden="true" />{CTA_NOTE} · הגדרה תוך 10 דקות</p>
        </div>
        <div className="ph-ntfs" aria-hidden="true">
          {NTFS.map((n, i) => <Notif key={n.title} {...n} i={i} />)}
        </div>
      </div>
    </section>
  );
}
