/**
 * Landing pricing, version B (18.10.2026): "answer one question". The owner picks how many
 * complexes they manage (מתחם אחד / 2 עד 5 / 6 ומעלה, always in that order) and sees exactly one
 * plan: who it is for, the price, one button and everything that is included. Under it, one
 * always-visible comparison table of all three plans (columns 1 → 2 → 3, the chosen one
 * highlighted, the recommended one badged), then trial and cancellation lines.
 * Copy lives in src/config/pricing.js.
 */
import React, { useState } from 'react';
import { Check, MessageCircle, MapPin, ShieldCheck } from 'lucide-react';
import { PRICING_PLANS, INCLUDED_FEATURES, TRIAL_LINE, CANCEL_LINE } from '@/config/pricing';
import { fmt } from '../v5/motion';
import { SignupButton } from '../v5/LandingV5';
import './pricing8.css';

const TRUST = [
  { I: MessageCircle, t: 'תמיכה בעברית, בוואטסאפ' },
  { I: MapPin, t: 'נבנתה בישראל' },
  { I: ShieldCheck, t: 'מידע מוצפן ומגובה' },
];

/** The answer to "כמה מתחמים?" for each plan, same order as PRICING_PLANS. */
const COUNT_LABEL = { starter: 'מתחם אחד', pro: '2 עד 5', business: '6 ומעלה' };

function CompareTable({ selected }) {
  const col = (p) => [p.popular ? 'is-pop' : '', p.key === selected ? 'is-sel' : ''].filter(Boolean).join(' ');
  return (
    <table className="v8p-table">
      <caption className="sr-only">השוואה בין החבילות</caption>
      <thead>
        <tr>
          <th scope="col"><span className="sr-only">מה</span></th>
          {PRICING_PLANS.map((p) => (
            <th scope="col" key={p.key} className={col(p)}>
              {p.nameHe}
              {p.popular && <span className="v8p-mini">מומלץ</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr className="is-key">
          <th scope="row">מתחמים</th>
          {PRICING_PLANS.map((p) => <td key={p.key} className={col(p)}>{p.complexes === 1 ? '1' : p.complexes ? `עד ${p.complexes}` : 'ללא הגבלה'}</td>)}
        </tr>
        <tr>
          <th scope="row">מחיר לחודש</th>
          {PRICING_PLANS.map((p) => <td key={p.key} className={col(p)}><span className="num" dir="ltr">₪{fmt(p.price)}</span></td>)}
        </tr>
        <tr>
          <th scope="row">בחיוב שנתי, לחודש</th>
          {PRICING_PLANS.map((p) => <td key={p.key} className={col(p)}><span className="num" dir="ltr">₪{fmt(p.priceYearly)}</span></td>)}
        </tr>
        {['14 יום ניסיון חינם', 'כל יכולות המערכת', 'תמיכה בעברית, בוואטסאפ'].map((f) => (
          <tr key={f}>
            <th scope="row">{f}</th>
            {PRICING_PLANS.map((p) => <td key={p.key} className={col(p)}><Check size={16} strokeWidth={2.6} aria-label="כלול" /></td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Pricing8({ title = 'מחיר פשוט. 14 יום עלינו.', tone = '' }) {
  const [key, setKey] = useState(PRICING_PLANS[0].key);
  const [yearly, setYearly] = useState(false);
  const plan = PRICING_PLANS.find((p) => p.key === key) || PRICING_PLANS[0];
  return (
    <section id="pricing" className={`v8p v8pb ${tone}`} aria-labelledby="pricing-title">
      <div className="l5-wrap">
        <div className="v8-head is-center" data-reveal>
          <h2 id="pricing-title" className="v8-h2">{title}</h2>
          <p className="v8-txt">אותה מערכת בכל חבילה. המחיר תלוי רק במספר המתחמים.</p>
        </div>

        <div className="v8pb-ask" data-reveal>
          <p id="v8pb-q" className="v8pb-q">כמה מתחמים אתם מנהלים?</p>
          <div className="v8pb-seg" role="radiogroup" aria-labelledby="v8pb-q">
            {PRICING_PLANS.map((p) => (
              <button key={p.key} type="button" role="radio" aria-checked={p.key === key} onClick={() => setKey(p.key)}>
                {COUNT_LABEL[p.key]}
              </button>
            ))}
          </div>
        </div>

        <div data-reveal>{/* reveal hook adds a class here; keep it off the element whose className changes */}
        <article className={`v8pb-card${plan.popular ? ' is-pop' : ''}`} aria-live="polite">
          <div key={plan.key} className="v8pb-in">
            <div className="v8pb-main">
              <div className="v8p-top">
                <h3>חבילת {plan.nameHe}</h3>
                {plan.popular && <span className="v8p-tag">מומלץ</span>}
              </div>
              <p className="v8p-limit">{plan.limit}</p>
              <p className="v8p-desc">{plan.desc}</p>
              <p className="v8p-price">
                <b className="num" dir="ltr">₪{fmt(yearly ? plan.priceYearly : plan.price)}</b>
                <span>לחודש{yearly ? ', בחיוב שנתי' : ''}</span>
              </p>
              <div className="v8pb-bill" role="group" aria-label="תקופת חיוב">
                <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
                <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>שנתי · חוסכים 20%</button>
              </div>
              <SignupButton plan={plan.key} className="is-block is-lg" />
            </div>
            <div className="v8pb-list">
              <p className="v8p-lead">מה כלול:</p>
              <ul className="v8p-feat">
                {[plan.limit, ...INCLUDED_FEATURES].map((f, i) => (
                  <li key={f} className={i === 0 ? 'is-key' : ''}><Check size={16} strokeWidth={2.6} aria-hidden="true" /><span>{f}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </article>
        </div>

        <div className="v8pb-compare" data-reveal>
          <h3 className="v8pb-h3">מה ההבדל בין החבילות</h3>
          <p className="v8p-diff-note">רק מספר המתחמים. כל השאר זהה.</p>
          <CompareTable selected={key} />
        </div>

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
