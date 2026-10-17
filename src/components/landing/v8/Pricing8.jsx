/**
 * Landing pricing, version A (18.10.2026): three cards in plan order 1 → 2 → 3 on every screen size,
 * the recommended plan marked by a badge (never moved first). Each card says who it is for, how many
 * complexes it covers and what is included; plans 2 and 3 show only what they add on top of the
 * previous plan, with the full list one tap away. Under the cards: a "מה ההבדל בין החבילות"
 * accordion with a compact comparison table (fits 320px, no horizontal scroll), then trial and
 * cancellation lines. Copy lives in src/config/pricing.js.
 */
import React, { useState } from 'react';
import { Check, ChevronDown, MessageCircle, MapPin, ShieldCheck } from 'lucide-react';
import { PRICING_PLANS, INCLUDED_FEATURES, TRIAL_LINE, CANCEL_LINE } from '@/config/pricing';
import { fmt } from '../v5/motion';
import { SignupButton } from '../v5/LandingV5';
import './pricing8.css';

const TRUST = [
  { I: MessageCircle, t: 'תמיכה בעברית, בוואטסאפ' },
  { I: MapPin, t: 'נבנתה בישראל' },
  { I: ShieldCheck, t: 'מידע מוצפן ומגובה' },
];

function Price({ p, yearly }) {
  return (
    <p className="v8p-price">
      <b className="num" dir="ltr">₪{fmt(yearly ? p.priceYearly : p.price)}</b>
      <span>לחודש{yearly ? ', בחיוב שנתי' : ''}</span>
    </p>
  );
}

function FeatList({ items }) {
  return (
    <ul className="v8p-feat">
      {items.map((f) => <li key={f}><Check size={16} strokeWidth={2.6} aria-hidden="true" /><span>{f}</span></li>)}
    </ul>
  );
}

export function CompareTable() {
  return (
    <table className="v8p-table">
      <caption className="sr-only">השוואה בין החבילות</caption>
      <thead>
        <tr>
          <th scope="col"><span className="sr-only">מה</span></th>
          {PRICING_PLANS.map((p) => (
            <th scope="col" key={p.key} className={p.popular ? 'is-pop' : ''}>
              {p.nameHe}
              {p.popular && <span className="v8p-mini">מומלץ</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr className="is-key">
          <th scope="row">מתחמים</th>
          <td>1</td><td>עד 5</td><td>ללא הגבלה</td>
        </tr>
        <tr>
          <th scope="row">מחיר לחודש</th>
          {PRICING_PLANS.map((p) => <td key={p.key}><span className="num" dir="ltr">₪{fmt(p.price)}</span></td>)}
        </tr>
        <tr>
          <th scope="row">בחיוב שנתי, לחודש</th>
          {PRICING_PLANS.map((p) => <td key={p.key}><span className="num" dir="ltr">₪{fmt(p.priceYearly)}</span></td>)}
        </tr>
        <tr>
          <th scope="row">14 יום ניסיון חינם</th>
          {PRICING_PLANS.map((p) => <td key={p.key}><Check size={16} strokeWidth={2.6} aria-label="כלול" /></td>)}
        </tr>
        {['כל יכולות המערכת', 'תמיכה בעברית, בוואטסאפ'].map((f) => (
          <tr key={f}>
            <th scope="row">{f}</th>
            {PRICING_PLANS.map((p) => <td key={p.key}><Check size={16} strokeWidth={2.6} aria-label="כלול" /></td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Pricing8({ title = 'מחיר פשוט. 14 יום עלינו.', tone = '' }) {
  const [yearly, setYearly] = useState(false);
  const first = PRICING_PLANS[0];
  return (
    <section id="pricing" className={`v8p v8pa ${tone}`} aria-labelledby="pricing-title">
      <div className="l5-wrap">
        <div className="v8-head is-center" data-reveal>
          <h2 id="pricing-title" className="v8-h2">{title}</h2>
          <p className="v8-txt">כל החבילות כוללות את כל המערכת. ההבדל הוא רק במספר המתחמים.</p>
        </div>
        <div className="v8p-seg" role="group" aria-label="תקופת חיוב" data-reveal>
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>שנתי · חוסכים 20%</button>
        </div>
        <ul className="v8p-plans" data-reveal>
          {PRICING_PLANS.map((p, i) => {
            const prev = PRICING_PLANS[i - 1];
            return (
              <li key={p.key} className={`v8p-plan${p.popular ? ' is-pop' : ''}`} aria-label={`${p.nameHe}, ${p.limit}`}>
                <div className="v8p-top">
                  <h3>{p.nameHe}</h3>
                  {p.popular && <span className="v8p-tag">מומלץ</span>}
                </div>
                <p className="v8p-limit">{p.limit}</p>
                <p className="v8p-desc">{p.desc}</p>
                <Price p={p} yearly={yearly} />
                <SignupButton plan={p.key} className={`is-block${p.popular ? ' is-white' : ' is-quiet'}`} />
                {i === 0 ? (
                  <>
                    <p className="v8p-lead">מה כלול:</p>
                    <FeatList items={INCLUDED_FEATURES} />
                  </>
                ) : (
                  <>
                    <p className="v8p-lead">הכל בחבילת {prev.nameHe}, ועוד:</p>
                    <FeatList items={p.adds} />
                    <details className="v8p-more">
                      <summary>
                        <span>כל מה שכלול בחבילת {first.nameHe}</span>
                        <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
                      </summary>
                      <FeatList items={INCLUDED_FEATURES} />
                    </details>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <details className="v8p-diff" data-reveal>
          <summary>
            <span>מה ההבדל בין החבילות?</span>
            <ChevronDown size={20} strokeWidth={2} aria-hidden="true" />
          </summary>
          <div className="v8p-diff-body">
            <p className="v8p-diff-note">אותה מערכת בדיוק בכל חבילה, עם כל היכולות שברשימה. בוחרים לפי מספר המתחמים שאתם מנהלים.</p>
            <CompareTable />
          </div>
        </details>

        <div className="v8p-terms" data-reveal>
          <p><Check size={16} strokeWidth={2.6} aria-hidden="true" />{TRIAL_LINE}</p>
          <p><Check size={16} strokeWidth={2.6} aria-hidden="true" />{CANCEL_LINE}</p>
        </div>

        <ul className="v8p-trust" data-reveal>
          {TRUST.map(({ I, t }) => <li key={t}><I size={18} strokeWidth={1.8} aria-hidden="true" />{t}</li>)}
        </ul>
      </div>
    </section>
  );
}
