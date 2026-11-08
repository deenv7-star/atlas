/**
 * /early: pre-launch waitlist (teaser period, IG bio link). Two versions: ?v=a (default) | ?v=b.
 *  v2 (08.11 feedback "הכאב לא מעניין… להמחיש את הבלאגן של המון פלטפורמות נכנסות לכלי אחד"):
 *  A "מגנט" : platform tiles (Booking, Airbnb, וואטסאפ, מחברת, אקסל…) magnetized on scroll into one lit phone.
 *  B "סערה" : a notification storm that collapses on scroll into bookings on one calendar.
 *  Heroes live in src/features/early/Chaos.jsx (scroll-scrubbed, transform/opacity only, static under reduced motion).
 * Offer decided for Deen (08.11.2026): first 50 get personal setup + founding price (annual-plan monthly price on
 * monthly billing, locked while subscribed) + the regular 14-day free trial. No fake counter: spots-left and
 * place-in-line show only when the DB returns them (see src/features/early/submit.js).
 * Screens are real app screens with sample data, labelled "נתוני דוגמה".
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PRICING_PLANS, TRIAL_DAYS } from '@/config/pricing';
import { FOUNDING_SPOTS, joinWaitlist, fetchSpotsLeft } from '@/features/early/submit';
import { HeroMagnet, HeroStorm } from '@/features/early/Chaos';
import { useRoll } from '@/features/early/spells';
import '@/features/early/early.css';
import '@/features/early/chaos.css';

const UI = '/landing-v8/ui/';
const fmt = (n) => `₪${n.toLocaleString('he-IL')}`;
const UNIT_OPTIONS = [
  { v: '1', label: 'יחידה אחת' },
  { v: '2-3', label: '2 עד 3' },
  { v: '4-6', label: '4 עד 6' },
  { v: '7+', label: '7 ומעלה' },
];
const SITE = 'https://atlas-il.com/early';

function useVariant() {
  return useMemo(() => {
    try { return new URLSearchParams(window.location.search).get('v') === 'b' ? 'b' : 'a'; } catch { return 'a'; }
  }, []);
}

function useMeta() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'atlas · רשימת המתנה · 50 מקומות ראשונים';
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

function Phone({ src, alt, className = '', eager = false }) {
  return (
    <figure className={`ew-phone ${className}`}>
      <div className="ew-phone-body">
        <img src={src} alt={alt} width="780" height="1688" loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : undefined} />
      </div>
    </figure>
  );
}

function scrollToForm() {
  const el = document.getElementById('join');
  if (!el) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  setTimeout(() => document.getElementById('ew-name')?.focus({ preventScroll: true }), reduce ? 0 : 600);
}

function SpotsPill({ spotsLeft, dark = true }) {
  return (
    <p className={`ew-spots ${dark ? '' : 'light'}`}>
      <span className="ew-dot" aria-hidden="true" />
      {typeof spotsLeft === 'number'
        ? <>נשארו <b>{spotsLeft}</b> מתוך {FOUNDING_SPOTS} מקומות</>
        : <><b>{FOUNDING_SPOTS}</b> מקומות בלבד במחיר מייסדים</>}
    </p>
  );
}

/* ---------------- sections ---------------- */

function Benefits() {
  const items = [
    { img: 'd-calendar.webp', alt: 'לוח שנה של atlas עם הזמנות מכמה ערוצים', h: 'כל ההזמנות. יומן אחד.', p: 'Booking, Airbnb וההזמנות שלכם על לוח אחד. תאריך תפוס נשאר תפוס.' },
    { img: 'd-thread.webp', alt: 'הודעה מוכנה לאורח באפליקציה', h: 'הודעה לאורח? מוכנה.', p: 'נוסח מוכן בעברית. לחיצה אחת, והוא נפתח בוואטסאפ שלכם.' },
    { img: 'd-paid.webp', alt: 'מסך תשלומים עם מקדמות ויתרות', h: 'מי שילם. מה פתוח.', p: 'כל מקדמה וכל יתרה רשומות. לא שוכחים אף שקל.' },
  ];
  return (
    <section className="ew-light" aria-labelledby="ew-ben-h">
      <div className="ew-reveal-line" data-rv>
        <img src="/atlas-logo-navy.svg" alt="" width="96" height="30" aria-hidden="true" />
        <h2 id="ew-ben-h" className="ew-h2 dark">הכל בטלפון אחד.</h2>
        <p className="ew-sub">בלי מחברת, בלי אקסל, בלי לבדוק בשלוש אפליקציות.</p>
      </div>
      <ul className="ew-ben-list">
        {items.map((it) => (
          <li key={it.img} className="ew-ben" data-rv>
            <div className="ew-ben-shot">
              <Phone src={`${UI}${it.img}`} alt={it.alt} className="ew-phone-sm" />
            </div>
            <div className="ew-ben-txt">
              <h3>{it.h}</h3>
              <p>{it.p}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="ew-sample dark">מסכים אמיתיים מהאפליקציה · נתוני דוגמה</p>
    </section>
  );
}

function RollPrice({ from, to }) {
  const ref = useRef(null);
  useRoll(ref, from, to, fmt);
  return <b ref={ref}>{fmt(to)}</b>;
}

function Offer({ spotsLeft }) {
  return (
    <section className="ew-offer" aria-labelledby="ew-offer-h">
      <div className="ew-offer-card" data-rv>
        <SpotsPill spotsLeft={spotsLeft} />
        <h2 id="ew-offer-h" className="ew-h2">50 המקומות הראשונים.</h2>
        <p className="ew-offer-lede">מי שנכנס עכשיו מקבל את מה שלא יינתן אחרי ההשקה.</p>
        <ol className="ew-gifts">
          <li>
            <span className="ew-gift-n" aria-hidden="true">1</span>
            <div>
              <h3>הקמה אישית</h3>
              <p>דין, המייסד של <span dir="ltr">atlas</span>, מקים לכם את החשבון: מחבר את Booking ו-Airbnb, מגדיר את היחידות ומכין את נוסחי ההודעות.</p>
            </div>
          </li>
          <li>
            <span className="ew-gift-n" aria-hidden="true">2</span>
            <div>
              <h3>מחיר מייסדים, נעול</h3>
              <p>מחיר המסלול השנתי, בתשלום חודשי. נעול לכל זמן שאתם איתנו.</p>
              <table className="ew-prices">
                <caption className="ew-vh">מחיר מייסדים לחודש לעומת המחיר הרגיל</caption>
                <thead><tr><th scope="col">מסלול</th><th scope="col">מחיר מייסדים</th><th scope="col">אחרי ההשקה</th></tr></thead>
                <tbody>
                  {PRICING_PLANS.map((p) => (
                    <tr key={p.key}>
                      <th scope="row">{p.nameHe}<small>{p.limit}</small></th>
                      <td><RollPrice from={p.price} to={p.priceYearly} /><small>לחודש</small></td>
                      <td><s>{fmt(p.price)}</s></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </li>
          <li>
            <span className="ew-gift-n" aria-hidden="true">3</span>
            <div>
              <h3>{TRIAL_DAYS} יום חינם</h3>
              <p>הכל פתוח, בלי כרטיס אשראי. מפסיקים מתי שרוצים.</p>
            </div>
          </li>
        </ol>
        <p className="ew-never">אחרי 50 המקומות, המחיר הזה לא יחזור.</p>
        <button type="button" className="ew-cta" onClick={scrollToForm}>שמרו לי מקום</button>
      </div>
    </section>
  );
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

function JoinForm({ variant, onDone, done }) {
  const [f, setF] = useState({ name: '', phone: '', units: '', complex: '', consent: false, website: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr(''); setBusy(true);
    const r = await joinWaitlist({ ...f, variant }).catch(() => ({ ok: false, error: 'לא הצלחנו לשמור. בדקו את החיבור ונסו שוב.' }));
    setBusy(false);
    if (r.ok) onDone(r); else setErr(r.error || 'לא הצלחנו לשמור. נסו שוב בעוד רגע.');
  };

  if (done) {
    return (
      <div className="ew-done" role="status" tabIndex={-1} id="ew-done">
        <div className="ew-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <h2 className="ew-h2 dark">המקום שלכם שמור.</h2>
        {typeof done.position === 'number' && <p className="ew-pos">אתם מספר <b>{done.position}</b> בתור.</p>}
        <p className="ew-sub">דין יחזור אליכם בוואטסאפ לפני ההשקה, כדי לקבוע את ההקמה האישית.</p>
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
    { q: 'מתי ההשקה?', a: 'בקרוב. מי שברשימה שומע ראשון, ודין חוזר אליו אישית.' },
    { q: 'צריך להבין במחשבים?', a: 'לא. בהקמה האישית דין מגדיר הכל, ואתם רק מאשרים.' },
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
  const variant = useVariant();
  const rootRef = useRef(null);
  const joinRef = useRef(null);
  const [spotsLeft, setSpotsLeft] = useState(null);
  const [done, setDone] = useState(null);
  const [joinVisible, setJoinVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  useMeta();
  useReveal(rootRef);

  useEffect(() => { fetchSpotsLeft().then((n) => { if (typeof n === 'number') setSpotsLeft(n); }); }, []);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const join = joinRef.current; const hero = rootRef.current?.querySelector('.cx-cta');
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.target === join) setJoinVisible(e.isIntersecting);
      else setHeroVisible(e.isIntersecting);
    }), { threshold: 0 });
    if (join) io.observe(join);
    if (hero) io.observe(hero);
    return () => io.disconnect();
  }, []);
  useEffect(() => { if (done) setTimeout(() => document.getElementById('ew-done')?.focus(), 50); }, [done]);

  const showSticky = !done && !joinVisible && !heroVisible;
  const go = useCallback(() => scrollToForm(), []);
  const pill = <SpotsPill spotsLeft={spotsLeft} />;

  return (
    <div className={`ew ew-v-${variant}`} ref={rootRef} dir="rtl" lang="he">
      <a href="#join" className="ew-skip">דלגו לטופס</a>
      {variant === 'b' ? <HeroStorm onCta={go} pill={pill} /> : <HeroMagnet onCta={go} pill={pill} />}
      <main>
        <Benefits />
        <Offer spotsLeft={spotsLeft} />
        <section className="ew-join" id="join" ref={joinRef} aria-labelledby="ew-form-h">
          <JoinForm variant={variant} done={done} onDone={setDone} />
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
