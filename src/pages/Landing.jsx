import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Check, ChevronDown, CalendarX, MessagesSquare, Wallet, CalendarRange, Users,
  MessageCircle, SprayCan, FileBarChart, Receipt, FileSignature, Star, Zap, Globe,
  Lock, UserCog, Download, Headset, CircleCheck,
} from 'lucide-react';
import CookieConsent from '@/components/landing/CookieConsent';
import { HeroMock, SHOWCASE_MOCKS } from '@/components/landing/ProductMockups';
import { PRICING_PLANS } from '@/config/pricing';
import '@/components/landing/landing.css';

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

const PAINS = [
  {
    icon: CalendarX,
    title: 'הזמנה כפולה',
    text: 'אותו לילה נמכר ב-Booking וגם ב-Airbnb, ועכשיו צריך להתקשר לאורח ולהתנצל.',
  },
  {
    icon: MessagesSquare,
    title: 'וואטסאפ, אקסל ופתקים',
    text: 'פרטי האורח בצ׳אט אחד, המקדמה בגיליון, והמנקה יודעת רק אם זכרתם לכתוב לה.',
  },
  {
    icon: Wallet,
    title: 'רודפים אחרי כסף',
    text: 'מי שילם מקדמה? מי עוד חייב יתרה? כל חודש מחשבים הכל מחדש בראש.',
  },
];

const SHOWCASE = [
  {
    key: 'calendar',
    icon: CalendarRange,
    tab: 'יומן מסונכרן',
    pain: 'בלי הזמנות כפולות',
    title: 'כל ההזמנות, מכל הערוצים, ביומן אחד',
    text: 'מחברים את Booking.com ו-Airbnb בקישור iCal, וכל הזמנה נכנסת ללוח שנה אחד. רואים כל יחידה וכל לילה בלי לקפוץ בין אתרים.',
    points: ['סנכרון iCal עם Booking.com ו-Airbnb', 'תצוגה לפי יחידה, שבוע או חודש', 'הזמנות ישירות נכנסות לאותו יומן'],
  },
  {
    key: 'leads',
    icon: Users,
    tab: 'הזמנות ולידים',
    pain: 'בלי פניות שהולכות לאיבוד',
    title: 'כל פנייה במקום אחד, עד שהיא הופכת להזמנה',
    text: 'כל מי שפנה מקבל כרטיס עם הפרטים, התאריכים והשלב שלו. רואים מה פתוח, ממי מחכים לתשובה, ומה כבר נסגר.',
    points: ['כרטיס לכל אורח עם כל ההיסטוריה', 'שלב לכל פנייה: חדשה, הצעת מחיר, מקדמה', 'הופכים ליד להזמנה בלחיצה'],
  },
  {
    key: 'messages',
    icon: MessageCircle,
    tab: 'הודעות לאורחים',
    pain: 'בלי להקליד אותה הודעה עשר פעמים',
    title: 'האורח מקבל את המידע בזמן, בלי שתזכרו לשלוח',
    text: 'אישור הזמנה, הוראות הגעה ובקשה לביקורת יוצאים לבד ב-WhatsApp או ב-SMS, בנוסח שלכם ובתזמון שבחרתם.',
    points: ['תבניות הודעה בעברית', 'תזמון לפי ההזמנה: לפני הגעה, אחרי עזיבה', 'כל ההודעות של האורח בשרשור אחד'],
    note: 'השליחה האוטומטית פועלת אחרי חיבור חשבון WhatsApp Business או ספק SMS.',
  },
  {
    key: 'payments',
    icon: Wallet,
    tab: 'תשלומים והכנסות',
    pain: 'בלי לרדוף אחרי מקדמות',
    title: 'יודעים בדיוק מי שילם, מי חייב, וכמה נשאר בקופה',
    text: 'מקדמות, יתרות והוצאות במסך אחד. הכנסות מול הוצאות של החודש מחכות לכם בלי אקסל.',
    points: ['סטטוס תשלום לכל הזמנה', 'מעקב הוצאות לפי קטגוריה', 'חשבוניות ודוח חודשי'],
  },
  {
    key: 'cleaning',
    icon: SprayCan,
    tab: 'ניקיון',
    pain: 'בלי טלפונים למנקה',
    title: 'הצוות יודע מה לנקות ומתי',
    text: 'רשימת ניקיונות לכל יום, לפי עזיבות. כל משימה משויכת לאיש צוות עם שעה וצ׳קליסט, ואתם רואים מה כבר מוכן.',
    points: ['משימה לכל יחידה, עם שעה', 'שיוך לאיש צוות', 'צ׳קליסט וסימון ״בוצע״'],
  },
];

const MODULES = [
  { icon: FileBarChart, title: 'דוחות', text: 'הכנסות, תפוסה ודוח לבעלי נכסים.' },
  { icon: Receipt, title: 'חשבוניות', text: 'מפיקים חשבונית להזמנה ושולחים לאורח.' },
  { icon: FileSignature, title: 'חוזים דיגיטליים', text: 'שולחים חוזה לחתימה ועוקבים אחרי הסטטוס.' },
  { icon: Star, title: 'ביקורות', text: 'בקשת ביקורת אחרי העזיבה, ומעקב במקום אחד.' },
  { icon: Zap, title: 'אוטומציות', text: 'כללים פשוטים: כשקורה X, ATLAS עושה Y.' },
  { icon: Globe, title: 'פורטל אורחים', text: 'עמוד לאורח עם כל המידע לפני ההגעה.' },
];

const STEPS = [
  { title: 'נרשמים', text: 'אימייל וסיסמה. 14 יום עם כל המערכת, בלי כרטיס אשראי.' },
  { title: 'מוסיפים יחידות ומחברים יומנים', text: 'מגדירים את הצימרים ומדביקים את קישורי היומן מ-Booking.com ומ-Airbnb.' },
  { title: 'מנהלים הכל ממקום אחד', text: 'הזמנות, הודעות, תשלומים וניקיון. מהמחשב או מהנייד.' },
];

const TRUST = [
  { icon: Lock, title: 'חיבור מוצפן', text: 'כל המידע עובר בין הדפדפן לשרת בחיבור HTTPS מוצפן.' },
  { icon: UserCog, title: 'הרשאות לצוות', text: 'מנהלים ועובדים נכנסים כל אחד עם הרשאות משלו.' },
  { icon: Download, title: 'הנתונים שלכם', text: 'מייצאים את ההזמנות לקובץ CSV בכל רגע.' },
  { icon: Headset, title: 'תמיכה אנושית בעברית', text: 'אנשים אמיתיים עונים בוואטסאפ ובמייל.' },
];

const FAQ = [
  {
    q: 'צריך כרטיס אשראי כדי להתחיל?',
    a: 'לא. נרשמים, מקבלים 14 יום עם כל המערכת, ומחליטים אחר כך אם להמשיך.',
  },
  {
    q: 'מה קורה בסוף 14 הימים?',
    a: 'בוחרים מסלול שמתאים למספר היחידות שלכם. אם לא בוחרים מסלול, לא מחויבים.',
  },
  {
    q: 'איך ATLAS מתחברת ל-Booking.com ול-Airbnb?',
    a: 'דרך קישור iCal שכל ערוץ נותן. מדביקים אותו פעם אחת, וההזמנות מהערוץ נכנסות ללוח השנה של ATLAS ומתעדכנות לבד.',
  },
  {
    q: 'צריך להתקין משהו?',
    a: 'לא. ATLAS עובדת בדפדפן, במחשב ובנייד. נכנסים עם אימייל וסיסמה.',
  },
  {
    q: 'אפשר לבטל?',
    a: 'כן, בכל עת וללא התחייבות.',
  },
  {
    q: 'ומה אם נתקעים?',
    a: 'כותבים לנו בוואטסאפ או במייל, ומקבלים תשובה בעברית מאדם, לא מבוט.',
    contact: true,
  },
];

function CtaButton({ className = '', children = CTA_LABEL }) {
  return (
    <Link to="/register" className={`lp-btn lp-btn-primary ${className}`}>
      {children}
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
            <a href="#features">מה יש בפנים</a>
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

function Hero() {
  return (
    <section className="lp-hero" aria-labelledby="hero-title">
      <div className="lp-wrap lp-hero-grid">
        <div>
          <span className="lp-eyebrow lp-rise">מערכת ניהול לצימרים ולמתחמי נופש</span>
          <h1 id="hero-title" className="lp-h1 lp-rise lp-rise-2">
            <span className="lp-h1-line">אתם מארחים.</span>{' '}
            <span className="lp-h1-line"><em>ATLAS</em> מנהלת את השאר.</span>
          </h1>
          <p className="lp-lead lp-rise lp-rise-3">
            יומן אחד שמסונכרן עם Booking.com ו-Airbnb, הודעות אוטומטיות לאורחים, תשלומים וניקיון. במקום אקסל וקבוצות וואטסאפ.
          </p>
          <div className="lp-rise lp-rise-4">
            <div className="lp-hero-ctas">
              <CtaButton />
              <a href="#features" className="lp-btn lp-btn-ghost">איך זה עובד</a>
            </div>
            <FinePrint />
          </div>
        </div>
        <div className="lp-hero-visual lp-rise lp-rise-3">
          <HeroMock />
          <div className="lp-toast" aria-hidden="true">
            <span className="lp-toast-ic"><MessageCircle size={18} /></span>
            <div>
              <b>הוראות הגעה נשלחו למשפחת מזרחי</b>
              <span>WhatsApp, אוטומטית, יום לפני ההגעה</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pain() {
  return (
    <section className="lp-section" aria-labelledby="pain-title" style={{ paddingTop: 40 }}>
      <div className="lp-wrap">
        <div className="lp-head">
          <h2 id="pain-title" className="lp-h2">נשמע מוכר?</h2>
          <p className="lp-sub">ככה נראה ניהול מתחם כשהכל מפוזר בין אתרים, צ׳אטים וגיליונות.</p>
        </div>
        <div className="lp-pain">
          {PAINS.map((p) => (
            <div key={p.title} className="lp-pain-item">
              <span className="lp-pain-ic"><p.icon size={20} aria-hidden="true" /></span>
              <div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="lp-promise">
          <Check size={22} aria-hidden="true" />
          ATLAS מחליפה את כל זה במסך אחד.
        </p>
      </div>
    </section>
  );
}

function Showcase() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef([]);
  const item = SHOWCASE[active];
  const Mock = SHOWCASE_MOCKS[item.key];

  const onKeyDown = (e) => {
    // RTL: ArrowLeft moves forward.
    let next = null;
    if (e.key === 'ArrowLeft') next = (active + 1) % SHOWCASE.length;
    if (e.key === 'ArrowRight') next = (active - 1 + SHOWCASE.length) % SHOWCASE.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = SHOWCASE.length - 1;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const select = (i) => {
    setActive(i);
    tabRefs.current[i]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  };

  return (
    <section id="features" className="lp-section" aria-labelledby="features-title" style={{ background: 'var(--lp-surface)' }}>
      <div className="lp-wrap">
        <div className="lp-head lp-head-center">
          <h2 id="features-title" className="lp-h2">כל מה שהמתחם צריך. במקום אחד.</h2>
          <p className="lp-sub">בחרו נושא וראו איך זה נראה בתוך ATLAS.</p>
        </div>
        <div className="lp-tabs" role="tablist" aria-label="יכולות ATLAS">
          {SHOWCASE.map((s, i) => (
            <button
              key={s.key}
              ref={(el) => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              id={`tab-${s.key}`}
              aria-selected={i === active}
              aria-controls={`panel-${s.key}`}
              tabIndex={i === active ? 0 : -1}
              className="lp-tab"
              onClick={() => select(i)}
              onKeyDown={onKeyDown}
            >
              <s.icon size={17} aria-hidden="true" />
              {s.tab}
            </button>
          ))}
        </div>
        <div
          key={item.key}
          id={`panel-${item.key}`}
          role="tabpanel"
          aria-labelledby={`tab-${item.key}`}
          className="lp-panel lp-panel-anim"
        >
          <div>
            <span className="lp-panel-pain"><Check size={15} aria-hidden="true" />{item.pain}</span>
            <h3>{item.title}</h3>
            <p className="lp-panel-text">{item.text}</p>
            <ul className="lp-checks">
              {item.points.map((p) => (
                <li key={p}><Check size={18} aria-hidden="true" />{p}</li>
              ))}
            </ul>
            {item.note && <p className="lp-note">{item.note}</p>}
          </div>
          <Mock />
        </div>
      </div>
    </section>
  );
}

function Modules() {
  return (
    <section className="lp-section" aria-labelledby="modules-title">
      <div className="lp-wrap">
        <div className="lp-head">
          <h2 id="modules-title" className="lp-h2">ועוד כמה דברים שכבר בפנים</h2>
        </div>
        <div className="lp-mods">
          {MODULES.map((m) => (
            <div key={m.title} className="lp-mod">
              <span className="lp-mod-ic"><m.icon size={19} aria-hidden="true" /></span>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Steps() {
  return (
    <section id="how" className="lp-section" aria-labelledby="how-title" style={{ paddingTop: 0 }}>
      <div className="lp-wrap">
        <div className="lp-head">
          <h2 id="how-title" className="lp-h2">שלושה צעדים ואתם בפנים</h2>
          <p className="lp-sub">לא צריך הדרכה ולא צריך טכנאי.</p>
        </div>
        <ol className="lp-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="lp-step">
              <span className="lp-step-n num" aria-hidden="true">{i + 1}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="lp-section" aria-labelledby="pricing-title" style={{ background: 'var(--lp-surface)' }}>
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
        <div className="lp-plans">
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
    <section className="lp-section" aria-labelledby="trust-title">
      <div className="lp-wrap">
        <div className="lp-trust">
          <div>
            <h2 id="trust-title" className="lp-h2" style={{ fontSize: 'clamp(26px, 5.6vw, 34px)' }}>המידע של האורחים שלכם, בידיים שלכם</h2>
            <p className="lp-sub" style={{ fontSize: 16 }}>
              פרטים נוספים בעמוד <Link to="/data-security" style={{ color: 'var(--lp-teal-ink)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>אבטחת מידע</Link>.
            </p>
          </div>
          <div className="lp-trust-items">
            {TRUST.map((t) => (
              <div key={t.title} className="lp-trust-item">
                <span className="lp-mod-ic"><t.icon size={19} aria-hidden="true" /></span>
                <div>
                  <h3>{t.title}</h3>
                  <p>{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="lp-section" aria-labelledby="faq-title" style={{ paddingTop: 0 }}>
      <div className="lp-wrap">
        <div className="lp-head lp-head-center">
          <h2 id="faq-title" className="lp-h2">שאלות לפני שמתחילים</h2>
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
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">לוואטסאפ</a>
                    {' או '}
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
    <section className="lp-section" aria-labelledby="final-title" style={{ paddingTop: 0, paddingBottom: 0 }}>
      <div className="lp-wrap">
        <div className="lp-final">
          <h2 id="final-title" className="lp-h2">ההזמנה הבאה שלכם כבר יכולה להיכנס ל-ATLAS</h2>
          <p>נרשמים עכשיו, מחברים את היומנים, ומרגישים את ההבדל כבר השבוע.</p>
          <div className="lp-hero-ctas">
            <CtaButton />
          </div>
          <FinePrint />
        </div>
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
    <div className="lp" dir="rtl" lang="he">
      <a href="#main" className="lp-skip">דלגו לתוכן</a>
      <Header />
      <main id="main">
        <Hero />
        <Pain />
        <Showcase />
        <Modules />
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
