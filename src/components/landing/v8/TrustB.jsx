/**
 * Landing trust section, version B "יש לנו מספר טלפון" (bold).
 * An indigo stage owns the honest fact (beta, no reviews yet) and puts the founder's real phone on a
 * white contact card. Below: six promises as a numbered editorial list, each linking to where it is
 * written, and a "works today / not yet" pair. A real beta quote shows ONLY when
 * src/config/testimonials.js holds one (empty today). No reviews, ratings, counts or logos.
 */
import React from 'react';
import { Check, Minus, Phone, ArrowUpLeft } from 'lucide-react';
import { Mark } from '../v5/ui';
import { visibleTestimonials } from '@/config/testimonials';
import { FOUNDER, PROMISES, DOES, NOT_YET } from './trust-content';
import './trust-b.css';

function Avatar() {
  if (FOUNDER.photo) return <img className="tb-av" src={FOUNDER.photo} alt="" width="56" height="56" loading="lazy" decoding="async" />;
  return <span className="tb-av is-mono" aria-hidden="true">דו</span>;
}

function Quotes() {
  const list = visibleTestimonials();
  if (!list.length) return null;
  return (
    <ul className="tb-quotes" aria-label="מה אומרים מתחמים מתקופת הבטא">
      {list.map((q) => (
        <li key={q.name + q.quote.slice(0, 12)} className="tb-quote" data-reveal>
          <p className="tb-quote-tag">מתוך תקופת הבטא · פורסם באישור</p>
          <blockquote><p>״{q.quote}״</p></blockquote>
          <p className="tb-quote-by"><b>{q.name}</b>{` · ${q.role}`}{q.place ? ` · ${q.place}` : ''}</p>
        </li>
      ))}
    </ul>
  );
}

export default function TrustB() {
  return (
    <section id="trust" className="tb" aria-labelledby="trust-title">
      <div className="l7-inset">
        <div className="tb-stage">
          <div className="tb-copy" data-reveal>
            <p className="tb-eyebrow">ATLAS בבטא, בגלוי</p>
            <h2 id="trust-title" className="tb-h">עוד אין לנו מאות ביקורות. <span>יש לנו מספר טלפון.</span></h2>
            {FOUNDER.letter.map((p) => <p key={p.slice(0, 16)} className="tb-p">{p}</p>)}
          </div>

          <div className="tb-card" data-reveal style={{ '--d': '90ms' }}>
            <div className="tb-card-who">
              <Avatar />
              <div>
                <p className="tb-name">{FOUNDER.name}</p>
                <p className="tb-role">{FOUNDER.role}</p>
              </div>
            </div>
            <p className="tb-card-cap">דברו איתי ישירות</p>
            <a className="tb-call" href={FOUNDER.tel} aria-label={`להתקשר לדין: ${FOUNDER.phone}`}>
              <span dir="ltr" className="num">{FOUNDER.phone}</span>
            </a>
            <div className="tb-card-cta">
              <a className="l5-btn tb-wa" href={FOUNDER.wa} target="_blank" rel="noopener noreferrer">
                <Mark ch="whatsapp" size={18} />וואטסאפ
              </a>
              <a className="l5-btn is-quiet" href={FOUNDER.tel}>
                <Phone size={17} strokeWidth={2} aria-hidden="true" />שיחה
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="l5-wrap">
        <Quotes />

        <div className="tb-pr-head" data-reveal>
          <h3 className="tb-h3">מה מובטח לכם, <span className="is-ind">ואיפה זה כתוב.</span></h3>
          <p className="v8-txt">כל שורה כאן כתובה גם בתנאי השימוש ובמדיניות. לחצו ותבדקו.</p>
        </div>
        <ol className="tb-promises">
          {PROMISES.map(({ I, t, d, href, src, ext }, i) => (
            <li key={t} className="tb-pr" data-reveal style={{ '--d': `${(i % 3) * 60}ms` }}>
              <div className="tb-pr-top">
                <span className="tb-pr-n num" dir="ltr">{String(i + 1).padStart(2, '0')}</span>
                <I size={22} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <h4 className="tb-pr-t">{t}</h4>
              <p className="tb-pr-d">{d}</p>
              <a className="tb-pr-src" href={href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {ext ? 'לכתוב עכשיו' : `כתוב ב${src}`}<ArrowUpLeft size={14} strokeWidth={2.2} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ol>

        <div className="tb-honest">
          <div className="tb-col is-yes" data-reveal>
            <h3 className="tb-col-h"><Check size={18} strokeWidth={2.8} aria-hidden="true" />עובד היום</h3>
            <ul>{DOES.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div className="tb-col is-no" data-reveal style={{ '--d': '80ms' }}>
            <h3 className="tb-col-h"><Minus size={18} strokeWidth={2.8} aria-hidden="true" />עוד לא, ואנחנו אומרים את זה מראש</h3>
            <ul>{NOT_YET.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}
