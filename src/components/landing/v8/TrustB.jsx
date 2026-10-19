/**
 * Landing trust section, version B "בלי הפתעות" (bold): a solid indigo band with a bento of four
 * large visual tiles (huge "14", WhatsApp cancel chat, export files, lock + facts), animated once on reveal.
 * Each tile has a 2-5 word label and links to where it is written.
 * A real customer quote shows ONLY when src/config/testimonials.js holds one (empty today).
 * No reviews, ratings, customer counts, logos or founder content.
 */
import React from 'react';
import { ArrowUpLeft } from 'lucide-react';
import { visibleTestimonials } from '@/config/testimonials';
import { TRUST } from './trust-content';
import { MOCKS } from './TrustMocks';
import './trust-mocks.css';
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
          <div className="tb-head" data-reveal>
            <h2 id="trust-title" className="tb-h">בלי הפתעות. <span>הכל כתוב בתקנון.</span></h2>
          </div>

          <ul className="tb-grid">
            {TRUST.map(({ k, label, href, src }, i) => {
              const Mock = MOCKS[k];
              return (
                <li key={k} className={`tb-tile is-${k}`} data-reveal style={{ '--d': `${i * 70}ms` }}>
                  <div className="tb-vis tm-box"><Mock /></div>
                  <div className="tb-foot">
                    <h3 className="tb-t">{label}</h3>
                    <a className="tb-src" href={href}>
                      {`בכתב ${src}`}<span className="l5-sr">{`: ${label}`}</span><ArrowUpLeft size={13} strokeWidth={2.4} aria-hidden="true" />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="l5-wrap"><Quotes /></div>
    </section>
  );
}
