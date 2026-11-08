/**
 * /early hero + body (version A "הקסם בפעולה", shipped 08.11.2026; B and C live in git history, commit 49d15fee).
 * Goal: in 3 seconds the visitor sees (1) what atlas does, working, and (2) why to sign up now.
 * A Booking notification lands, the dates fill in the atlas calendar, a guest message draft is ready to open in WhatsApp.
 * Copy honesty (checked against the app 08.11.2026): ical-sync runs every 15 min, Booking iCal carries no guest name,
 * guest messages are wa.me drafts the owner sends. So: no "instant", no "sent", the fly chip shows dates not a name.
 * The phone UI is drawn in HTML with the app's own layout and colors (sample data, labelled "נתוני דוגמה").
 * Motion: CSS keyframes, transform/opacity only, one shared 7.5s loop. Reduced motion: the finished state, static.
 */
import { PRICING_PLANS, TRIAL_DAYS } from '@/config/pricing';

const fmt = (n) => `₪${n.toLocaleString('he-IL')}`;
const A = () => <span dir="ltr" className="v4-atlas">atlas</span>;
const Logo = ({ tone = 'navy', w = 76 }) => (
  <img src={`/atlas-logo-${tone}.svg`} alt="atlas" width={w} height={Math.round(w * 0.31)} className="v4-logo" style={{ width: w, height: 'auto' }} />
);

/* ---------------- phone + calendar (shared) ---------------- */

// November 2026 starts on Sunday. Rows of 7, RTL grid (Sunday on the right).
const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
const AIRBNB = new Set([6, 7]);
const BOOKED = new Set([20, 21, 27, 28]);
const NEW = [13, 14];

function Status() {
  return (
    <div className="v4-status" aria-hidden="true">
      <span dir="ltr">9:41</span>
      <i className="v4-island" />
      <span className="v4-bat" />
    </div>
  );
}

function Calendar() {
  return (
    <div className="v4-cal">
      <div className="v4-cal-head">
        <b>לוח שנה</b>
        <span>נובמבר 2026</span>
      </div>
      <div className="v4-units"><span className="on">כל היחידות</span><span>הזית</span><span>הגפן</span></div>
      <div className="v4-grid">
        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((d) => <span key={d} className="v4-dow">{d}</span>)}
        {DAYS.map((d) => {
          const isNew = NEW.includes(d);
          const cls = isNew ? `v4-d new n${NEW.indexOf(d)}` : AIRBNB.has(d) ? 'v4-d air' : BOOKED.has(d) ? 'v4-d bk' : 'v4-d';
          return <span key={d} className={cls}><em>{d}</em>{isNew && <b className="v4-dw" aria-hidden="true">{d}</b>}</span>;
        })}
      </div>
      <div className="v4-legend"><span><i className="bk" />Booking</span><span><i className="air" />Airbnb</span></div>
    </div>
  );
}

function Notif({ app, title, body, cls = '', time = 'עכשיו' }) {
  return (
    <div className={`v4-notif ${cls}`}>
      <span className={`v4-app ${app}`} aria-hidden="true">B.</span>
      <div className="v4-notif-t">
        <p className="v4-notif-top"><b dir="ltr">Booking.com</b><span>{time}</span></p>
        <p className="v4-notif-h">{title}</p>
        <p className="v4-notif-b">{body}</p>
      </div>
    </div>
  );
}

function MsgCard({ cls = '' }) {
  return (
    <div className={`v4-msg ${cls}`}>
      <p className="v4-msg-k"><span className="v4-ok" aria-hidden="true">✓</span>נוסח הודעה לאורח מוכן</p>
      <p className="v4-msg-t">שלום, מחכים לכם בשישי בצימר הזית. אפשר להגיע מ-15:00. נסיעה טובה.</p>
      <span className="v4-msg-btn">פתיחה בוואטסאפ שלכם</span>
    </div>
  );
}

/** A loop: notification → flies into the calendar → dates fill → guest message ready. */
export function PhoneMagic() {
  return (
    <figure className="v4-phone loop-a">
      <div className="v4-screen" role="img" aria-label="הדגמה עם נתוני דוגמה: הזמנה מ-Booking מופיעה ביומן של atlas, התאריכים 13 עד 15 בנובמבר מתמלאים, ונוסח הודעה לאורח מוכן לפתיחה בוואטסאפ">
        <Status />
        <Calendar />
        <Notif app="bk" cls="a-n" title="הזמנה חדשה: רוני פרץ" body="13–15 בנובמבר · 2 לילות · הזית" />
        <span className="v4-fly" aria-hidden="true">הזית · 2 לילות</span>
        <MsgCard cls="a-m" />
      </div>
      <figcaption>נתוני דוגמה</figcaption>
    </figure>
  );
}

/* ---------------- heroes ---------------- */

function TopBar() {
  return (
    <div className="v4-top">
      <Logo w={78} />
      <span className="v4-soon">בקרוב</span>
    </div>
  );
}

function OfferPill() {
  return (
    <p className="v4-pill">
      <span className="v4-dot" aria-hidden="true" />
      50 הראשונים: הקמה אישית ומחיר מייסדים
    </p>
  );
}

export function HeroA4({ onCta }) {
  return (
    <header className="h4 h4-a">
      <TopBar />
      <div className="h4-copy">
        <p className="h4-kicker">לבעלי צימרים ומתחמי נופש</p>
        <h1 className="h4-h1"><span>הזמנה נכנסה.</span><span className="lit"><A /> כבר סידר.</span></h1>
        <p className="h4-sub">התאריכים מ-Booking ו-Airbnb נכנסים לבד ליומן אחד, ונוסח ההודעה לאורח כבר מחכה.</p>
      </div>
      <div className="h4-cta">
        <OfferPill />
        <button type="button" className="v4-btn cx-cta" onClick={onCta}>שמרו לי מקום</button>
      </div>
      <PhoneMagic />
    </header>
  );
}

function PriceRows({ dark }) {
  return (
    <table className={`v4-prices ${dark ? 'dk' : ''}`}>
      <caption className="ew-vh">מחיר מייסדים לחודש לעומת המחיר הרגיל</caption>
      <thead className="ew-vh"><tr><th scope="col">מסלול</th><th scope="col">מחיר מייסדים לחודש</th><th scope="col">המחיר הרגיל</th></tr></thead>
      <tbody>
        {PRICING_PLANS.map((p) => (
          <tr key={p.key}>
            <th scope="row">{p.nameHe}<small>{p.limit}</small></th>
            <td className="now"><b>{fmt(p.priceYearly)}</b><small>לחודש</small></td>
            <td className="was"><s>{fmt(p.price)}</s></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------------- shared body ---------------- */

export function RealScreens() {
  return (
    <section className="v4-real" aria-labelledby="v4-real-h">
      <h2 id="v4-real-h" className="v4-h2" data-rv>ככה זה נראה באפליקציה.</h2>
      <div className="v4-real-row">
        <figure data-rv>
          <img src="/landing-v8/ui/d-calendar.webp" alt="מסך לוח השנה של atlas עם הזמנות לפי יחידות" width="780" height="1688" loading="lazy" decoding="async" />
          <figcaption><b>יומן אחד</b>לכל היחידות</figcaption>
        </figure>
        <figure data-rv>
          <img src="/landing-v8/ui/d-today.webp" alt="מסך היום של atlas עם המשימות, הכניסות והיציאות של היום" width="780" height="1688" loading="lazy" decoding="async" />
          <figcaption><b>מסך היום</b>כניסות, יציאות וניקיון</figcaption>
        </figure>
      </div>
      <p className="v4-sample">מסכים אמיתיים מהאפליקציה · נתוני דוגמה</p>
    </section>
  );
}

export function Offer4({ onCta }) {
  return (
    <section className="v4-offer" aria-labelledby="v4-offer-h">
      <div className="v4-offer-in">
        <p className="c4-eyebrow" data-rv><span className="v4-dot" aria-hidden="true" />לפני ההשקה</p>
        <h2 id="v4-offer-h" className="v4-offer-h" data-rv><span className="c4-50">50</span><span>המקומות<br />הראשונים מקבלים:</span></h2>
        <ol className="v4-gifts">
          <li data-rv><span className="n" aria-hidden="true">1</span><div><h3>הקמה אישית</h3><p>מחברים לכם את היומנים של Booking ו-Airbnb, מגדירים את היחידות ומכינים את נוסחי ההודעות.</p></div></li>
          <li data-rv><span className="n" aria-hidden="true">2</span><div><h3>מחיר מייסדים, נעול</h3><p>מחיר המסלול השנתי, בתשלום חודשי. נעול כל עוד המנוי פעיל.</p><PriceRows dark /></div></li>
          <li data-rv><span className="n" aria-hidden="true">3</span><div><h3>{TRIAL_DAYS} יום חינם</h3><p>הכל פתוח, בלי כרטיס אשראי.</p></div></li>
        </ol>
        <p className="c4-never" data-rv>אחרי 50 המקומות, חוזרים למחיר הרגיל.</p>
        <button type="button" className="v4-btn light" onClick={onCta} data-rv>שמרו לי מקום</button>
      </div>
    </section>
  );
}
