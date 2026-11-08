/**
 * /early: pre-launch waitlist (teaser period, IG bio link). Version A "הקסם בפעולה" only (Deen, 08.11.2026 13:27:
 * "תעלה עם a בינתיים"). Versions B and C and the ?v= switch were removed; they live in git history (commit 49d15fee).
 * Hero + body in src/features/early/V4.jsx (CSS keyframes, transform/opacity only, static under reduced motion).
 * Offer decided for Deen (08.11.2026): first 50 get personal setup + founding price (annual-plan monthly price on
 * monthly billing, locked while subscribed) + the regular 14-day free trial. No fake counter, no queue position:
 * spots-left shows only when the DB returns it (see src/features/early/submit.js). No founder name on the page.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { TRIAL_DAYS } from '@/config/pricing';
import { FOUNDING_SPOTS, joinWaitlist, fetchSpotsLeft } from '@/features/early/submit';
import { HeroA4, RealScreens, Offer4 } from '@/features/early/V4';
import '@/features/early/early.css';
import '@/features/early/v4.css';

const UNIT_OPTIONS = [
  { v: '1', label: 'יחידה אחת' },
  { v: '2-3', label: '2 עד 3' },
  { v: '4-6', label: '4 עד 6' },
  { v: '7+', label: '7 ומעלה' },
];
const SITE = 'https://atlas-il.com/early';

const VARIANT = 'a';

function useMeta() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'atlas · 50 המקומות הראשונים לבעלי צימרים';
    let robots = document.querySelector('meta[name="robots"]');
    const prevRobots = robots?.getAttribute('content');
    if (!robots) { robots = document.createElement('meta'); robots.setAttribute('name', 'robots'); document.head.appendChild(robots); }
    robots.setAttribute('content', 'noindex,follow');
    document.documentElement.classList.add('ew-html');
    return () => {
      document.title = prev;
      if (prevRobots) robots.setAttribute('content', prevRobots);
      document.documentElement.classList.remove('ew-html');
    };
  }, []);
}

/** Fade-up on enter; off for reduced motion (CSS handles that). */
function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const els = root.querySelectorAll('[data-rv]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
}

function scrollToForm() {
  const el = document.getElementById('join');
  if (!el) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  setTimeout(() => document.getElementById('ew-name')?.focus({ preventScroll: true }), reduce ? 0 : 600);
}

function ShareBlock({ refCode }) {
  const [copied, setCopied] = useState(false);
  const link = `${SITE}?ref=${refCode}`;
  const text = `מצאתי משהו לבעלי צימרים: atlas. 50 המקומות הראשונים מקבלים הקמה אישית ומחיר מייסדים נעול. שווה לשמור מקום לפני שנגמר:\n${link}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { setCopied(false); }
  };
  return (
    <div className="ew-share">
      <h3>מכירים עוד מארח?</h3>
      <p>שתפו אותו לפני שהמקומות נגמרים.</p>
      <div className="ew-share-btns">
        <a className="ew-btn-wa" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">שליחה בוואטסאפ</a>
        <button type="button" className="ew-btn-ghost" onClick={copy}>{copied ? 'הקישור הועתק' : 'העתקת הקישור'}</button>
      </div>
      <p className="ew-hint">נפתח בוואטסאפ שלכם. אתם בוחרים למי לשלוח.</p>
      <p className="ew-vh" aria-live="polite">{copied ? 'הקישור הועתק' : ''}</p>
    </div>
  );
}

function JoinForm({ onDone, done }) {
  const [f, setF] = useState({ name: '', phone: '', units: '', complex: '', consent: false, website: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr(''); setBusy(true);
    const r = await joinWaitlist({ ...f, variant: VARIANT }).catch(() => ({ ok: false, error: 'לא הצלחנו לשמור. בדקו את החיבור ונסו שוב.' }));
    setBusy(false);
    if (r.ok) onDone(r); else setErr(r.error || 'לא הצלחנו לשמור. נסו שוב בעוד רגע.');
  };

  if (done) {
    return (
      <div className="ew-done" role="status" tabIndex={-1} id="ew-done">
        <div className="ew-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <h2 className="ew-h2 dark">המקום שלכם שמור.</h2>
        <p className="ew-sub">נחזור אליכם בוואטסאפ לפני ההשקה, כדי לקבוע את ההקמה האישית.</p>
        {done.demo && <p className="ew-demo">מצב הדגמה: שום דבר לא נשלח.</p>}
        <ShareBlock refCode={done.refCode} />
      </div>
    );
  }

  return (
    <form className="ew-form" onSubmit={submit} noValidate>
      <h2 className="ew-h2 dark" id="ew-form-h">שמרו לי מקום</h2>
      <p className="ew-sub">30 שניות. בלי תשלום עכשיו.</p>
      <div className="ew-field">
        <label htmlFor="ew-name">שם</label>
        <input id="ew-name" name="name" autoComplete="name" value={f.name} onChange={set('name')} required maxLength={120} />
      </div>
      <div className="ew-field">
        <label htmlFor="ew-phone">טלפון נייד</label>
        <input id="ew-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="050-1234567" value={f.phone} onChange={set('phone')} required maxLength={20} />
      </div>
      <fieldset className="ew-field ew-units">
        <legend>כמה יחידות יש לכם?</legend>
        <div className="ew-chips">
          {UNIT_OPTIONS.map((o) => (
            <label key={o.v} className={`ew-chip ${f.units === o.v ? 'on' : ''}`}>
              <input type="radio" name="units" value={o.v} checked={f.units === o.v} onChange={set('units')} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="ew-field">
        <label htmlFor="ew-complex">שם המתחם ואזור <small>(לא חובה)</small></label>
        <input id="ew-complex" name="complex" autoComplete="organization" placeholder="למשל: צימרי הגפן, גליל עליון" value={f.complex} onChange={set('complex')} maxLength={200} />
      </div>
      <div className="ew-hp" aria-hidden="true">
        <label htmlFor="ew-website">אתר</label>
        <input id="ew-website" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} />
      </div>
      <label className="ew-consent">
        <input type="checkbox" checked={f.consent} onChange={set('consent')} required />
        <span>מאשרים לחזור אלינו בטלפון ובוואטסאפ לגבי <span dir="ltr">atlas</span>. <a href="/privacy" target="_blank" rel="noopener">מדיניות הפרטיות</a></span>
      </label>
      {err && <p className="ew-err" role="alert">{err}</p>}
      <button type="submit" className="ew-cta wide" disabled={busy} aria-busy={busy}>{busy ? 'שומרים…' : 'שמרו לי מקום'}</button>
      <p className="ew-hint">{FOUNDING_SPOTS} מקומות בלבד. אחרי זה, המחיר הרגיל.</p>
    </form>
  );
}

function Faq() {
  const qs = [
    { q: 'מתי ההשקה?', a: 'בקרוב. מי שברשימה שומע ראשון, ואנחנו חוזרים אליו אישית.' },
    { q: 'צריך להבין במחשבים?', a: 'לא. בהקמה האישית אנחנו מגדירים הכל, ואתם רק מאשרים.' },
    { q: 'אני כבר ב-Booking וב-Airbnb. מה משתנה?', a: 'שום דבר אצלם. atlas מושך משם את התאריכים התפוסים ללוח אחד.' },
    { q: 'מה אם זה לא מתאים לי?', a: `${TRIAL_DAYS} יום חינם, בלי כרטיס אשראי. לא מתאים? לא ממשיכים.` },
  ];
  return (
    <section className="ew-faq" aria-labelledby="ew-faq-h">
      <h2 id="ew-faq-h" className="ew-h2 dark" data-rv>שאלות קצרות</h2>
      {qs.map((x) => (
        <details key={x.q} className="ew-q" data-rv>
          <summary>{x.q}</summary>
          <p>{x.a}</p>
        </details>
      ))}
    </section>
  );
}

export default function Early() {
  const rootRef = useRef(null);
  const joinRef = useRef(null);
  const [spotsLeft, setSpotsLeft] = useState(null);
  const [done, setDone] = useState(null);
  const [joinVisible, setJoinVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [offerVisible, setOfferVisible] = useState(false);
  useMeta();
  useReveal(rootRef);

  useEffect(() => { fetchSpotsLeft().then((n) => { if (typeof n === 'number') setSpotsLeft(n); }); }, []);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const join = joinRef.current; const hero = rootRef.current?.querySelector('.cx-cta');
    const offer = rootRef.current?.querySelector('.v4-offer');
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.target === join) setJoinVisible(e.isIntersecting);
      else setHeroVisible(e.isIntersecting);
    }), { threshold: 0 });
    // The offer has its own CTA and the pill would cover its price rows: hide the pill once the offer fills the
    // upper 70% of the screen (not the moment its top edge peeks in, or the pill would almost never show).
    const io2 = new IntersectionObserver((es) => es.forEach((e) => setOfferVisible(e.isIntersecting)), { threshold: 0, rootMargin: '0px 0px -30% 0px' });
    if (join) io.observe(join);
    if (hero) io.observe(hero);
    if (offer) io2.observe(offer);
    return () => { io.disconnect(); io2.disconnect(); };
  }, []);
  useEffect(() => { if (done) setTimeout(() => document.getElementById('ew-done')?.focus(), 50); }, [done]);

  const showSticky = !done && !joinVisible && !heroVisible && !offerVisible;
  const go = useCallback(() => scrollToForm(), []);

  return (
    <div className="ew v4 v4-a" ref={rootRef} dir="rtl" lang="he">
      <a href="#join" className="ew-skip">דלגו לטופס</a>
      <HeroA4 onCta={go} />
      <main>
        <RealScreens />
        <Offer4 onCta={go} />
        <section className="ew-join" id="join" ref={joinRef} aria-labelledby="ew-form-h">
          <JoinForm done={done} onDone={setDone} />
        </section>
        <Faq />
      </main>
      <footer className="ew-foot">
        <img src="/atlas-logo-navy.svg" alt="atlas" width="72" height="23" />
        <p>אתם מארחים. <span dir="ltr">atlas</span> מסדר.</p>
        <nav aria-label="קישורים"><a href="/">לאתר</a><a href="/privacy">פרטיות</a><a href="/terms">תנאי שימוש</a><a href="/accessibility">נגישות</a></nav>
      </footer>
      <div className={`ew-sticky ${showSticky ? 'show' : ''}`} aria-hidden={!showSticky}>
        <span className="ew-sticky-txt">{typeof spotsLeft === 'number' ? `נשארו ${spotsLeft} מקומות` : '50 מקומות בלבד'}</span>
        <button type="button" className="ew-cta sm" onClick={scrollToForm} tabIndex={showSticky ? 0 : -1}>שמרו לי מקום</button>
      </div>
    </div>
  );
}
