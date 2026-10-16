import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Check, ChevronDown, CalendarX, MessagesSquare, Wallet, SprayCan,
  MessageCircle, Users, FileBarChart, Receipt, FileSignature, Star, Zap, Globe,
  Lock, UserCog, Download, Headset, CircleCheck, X,
} from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { HeroMock, SHOWCASE_MOCKS } from '@/components/landing/ProductMockups';
import { PRICING_PLANS } from '@/config/pricing';
import '@/components/landing/landing.css';
import '@/components/landing/landing-b.css';

const WHATSAPP_URL = 'https://wa.me/972545380085';
const SUPPORT_EMAIL = 'support@atlas-app.co.il';
const CTA_LABEL = '14 יום ניסיון חינם';

// Plan feature strings come from src/config/pricing.js; show them in plain Hebrew here.
const FEATURE_HE = {
  'כל תכונות Starter': 'כל מה שבמתחיל',
  'כל תכונות Pro': 'כל מה שבמקצועי',
  'API מותאם': 'API מותאם אישית',
};
const planFeature = (f) => FEATURE_HE[f] || f;

/* Each story = one pain the owner knows, and how ATLAS removes it. */
const STORIES = [
  {
    key: 'calendar',
    before: 'אותו לילה נמכר ב-Booking וגם ב-Airbnb',
    beforeIcon: CalendarX,
    title: 'יומן אחד לכל הערוצים',
    text: 'מחברים את Booking.com ו-Airbnb בקישור iCal, וכל הזמנה נכנסת ללוח שנה אחד. רואים כל יחידה וכל לילה בלי לקפוץ בין אתרים.',
    points: ['סנכרון iCal עם Booking.com ו-Airbnb', 'הזמנות ישירות באותו יומן'],
  },
  {
    key: 'messages',
    before: 'מקלידים את אותה הודעה לכל אורח',
    beforeIcon: MessagesSquare,
    title: 'הודעות שיוצאות לבד',
    text: 'אישור הזמנה, הוראות הגעה ובקשה לביקורת יוצאים ב-WhatsApp או ב-SMS, בנוסח שלכם ובתזמון שבחרתם.',
    points: ['תבניות הודעה בעברית', 'תזמון לפי ההזמנה'],
    note: 'השליחה האוטומטית פועלת אחרי חיבור חשבון WhatsApp Business או ספק SMS.',
  },
  {
    key: 'payments',
    before: 'מי שילם מקדמה? מי עוד חייב?',
    beforeIcon: Wallet,
    title: 'כל שקל במקום שלו',
    text: 'מקדמות, יתרות והוצאות במסך אחד. הכנסות מול הוצאות של החודש מחכות לכם בלי אקסל.',
    points: ['סטטוס תשלום לכל הזמנה', 'מעקב הוצאות ודוח חודשי'],
  },
  {
    key: 'cleaning',
    before: 'המנקה לא ידעה שיש עזיבה',
    beforeIcon: SprayCan,
    title: 'הצוות יודע מה לנקות ומתי',
    text: 'רשימת ניקיונות לכל יום לפי עזיבות. כל משימה משויכת לאיש צוות, עם שעה וצ׳קליסט.',
    points: ['שיוך לאיש צוות', 'צ׳קליסט וסימון ״בוצע״'],
  },
];

const ALSO = [
  { icon: Users, title: 'לידים ופניות' },
  { icon: FileBarChart, title: 'דוחות ודוח בעלים' },
  { icon: Receipt, title: 'חשבוניות' },
  { icon: FileSignature, title: 'חוזים דיגיטליים' },
  { icon: Star, title: 'בקשות לביקורת' },
  { icon: Zap, title: 'אוטומציות' },
  { icon: Globe, title: 'פורטל אורחים' },
];

const STEPS = [
  { title: 'נרשמים', text: 'אימייל וסיסמה. בלי כרטיס אשראי.' },
  { title: 'מחברים יומנים', text: 'מדביקים את קישורי היומן מ-Booking.com ומ-Airbnb.' },
  { title: 'מנהלים ממקום אחד', text: 'הזמנות, הודעות, תשלומים וניקיון. מהמחשב או מהנייד.' },
];

const TRUST = [
  { icon: Lock, title: 'חיבור מוצפן', text: 'כל המידע עובר בחיבור HTTPS מוצפן.' },
  { icon: UserCog, title: 'הרשאות לצוות', text: 'מנהלים ועובדים, כל אחד עם הרשאות משלו.' },
  { icon: Download, title: 'הנתונים שלכם', text: 'מייצאים את ההזמנות ל-CSV בכל רגע.' },
  { icon: Headset, title: 'תמיכה אנושית', text: 'אנשים עונים בעברית, בוואטסאפ ובמייל.' },
];

const FAQ = [
  { q: 'צריך כרטיס אשראי כדי להתחיל?', a: 'לא. נרשמים, מקבלים 14 יום עם כל המערכת, ומחליטים אחר כך אם להמשיך.' },
  { q: 'מה קורה בסוף 14 הימים?', a: 'בוחרים מסלול שמתאים למספר היחידות שלכם. אם לא בוחרים מסלול, לא מחויבים.' },
  { q: 'איך ATLAS מתחברת ל-Booking.com ול-Airbnb?', a: 'דרך קישור iCal שכל ערוץ נותן. מדביקים אותו פעם אחת, וההזמנות מהערוץ נכנסות ללוח השנה של ATLAS ומתעדכנות לבד.' },
  { q: 'צריך להתקין משהו?', a: 'לא. ATLAS עובדת בדפדפן, במחשב ובנייד. נכנסים עם אימייל וסיסמה.' },
  { q: 'אפשר לבטל?', a: 'כן, בכל עת וללא התחייבות.' },
  { q: 'ומה אם נתקעים?', a: 'כותבים לנו בוואטסאפ או במייל, ומקבלים תשובה בעברית מאדם, לא מבוט.', contact: true },
];

function CtaButton({ className = '' }) {
  return (
    <Link to="/register" className={`lp-btn lp-btn-primary ${className}`}>
      {CTA_LABEL}
      <ArrowLeft size={18} className="lp-arrow" aria-hidden="true" />
    </Link>
  );
}

function FinePrint() {
  return (
    <p className="lp-fineprint">
      <span><CircleCheck size={16} aria-hidden="true" />בלי כרטיס אשראי</span>
      <span><CircleCheck size={16} aria-hidden="true" />ביטול בכל עת</span>
    </p>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div ref={sentinel} aria-hidden="true" style={{ position: 'absolute', top: 0, height: 8, width: 1 }} />
      <header className="lp-header" data-scrolled={scrolled}>
        <div className="lp-wrap lp-header-in">
          <Link to="/" className="lp-logo" aria-label="ATLAS, לדף הבית">
            <img src="/atlas-logo-final.png" width={546} height={183} alt="ATLAS" decoding="async" />
          </Link>
          <nav className="lp-nav" aria-label="ניווט ראשי">
            <a href="#features">איך זה עוזר</a>
            <a href="#how">איך מתחילים</a>
            <a href="#pricing">מחירים</a>
            <a href="#faq">שאלות</a>
          </nav>
          <div className="lp-header-actions">
            <a className="lp-icon-link" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="דברו איתנו בוואטסאפ">
              <MessageCircle size={20} aria-hidden="true" />
            </a>
            <Link to="/login" className="lp-text-link">התחברות</Link>
            <Link to="/register" className="lp-btn lp-btn-dark lp-btn-sm lp-cta-short">ניסיון חינם</Link>
            <Link to="/register" className="lp-btn lp-btn-dark lp-btn-sm lp-cta-full">{CTA_LABEL}</Link>
          </div>
        </div>
      </header>
    </>
  );
}

function TodayCard() {
  const rows = [
    { t: 'אישור הזמנה', g: 'יעל ונדב', time: '09:12' },
    { t: 'הוראות הגעה', g: 'משפחת מזרחי', time: '12:00' },
    { t: 'בקשה לביקורת', g: 'אורי דהן', time: '13:30' },
  ];
  return (
    <div className="lp-window lpb-side" aria-hidden="true">
      <div className="lp-win-bar">
        <span className="lp-win-title"><MessageCircle size={16} />נשלח היום</span>
        <span className="lp-chip lp-chip-ok">אוטומטי</span>
      </div>
      <div className="lp-list">
        {rows.map((r) => (
          <div key={r.t} className="lp-row">
            <span className="lp-av lp-av-direct"><Check size={15} strokeWidth={2.5} /></span>
            <div className="lp-row-main"><b>{r.t}</b><span>{r.g}</span></div>
            <span className="lp-row-time num">{r.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="lpb-hero" aria-labelledby="hero-title">
      <div className="lp-wrap lpb-hero-text">
        <span className="lp-eyebrow lp-rise">מערכת ניהול לצימרים ולמתחמי נופש</span>
        <h1 id="hero-title" className="lp-h1 lpb-h1 lp-rise lp-rise-2">
          <span className="lp-h1-line">אתם מארחים.</span>{' '}
          <span className="lp-h1-line"><em>ATLAS</em> מנהלת את השאר.</span>
        </h1>
        <p className="lp-lead lp-rise lp-rise-3">
          הזמנות מכל הערוצים, הודעות לאורחים, תשלומים וניקיון. הכל במקום אחד, בעברית, במקום אקסל וקבוצות וואטסאפ.
        </p>
        <div className="lp-rise lp-rise-4">
          <div className="lp-hero-ctas">
            <CtaButton />
            <a href="#features" className="lp-btn lp-btn-ghost">איך זה עוזר</a>
          </div>
          <FinePrint />
        </div>
      </div>
      <div className="lp-wrap lpb-stage lp-rise lp-rise-4">
        <div className="lpb-stage-main"><HeroMock /></div>
        <TodayCard />
      </div>
    </section>
  );
}

function Stories() {
  return (
    <section id="features" className="lp-section lpb-stories" aria-labelledby="features-title">
      <div className="lp-wrap">
        <div className="lp-head lp-head-center">
          <h2 id="features-title" className="lp-h2">ככה נראה היום שלכם עם ATLAS</h2>
          <p className="lp-sub">ארבעה דברים שגוזלים זמן לכל מארח, ואיך הם נפתרים.</p>
        </div>
        <div className="lpb-bento">
          {STORIES.map((s) => {
            const Mock = SHOWCASE_MOCKS[s.key];
            return (
              <article key={s.key} className="lpb-story">
                <div className="lpb-story-text">
                  <p className="lpb-before"><X size={14} strokeWidth={2.5} aria-hidden="true" /><span>{s.before}</span></p>
                  <h3>{s.title}</h3>
                  <p className="lpb-story-p">{s.text}</p>
                  <ul className="lp-checks">
                    {s.points.map((p) => <li key={p}><Check size={17} aria-hidden="true" />{p}</li>)}
                  </ul>
                  {s.note && <p className="lp-note">{s.note}</p>}
                </div>
                <div className="lpb-story-mock"><Mock /></div>
              </article>
            );
          })}
        </div>
        <div className="lpb-also" aria-labelledby="also-title">
          <h3 id="also-title">וגם, בלי תוספים:</h3>
          <ul>
            {ALSO.map((a) => (
              <li key={a.title}><a.icon size={16} aria-hidden="true" />{a.title}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Steps() {
  return (
    <section id="how" className="lp-section lpb-steps-sec" aria-labelledby="how-title">
      <div className="lp-wrap">
        <div className="lp-head lp-head-center">
          <h2 id="how-title" className="lp-h2">מתחילים בשלושה צעדים</h2>
          <p className="lp-sub">לא צריך הדרכה ולא צריך טכנאי.</p>
        </div>
        <ol className="lpb-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="lpb-step-n num" aria-hidden="true">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="lp-steps-cta"><CtaButton /></div>
      </div>
    </section>
  );
}

function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="lp-section" aria-labelledby="pricing-title">
      <div className="lp-wrap">
        <div className="lp-head lp-head-center">
          <h2 id="pricing-title" className="lp-h2">מחיר לפי גודל המתחם</h2>
          <p className="lp-sub">כל המסלולים מתחילים ב-14 יום ניסיון חינם.</p>
          <div className="lp-toggle" role="group" aria-label="תדירות חיוב">
            <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>חודשי</button>
            <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>
              שנתי<em>חוסכים 20%</em>
            </button>
          </div>
        </div>
        <div className="lp-plans lpb-plans">
          {PRICING_PLANS.map((p) => {
            const price = yearly ? p.priceYearly : p.price;
            const isBusiness = p.key === 'business';
            return (
              <div key={p.key} className={`lp-plan${p.popular ? ' is-pop' : ''}`}>
                {p.popular && <span className="lp-plan-badge">הכי נבחר</span>}
                <div className="lp-plan-head">
                  <div>
                    <h3>{p.nameHe}</h3>
                    <p className="lp-plan-desc">{p.desc}</p>
                  </div>
                  <div className="lp-price lp-price-gap">
                    <b className="num">₪{price}</b>
                    <span>{yearly ? 'לחודש, בחיוב שנתי' : 'לחודש'}</span>
                  </div>
                </div>
                <ul className="lp-checks">
                  {p.features.map(planFeature).map((f) => (
                    <li key={f}><Check size={17} aria-hidden="true" />{f}</li>
                  ))}
                </ul>
                {isBusiness ? (
                  <Link to="/contact" className="lp-btn lp-btn-ghost">דברו איתנו</Link>
                ) : (
                  <Link to="/register" className={`lp-btn ${p.popular ? 'lp-btn-primary' : 'lp-btn-ghost'}`}>{CTA_LABEL}</Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section className="lpb-trust" aria-labelledby="trust-title">
      <div className="lp-wrap">
        <h2 id="trust-title" className="lpb-trust-title">
          המידע של האורחים שלכם, בידיים שלכם.{' '}
          <Link to="/data-security">עוד על אבטחת מידע</Link>
        </h2>
        <ul className="lpb-trust-list">
          {TRUST.map((t) => (
            <li key={t.title}>
              <span className="lp-mod-ic"><t.icon size={18} aria-hidden="true" /></span>
              <div><b>{t.title}</b><span>{t.text}</span></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="lp-section" aria-labelledby="faq-title">
      <div className="lp-wrap lpb-faq-wrap">
        <div>
          <h2 id="faq-title" className="lp-h2">שאלות לפני שמתחילים</h2>
          <p className="lp-sub">לא מצאתם תשובה? <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="lpb-inline">כתבו לנו בוואטסאפ</a></p>
        </div>
        <div className="lp-faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>
                {f.q}
                <ChevronDown size={20} aria-hidden="true" />
              </summary>
              <div className="lp-faq-a">
                {f.a}
                {f.contact && (
                  <>
                    {' '}
                    <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                  </>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="lpb-final" aria-labelledby="final-title">
      <div className="lp-wrap">
        <h2 id="final-title" className="lpb-final-h">ההזמנה הבאה שלכם כבר יכולה להיכנס ל-ATLAS.</h2>
        <p>נרשמים עכשיו, מחברים את היומנים, ומרגישים את ההבדל כבר השבוע.</p>
        <div className="lp-hero-ctas"><CtaButton /></div>
        <FinePrint />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-in">
        <Link to="/" className="lp-logo" aria-label="ATLAS, לדף הבית">
          <img src="/atlas-logo-final.png" width={546} height={183} alt="ATLAS" loading="lazy" decoding="async" />
        </Link>
        <nav aria-label="קישורים">
          <Link to="/about">אודות</Link>
          <Link to="/contact">צור קשר</Link>
          <Link to="/data-security">אבטחת מידע</Link>
          <Link to="/accessibility">נגישות</Link>
          <Link to="/privacy">פרטיות</Link>
          <Link to="/terms">תנאי שימוש</Link>
        </nav>
        <div className="lp-footer-meta">
          <a className="lp-footer-mail" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          <small>© {new Date().getFullYear()} ATLAS</small>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  useEffect(() => {
    document.title = 'ATLAS | מערכת ניהול לצימרים ולמתחמי נופש';
  }, []);

  return (
    <div className="lp lp-b" dir="rtl" lang="he">
      <a href="#main" className="lp-skip">דלגו לתוכן</a>
      <Header />
      <main id="main">
        <Hero />
        <Stories />
        <Steps />
        <Pricing />
        <Trust />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}
