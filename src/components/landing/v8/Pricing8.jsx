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
import { BillingToggle8 } from './pricing/BillingToggle8';
import { PriceNumber } from './pricing/PriceRoll8';
import './pricing8.css';
import './pricing/pricing-motion.css';

const TRUST = [
  { I: MessageCircle, t: 'תמיכה בעברית, בוואטסאפ' },
  { I: MapPin, t: 'נבנה בישראל' },
  { I: ShieldCheck, t: 'מידע מוצפן ומגובה' },
];

function Price({ p, yearly }) {
  const save = (p.price - p.priceYearly) * 12;
  return (
    <>
      <p className="v8p-price">
        <PriceNumber value={yearly ? p.priceYearly : p.price} />
        <span>לחודש</span>
      </p>
      <p className="v8p-bill">
        <span className="v8p-bill-m" aria-hidden={yearly}>בחיוב חודשי</span>
        <span className="v8p-bill-y" aria-hidden={!yearly}>
          בחיוב שנתי
          <span className="v8p-save">חוסכים <bdi dir="ltr">₪{fmt(save)}</bdi> בשנה</span>
        </span>
      </p>
    </>
  );
}

/** One polite announcement per toggle with the final prices (never per animation frame, never on load). */
function announcement(yearly) {
  const list = PRICING_PLANS.map((p) => `${p.nameHe} ₪${fmt(yearly ? p.priceYearly : p.price)} לחודש`).join(', ');
  return `${yearly ? 'מחירים בחיוב שנתי' : 'מחירים בחיוב חודשי'}: ${list}`;
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
        {['כל היכולות', 'תמיכה בעברית, בוואטסאפ'].map((f) => (
          <tr key={f}>
            <th scope="row">{f}</th>
            {PRICING_PLANS.map((p) => <td key={p.key}><Check size={16} strokeWidth={2.6} aria-label="כלול" /></td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Pricing8({ title = 'מחיר פשוט. 14 יום עלינו.', tone = '', as: H = 'h2' }) {
  const [yearly, setYearlyState] = useState(false);
  const [said, setSaid] = useState('');
  const setYearly = (y) => {
    if (y === yearly) return;
    setYearlyState(y);
    setSaid(announcement(y));
  };
  const first = PRICING_PLANS[0];
  const PlanH = H === 'h1' ? 'h2' : 'h3'; // one level under the section title (no skipped level on /pricing, where it is the h1)
  return (
    <section id="pricing" className={`v8p v8pa${yearly ? ' is-yearly' : ''} ${tone}`} aria-labelledby="pricing-title">
      <div className="l5-wrap">
        <div className="v8-head is-center" data-reveal>
          <H id="pricing-title" className="v8-h2">{title}</H>
          <p className="v8-txt">כל החבילות כוללות הכל. ההבדל רק במספר המתחמים.</p>
        </div>
        <BillingToggle8 yearly={yearly} onChange={setYearly} />
        <p className="sr-only" aria-live="polite" aria-atomic="true">{said}</p>
        <ul className="v8p-plans" data-reveal>
          {PRICING_PLANS.map((p, i) => {
            const prev = PRICING_PLANS[i - 1];
            return (
              <li key={p.key} className={`v8p-plan${p.popular ? ' is-pop' : ''}`} aria-label={`${p.nameHe}, ${p.limit}`}>
                <div className="v8p-top">
                  <PlanH>{p.nameHe}</PlanH>
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
            <p className="v8p-diff-note">בכל חבילה מקבלים את כל היכולות. בוחרים לפי מספר המתחמים שלכם.</p>
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
