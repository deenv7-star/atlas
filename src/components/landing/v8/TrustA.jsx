/**
 * Landing trust section, version A "שש התחייבויות, כולן בכתב" (editorial).
 * Six promises that are also written in the terms / policies (each links to where it is written),
 * then an honest "does today / not yet" card. No founder letter, no personal framing.
 * A real customer quote shows ONLY when src/config/testimonials.js holds one (empty today).
 * No reviews, ratings, customer counts or logos: ATLAS has no paying customers yet.
 */
import React from 'react';
import { Check, Minus, ArrowUpLeft } from 'lucide-react';
import { visibleTestimonials } from '@/config/testimonials';
import { PROMISES, DOES, NOT_YET } from './trust-content';
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
          <p className="ta-eyebrow">שקיפות</p>
          <h2 id="trust-title" className="v8-h2">שש התחייבויות. <span className="is-ind">כולן בכתב.</span></h2>
          <p className="v8-txt">כל שורה כאן כתובה גם בתנאי השימוש ובמדיניות שלנו, עם קישור למקום המדויק.</p>
        </div>

        <ul className="ta-promises">
          {PROMISES.map(({ I, t, d, href, src, ext }, i) => (
            <li key={t} className="ta-pr" data-reveal style={{ '--d': `${(i % 3) * 60 + Math.floor(i / 3) * 40}ms` }}>
              <span className="ta-pr-i"><I size={20} strokeWidth={1.9} aria-hidden="true" /></span>
              <h3 className="ta-pr-t">{t}</h3>
              <p className="ta-pr-d">{d}</p>
              <a className="ta-pr-src" href={href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {ext ? 'לכתוב עכשיו' : `כתוב ב${src}`}<ArrowUpLeft size={14} strokeWidth={2.2} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>

        <Quotes />

        <div className="ta-honest" data-reveal>
          <div className="ta-col">
            <h3 className="ta-col-h">מה ATLAS עושה היום</h3>
            <ul>{DOES.map((t) => <li key={t}><Check size={16} strokeWidth={2.8} aria-hidden="true" className="is-yes" />{t}</li>)}</ul>
          </div>
          <div className="ta-col">
            <h3 className="ta-col-h">ומה עוד לא, בכנות</h3>
            <ul>{NOT_YET.map((t) => <li key={t}><Minus size={16} strokeWidth={2.8} aria-hidden="true" className="is-no" />{t}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}
