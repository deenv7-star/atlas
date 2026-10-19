/**
 * Landing growth section, version B "showcase" (19.10.2026, proposal).
 * A playable mini demo on an indigo stage: photos -> generated booking page -> reel preview ->
 * a lead arriving on WhatsApp. CSS transitions/animations only (transform + opacity), autoplay
 * only while in view and never with prefers-reduced-motion; a tap on a step stops autoplay.
 * Real unit photos + a real guest photo (Pexels); everything inside the frame is labelled a demo.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, LayoutTemplate, Clapperboard, MessageCircle, Check, CalendarDays } from 'lucide-react';
import { GROWTH_NAME, GROWTH_STATUS, FOUNDING, GROWTH_LINKS } from '@/config/growth';
import GrowthTiers from './GrowthTiers';
import './growth-b.css';

const STEPS = [
  { k: 'photos', I: ImagePlus, t: 'מעלים תמונות', s: '6 עד 10 תמונות מהטלפון' },
  { k: 'page', I: LayoutTemplate, t: 'דף הזמנה מוכן', s: 'עם התאריכים הפנויים מהלוח' },
  { k: 'reel', I: Clapperboard, t: 'סרטון לאינסטגרם', s: '15 שניות, אנכי, בעברית' },
  { k: 'lead', I: MessageCircle, t: 'פנייה בוואטסאפ', s: 'ונשמרת בלידים' },
];
const PH = ['/demo/units/unit-2.webp', '/demo/units/unit-6.webp', '/demo/units/unit-5.webp'];

function usePlayer(ref) {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setAuto(false);
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  useEffect(() => {
    if (!auto || !seen) return undefined;
    const id = setTimeout(() => setI((n) => (n + 1) % STEPS.length), 3400);
    return () => clearTimeout(id);
  }, [auto, seen, i]);
  return { i, go: (n) => { setAuto(false); setI(n); }, seen };
}

function Scene({ k, on }) {
  const cls = `gb-scene is-${k}${on ? ' is-on' : ''}`;
  if (k === 'photos') return (
    <div className={cls} aria-hidden={!on}>
      <div className="gb-drop">
        {PH.map((src, n) => <img key={src} src={src} alt="" width="160" height="200" loading="lazy" decoding="async" style={{ '--n': n }} />)}
      </div>
      <p className="gb-bar"><span className="gb-bar-fill" /><b>3 תמונות הועלו</b></p>
    </div>
  );
  if (k === 'page') return (
    <div className={cls} aria-hidden={!on}>
      <div className="gb-page">
        <img src={PH[0]} alt="" width="320" height="180" loading="lazy" decoding="async" />
        <div className="gb-page-b">
          <b>בקתות בגליל</b>
          <span>בקתת עץ, בריכת אבן, נוף להרים</span>
          <p className="gb-dates"><CalendarDays size={14} strokeWidth={2.2} aria-hidden="true" /><i>פנוי</i><i>פנוי</i><i className="is-busy">תפוס</i><i>פנוי</i></p>
          <span className="gb-page-btn"><MessageCircle size={14} strokeWidth={2.2} aria-hidden="true" />בדיקת תאריכים בוואטסאפ</span>
        </div>
      </div>
    </div>
  );
  if (k === 'reel') return (
    <div className={cls} aria-hidden={!on}>
      <div className="gb-reel">
        <div className="gb-reel-bars"><i /><i /><i /></div>
        {PH.map((src, n) => <img key={src} src={src} alt="" width="240" height="420" loading="lazy" decoding="async" style={{ '--n': n }} />)}
        <p className="gb-reel-cap"><b>סופ״ש בגליל</b><span>ג׳קוזי מול הנוף · פנוי בחנוכה</span></p>
      </div>
    </div>
  );
  return (
    <div className={cls} aria-hidden={!on}>
      <div className="gb-wa">
        <p className="gb-wa-in">
          <img src="/demo/growth/guest-1.webp" alt="" width="36" height="36" loading="lazy" decoding="async" />
          <span>היי, ראיתי את הסרטון. פנוי בחנוכה ל-2 לילות?</span>
        </p>
        <p className="gb-wa-out"><span>היי, יש לנו פנוי. שולחים לכם את הפרטים</span></p>
        <p className="gb-lead"><Check size={16} strokeWidth={2.6} aria-hidden="true" /><span><b>ליד חדש נשמר</b><small>מקור: אינסטגרם · חנוכה · 2 לילות</small></span></p>
      </div>
    </div>
  );
}

export default function GrowthB() {
  const stage = useRef(null);
  const { i, go, seen } = usePlayer(stage);
  return (
    <section id="growth" className="gb" aria-labelledby="growth-title">
      <div className="l5-wrap">
        <div className="gb-head">
          <p className="gb-badge"><span aria-hidden="true" />{`חדש: ${GROWTH_NAME}`}</p>
          <h2 id="growth-title" className="v8-h2">מהתמונות <span className="is-ind">להזמנה.</span></h2>
          <p className="v8-txt">מעלים תמונות. אטלס בונה דף הזמנה, סרטון ומודעה, וכל פנייה נוחתת בוואטסאפ.</p>
        </div>
      </div>
      <div className="l7-inset">
        <div ref={stage} className={`gb-stage${seen ? ' is-seen' : ''}`}>
          <ol className="gb-steps" aria-label="איך זה עובד, בהדגמה">
            {STEPS.map(({ k, I, t, s }, n) => (
              <li key={k}>
                <button type="button" className={`gb-step${n === i ? ' is-on' : ''}`} aria-current={n === i ? 'step' : undefined} onClick={() => go(n)}>
                  <span className="gb-step-i"><I size={18} strokeWidth={2} aria-hidden="true" /></span>
                  <span className="gb-step-t"><b>{t}</b><small>{s}</small></span>
                  <span className="gb-step-p" aria-hidden="true"><i key={n === i ? `on-${i}` : 'off'} /></span>
                </button>
              </li>
            ))}
          </ol>
          <div className="gb-frame" role="img" aria-label={`הדגמה: ${STEPS[i].t}`}>
            <div className="gb-phone">
              {STEPS.map(({ k }, n) => <Scene key={k} k={k} on={n === i} />)}
            </div>
            <span className="gb-demo">הדגמה</span>
          </div>
        </div>
      </div>
      <div className="l5-wrap">
        <div className="gb-tiers"><GrowthTiers /></div>
        <p className="gb-honest">
          {`כבר בנוי: ${GROWTH_STATUS.ready.join(' ו')}. ${GROWTH_STATUS.soon.join(', ')}: נפתחים קודם לחברים המייסדים. `}
          <a href={GROWTH_LINKS.founding} target="_blank" rel="noopener noreferrer">{`שמירת מקום, ${FOUNDING.deadlineLabel}`}<span className="l5-sr"> (וואטסאפ, נפתח בחלון חדש)</span></a>
        </p>
      </div>
    </section>
  );
}
