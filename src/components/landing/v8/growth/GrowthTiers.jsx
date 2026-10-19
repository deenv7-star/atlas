/**
 * Growth tier cards (shared by growth section A and B): base plan + the two growth layers,
 * the growth tier highlighted, monthly / yearly switch, founding-member line and launch package.
 * Content: src/config/growth.js. Isolated from Pricing8 (the pricing-toggle work lives there).
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowLeft, Lock } from 'lucide-react';
import { GROWTH_TIERS, FOUNDING, LAUNCH, SLOTS, GROWTH_LINKS } from '@/config/growth';
import './growth-tiers.css';

const nis = (n) => `₪${n.toLocaleString('en-US')}`;

function TierCta({ cta, pop }) {
  const cls = `gt-btn${pop ? ' is-pop' : ''}`;
  const inner = <><span>{cta.label}</span><ArrowLeft size={18} strokeWidth={2} aria-hidden="true" /></>;
  if (cta.kind === 'signup') return <Link to="/register" className={cls}>{inner}</Link>;
  return <a href={GROWTH_LINKS[cta.kind]} target="_blank" rel="noopener noreferrer" className={cls}>{inner}<span className="l5-sr"> (וואטסאפ, נפתח בחלון חדש)</span></a>;
}

export default function GrowthTiers({ tone = 'light', headingLevel = 3 }) {
  const [yearly, setYearly] = useState(false);
  const H = `h${headingLevel}`;
  return (
    <div className={`gt is-${tone}`}>
      <div className="gt-seg" role="group" aria-label="תקופת חיוב">
        <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
        <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>שנתי · חוסכים 20%</button>
      </div>
      <ul className="gt-list">
        {GROWTH_TIERS.map((t) => (
          <li key={t.key} className={`gt-card${t.popular ? ' is-pop' : ''}`}>
            <div className="gt-top">
              <H className="gt-name">{t.name}</H>
              {t.popular && <span className="gt-tag">מומלץ</span>}
            </div>
            <p className="gt-for">{t.for}</p>
            <p className="gt-price">
              {t.from && <span className="gt-from">החל מ-</span>}
              <b className="num" dir="ltr">{nis(yearly ? t.priceYearly : t.price)}</b>
              <span>לחודש{yearly ? ', בחיוב שנתי' : ''}</span>
            </p>
            <TierCta cta={t.cta} pop={t.popular} />
            <p className="gt-lead">{t.lead}</p>
            <ul className="gt-items">
              {t.items.map((f) => <li key={f}><Check size={16} strokeWidth={2.6} aria-hidden="true" /><span>{f}</span></li>)}
            </ul>
            <p className="gt-note">{t.note}</p>
          </li>
        ))}
      </ul>
      <div className="gt-extra">
        <p className="gt-found">
          <Lock size={16} strokeWidth={2.2} aria-hidden="true" />
          <span>
            <b>{`מחיר מייסדים ל-${FOUNDING.cap} המתחמים הראשונים: `}<span className="num" dir="ltr">{nis(FOUNDING.monthly)}</span>{' לחודש בצמיחה,'}</b>
            {` נעול ל-${FOUNDING.lockMonths} חודשים. ${FOUNDING.deadlineLabel}, או עד שה-${FOUNDING.cap} מתמלאים.`}
            {FOUNDING.remaining != null && ` נשארו ${FOUNDING.remaining} מתוך ${FOUNDING.cap}.`}
          </span>
        </p>
        <p className="gt-launch">
          <span><b>{LAUNCH.name}:</b>{` ${LAUNCH.items.join(', ')}. חד-פעמי `}<span className="num" dir="ltr">{nis(LAUNCH.price)}</span>{', למייסדים '}<span className="num" dir="ltr">{nis(LAUNCH.founding)}</span>{`. ${SLOTS.launchPerMonth} מקומות בחודש.`}</span>
          <a href={GROWTH_LINKS.launch} target="_blank" rel="noopener noreferrer">פרטים בוואטסאפ<span className="l5-sr"> (נפתח בחלון חדש)</span></a>
        </p>
      </div>
    </div>
  );
}
