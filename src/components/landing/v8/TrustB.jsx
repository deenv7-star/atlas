/**
 * Landing trust section, version B "מה שרואים, זה מה שמקבלים" (bold).
 * A solid indigo stage carries the headline and the six promises as a numbered list, each linking to
 * where it is written in the terms / policies. Below: a "works today / not yet" pair.
 * A real customer quote shows ONLY when src/config/testimonials.js holds one (empty today).
 * No founder letter, no personal framing, no reviews, ratings, counts or logos.
 */
import React from 'react';
import { Check, Minus, ArrowUpLeft } from 'lucide-react';
import { visibleTestimonials } from '@/config/testimonials';
import { PROMISES, DOES, NOT_YET } from './trust-content';
import './trust-b.css';

function Quotes() {
  const list = visibleTestimonials();
  if (!list.length) return null;
  return (
    <ul className="tb-quotes" aria-label="מה אומרים בעלי מתחמים">
      {list.map((q) => (
        <li key={q.name + q.quote.slice(0, 12)} className="tb-quote" data-reveal>
          <p className="tb-quote-tag">פורסם באישור הלקוח</p>
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
            <p className="tb-eyebrow">התחייבויות ATLAS</p>
            <h2 id="trust-title" className="tb-h">מה שרואים, <span>זה מה שמקבלים.</span></h2>
            <p className="tb-p">שש התחייבויות שכתובות גם בתנאי השימוש ובמדיניות. לחצו על כל אחת ותראו איפה.</p>
          </div>

          <ol className="tb-promises">
            {PROMISES.map(({ I, t, d, href, src, ext }, i) => (
              <li key={t} className="tb-pr" data-reveal style={{ '--d': `${(i % 3) * 60}ms` }}>
                <div className="tb-pr-top">
                  <span className="tb-pr-n num" dir="ltr">{String(i + 1).padStart(2, '0')}</span>
                  <I size={22} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <h3 className="tb-pr-t">{t}</h3>
                <p className="tb-pr-d">{d}</p>
                <a className="tb-pr-src" href={href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  {ext ? 'לכתוב עכשיו' : `כתוב ב${src}`}<ArrowUpLeft size={14} strokeWidth={2.2} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="l5-wrap">
        <Quotes />

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
