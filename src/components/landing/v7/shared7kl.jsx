/**
 * Landing v7 K / L shared parts: the people (real free-licence portraits, cool-graded webp in
 * public/landing-v7/kl), the bold pricing block, and the solid indigo final CTA with faces.
 * Every name next to a face is example product data (a guest in a booking), never a testimonial.
 */
import React, { useState } from 'react';
import { Check, MessageCircle, MapPin, ShieldCheck } from 'lucide-react';
import { PRICING_PLANS } from '@/config/pricing';
import { fmt } from '../v5/motion';
import { Mark } from '../v5/ui';
import { WHATSAPP_URL, CTA_NOTE } from '../v5/content';
import { SignupButton } from '../v5/LandingV5';

export const KL = '/landing-v7/kl';

/** Guests and hosts. `n` is the example name the product shows next to the face. */
export const FACES = {
  noa: { src: `${KL}/f-noa.webp`, n: 'נועה ל.' },
  maya: { src: `${KL}/f-maya.webp`, n: 'מאיה כ.' },
  tom: { src: `${KL}/f-tom.webp`, n: 'תום ש.' },
  shir: { src: `${KL}/f-shir.webp`, n: 'שירן ג.' },
  ben: { src: `${KL}/f-ben.webp`, n: 'בן ר.' },
  yossi: { src: `${KL}/f-yossi.webp`, n: 'יוסי ב.' },
  adam: { src: `${KL}/f-adam.webp`, n: 'אדם ח.' },
  eli: { src: `${KL}/f-eli.webp`, n: 'אלי מ.' },
};

export function Face({ f, size = 44, className = '', style, lazy = true }) {
  return (
    <img
      className={`klf ${className}`}
      src={f.src}
      alt=""
      width={size}
      height={size}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      style={{ '--s': `${size}px`, ...style }}
    />
  );
}

/* ---------------- pricing: the popular plan is a solid indigo card ---------------- */
const TRUST = [
  { I: MessageCircle, t: 'תמיכה בעברית, בוואטסאפ' },
  { I: MapPin, t: 'נבנתה בישראל' },
  { I: ShieldCheck, t: 'מידע מוצפן ומגובה' },
];

export function KlPricing({ title = 'מחיר פשוט. 14 יום עלינו.' }) {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="l5-sec klp" aria-labelledby="pricing-title">
      <div className="l5-wrap">
        <div className="kl-head is-center" data-reveal>
          <h2 id="pricing-title" className="kl-h2">{title}</h2>
          <p className="kl-txt">כל מסלול מתחיל בניסיון חינם עם כל המערכת. בוחרים לפי מספר הנכסים.</p>
        </div>
        <div className="klp-seg" role="group" aria-label="תקופת חיוב" data-reveal>
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>שנתי · חוסכים 20%</button>
        </div>
        <ul className="klp-plans" data-reveal>
          {PRICING_PLANS.map((p) => (
            <li key={p.key} className={`klp-plan${p.popular ? ' is-pop' : ''}`}>
              <div className="klp-top">
                <h3>{p.nameHe}</h3>
                {p.popular && <span className="klp-tag">הכי פופולרי</span>}
              </div>
              <p className="klp-desc">{p.desc}</p>
              <p className="klp-price">
                <b className="num" dir="ltr">₪{fmt(yearly ? p.priceYearly : p.price)}</b>
                <span>לחודש{yearly ? ', בחיוב שנתי' : ''}</span>
              </p>
              <SignupButton plan={p.key} className={`is-block${p.popular ? ' is-white' : ' is-quiet'}`} />
              <ul className="klp-feat">
                {p.features.map((f) => <li key={f}><Check size={16} strokeWidth={2.6} aria-hidden="true" />{f}</li>)}
              </ul>
            </li>
          ))}
        </ul>
        <ul className="klp-trust" data-reveal>
          {TRUST.map(({ I, t }) => <li key={t}><I size={18} strokeWidth={1.8} aria-hidden="true" />{t}</li>)}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- final CTA: a bold indigo block with faces around the line ---------------- */
const RING = [
  ['noa', 'is-1'], ['tom', 'is-2'], ['maya', 'is-3'], ['yossi', 'is-4'], ['shir', 'is-5'], ['adam', 'is-6'],
];

export function KlFinal({ title, sub = '14 ימי ניסיון חינם, בלי כרטיס אשראי. ההגדרה לוקחת 10 דקות.' }) {
  return (
    <section className="klx" aria-labelledby="final-title">
      <div className="l7-inset">
        <div className="klx-box" data-reveal>
          <div className="klx-faces" aria-hidden="true">
            {RING.map(([k, c], i) => <Face key={k} f={FACES[k]} size={72} className={`klx-face ${c}`} style={{ '--i': i }} />)}
          </div>
          <h2 id="final-title" className="klx-h">{title}</h2>
          <p className="klx-sub">{sub}</p>
          <div className="klx-cta">
            <SignupButton className="is-lg is-white" />
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="klx-link"><Mark ch="whatsapp" size={18} />שאלה? כתבו לנו</a>
          </div>
          <p className="klx-note"><Check size={14} strokeWidth={2.6} aria-hidden="true" />{CTA_NOTE} · ביטול בכל עת</p>
        </div>
      </div>
    </section>
  );
}
