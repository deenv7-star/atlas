/**
 * Landing trust section, version A "בלי אותיות קטנות" (calm, white tiles with mini mock-ups).
 * Headline + four visual promises (2-5 word label each), each linking to where it is written.
 * A real customer quote shows ONLY when src/config/testimonials.js holds one (empty today).
 * No reviews, ratings, customer counts, logos or founder content.
 */
import React from 'react';
import { ArrowUpLeft } from 'lucide-react';
import { visibleTestimonials } from '@/config/testimonials';
import { TRUST } from './trust-content';
import { MOCKS } from './TrustMocks';
import './trust-mocks.css';
import './trust-a.css';

function Quotes() {
  const list = visibleTestimonials();
  if (!list.length) return null;
  return (
    <ul className="ta-quotes" aria-label="מה אומרים בעלי מתחמים">
      {list.map((q) => (
        <li key={q.name + q.quote.slice(0, 12)} className="ta-quote" data-reveal>
          <p className="ta-quote-tag">פורסם באישור הלקוח</p>
          <blockquote><p>״{q.quote}״</p></blockquote>
          <p className="ta-quote-by"><b>{q.name}</b>{` · ${q.role}`}{q.place ? ` · ${q.place}` : ''}</p>
        </li>
      ))}
    </ul>
  );
}

export default function TrustA() {
  return (
    <section id="trust" className="ta" aria-labelledby="trust-title">
      <div className="l5-wrap">
        <div className="ta-head" data-reveal>
          <h2 id="trust-title" className="v8-h2">בלי אותיות <span className="is-ind">קטנות.</span></h2>
          <p className="ta-sub">מה שכתוב כאן, כתוב גם בתקנון.</p>
        </div>

        <ul className="ta-grid">
          {TRUST.map(({ k, label, href, src }, i) => {
            const Mock = MOCKS[k];
            return (
              <li key={k} className="ta-tile" data-reveal style={{ '--d': `${i * 70}ms` }}>
                <div className="ta-vis tm-box"><Mock /></div>
                <h3 className="ta-t">{label}</h3>
                <a className="ta-src" href={href}>
                  {`בכתב ${src}`}<span className="l5-sr">{`: ${label}`}</span><ArrowUpLeft size={13} strokeWidth={2.4} aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>

        <Quotes />
      </div>
    </section>
  );
}
