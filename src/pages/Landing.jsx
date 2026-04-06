import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar, CreditCard, Users, CheckSquare, MessageSquare, FileText,
  Star, Zap, BarChart2, Link as LinkIcon, Receipt, Shield,
  ChevronDown, ChevronLeft, ChevronRight, X,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';
import SupportChat from '@/components/landing/SupportChat';
import CookieConsent from '@/components/landing/CookieConsent';
import { motion, useReducedMotion } from 'framer-motion';

// ─── Animated price roller ───────────────────────────────────────────────────
function AnimatedPrice({ value, duration = 500 }) {
  const [display, setDisplay] = useState(value);
  const [rolling, setRolling] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;
    setRolling(true);
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      setDisplay(Math.round(from + (to - from) * ease));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setRolling(false);
      }
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span style={{
      display: 'inline-block',
      transition: 'transform 0.15s ease-out',
      transform: rolling ? 'scale(1.05)' : 'scale(1)',
    }}>
      ₪{display}
    </span>
  );
}

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let startTime = null;
          const step = (ts) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(ease * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return [count, ref];
}

// ─── Scroll-reveal hook (bulletproof) ─────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    let observer = null;
    const raf = requestAnimationFrame(() => {
      const els = document.querySelectorAll('.atlas-reveal');
      if (!els.length) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('atlas-reveal--visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );
      els.forEach((el) => observer.observe(el));
    });
    return () => {
      cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
    };
  }, []);
}

// ─── Newsletter section ───────────────────────────────────────────────────────
function NewsletterSection() {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState('idle'); // idle | success | error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) { setStatus('error'); return; }
    // Store locally; real integration wired via backend/CRM
    const list = JSON.parse(localStorage.getItem('atlas_newsletter') || '[]');
    list.push({ email, ts: new Date().toISOString() });
    localStorage.setItem('atlas_newsletter', JSON.stringify(list));
    setStatus('success');
    setEmail('');
  };

  return (
    <section style={{ background: '#F9FAFB', padding: '64px 24px', borderTop: '1px solid #F3F4F6' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <h3 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 10px', fontFamily: 'Heebo, sans-serif' }}>
          קבל טיפים לניהול מתחמים
        </h3>
        <p style={{ fontSize: 16, color: '#6B7280', margin: '0 0 28px', lineHeight: 1.6 }}>
          עדכונים, מדריכים ותכונות חדשות — ישירות למייל. ללא ספאם.
        </p>
        {status === 'success' ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#D1FAE5', borderRadius: 12, padding: '14px 24px' }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#065F46', fontFamily: 'Heebo, sans-serif' }}>נרשמת בהצלחה! נתראה בתיבת הדואר.</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
            noValidate
          >
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
              placeholder="כתובת המייל שלך"
              required
              style={{
                flex: '1 1 220px',
                minWidth: 200,
                maxWidth: 320,
                padding: '13px 18px',
                minHeight: 50,
                fontSize: 15,
                fontFamily: 'Heebo, sans-serif',
                border: status === 'error' ? '1.5px solid #F87171' : '1.5px solid #E5E7EB',
                borderRadius: 10,
                outline: 'none',
                direction: 'ltr',
                textAlign: 'right',
                background: 'white',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#4F46E5'; }}
              onBlur={e => { e.currentTarget.style.borderColor = status === 'error' ? '#F87171' : '#E5E7EB'; }}
            />
            <button
              type="submit"
              style={{
                background: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '13px 26px',
                minHeight: 50,
                fontWeight: 700,
                fontSize: 15,
                fontFamily: 'Heebo, sans-serif',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#4338CA'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; }}
            >
              הרשמה
            </button>
          </form>
        )}
        {status === 'error' && (
          <p style={{ fontSize: 13, color: '#EF4444', marginTop: 8, fontFamily: 'Heebo, sans-serif' }}>
            אנא הזן כתובת מייל תקינה
          </p>
        )}
      </div>
    </section>
  );
}

/** Live clock for scroll-driven ATLAS mock — ticks only when layer is visible; snaps on reveal */
function IsraelDemoClock({ active = true }) {
  const [now, setNow] = useState(() => new Date());
  useLayoutEffect(() => {
    if (!active) return;
    setNow(new Date());
  }, [active]);
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);
  const text = now.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jerusalem',
  });
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: '#64748B',
        fontFamily: 'ui-monospace, "Cascadia Code", monospace',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.02em',
      }}
      suppressHydrationWarning
    >
      {text}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoSlide, setDemoSlide] = useState(0);
  const [billingYearly, setBillingYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [psPhase, setPsPhase] = useState('chaos'); // chaos → unify → atlas (scroll-driven)
  const psSectionRef = useRef(null);
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const [count1, ref1] = useCountUp(500);
  const [count2, ref2] = useCountUp(98);
  const [count3, ref3] = useCountUp(3);

  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setDemoOpen(false); };
    if (demoOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.removeEventListener('keydown', handleEsc); document.body.style.overflow = ''; };
  }, [demoOpen]);

  const goToRegister = () => navigate('/register');
  const goToLogin = () => navigate('/login');
  const scrollToFeatures = () => {
    document.getElementById('atlas-features')?.scrollIntoView({ behavior: 'smooth' });
  };
  const nextSlide = () => setDemoSlide((s) => Math.min(s + 1, 4));
  const prevSlide = () => setDemoSlide((s) => Math.max(s - 1, 0));

  // Transformation section: scroll-driven animation (chaos → unify → atlas while scrolling)
  // Lower thresholds = need more scroll before phase changes — keeps pace with reading / slower feel.
  useEffect(() => {
    const el = psSectionRef.current;
    if (!el) return;
    let rafId = 0;
    const updatePhase = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const isDesktop = vh > 700;
      const threshold1 = isDesktop ? vh * 0.30 : vh * 0.44;
      const threshold2 = isDesktop ? vh * 0.065 : vh * 0.14;
      if (rect.top > threshold1) setPsPhase('chaos');
      else if (rect.top > threshold2) setPsPhase('unify');
      else setPsPhase('atlas');
    };
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        updatePhase();
      });
    };
    updatePhase();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Demo modal keyboard navigation (arrows, ESC)
  useEffect(() => {
    if (!demoOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setDemoOpen(false);
      if (e.key === 'ArrowRight') prevSlide();
      if (e.key === 'ArrowLeft') nextSlide();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [demoOpen, demoSlide]);
  const toggleFaq = (i) => setOpenFaq((prev) => (prev === i ? null : i));

  const AVATARS = [
    { bg: 'linear-gradient(135deg,#4F46E5,#818CF8)', letter: 'א' },
    { bg: 'linear-gradient(135deg,#10B981,#34D399)', letter: 'ב' },
    { bg: 'linear-gradient(135deg,#F59E0B,#FCD34D)', letter: 'ג' },
    { bg: 'linear-gradient(135deg,#F43F5E,#FB7185)', letter: 'ד' },
    { bg: 'linear-gradient(135deg,#8B5CF6,#C4B5FD)', letter: 'ה' },
  ];

  const MARQUEE_TEXT = 'מתחם הגליל · צימר בגולן · וילות כרמל · ריזורט ים המלח · צימרים בצפון · מתחם הנגב · נאות מדבר · בקתות גולן ·\u00A0\u00A0\u00A0';

  const PAIN_POINTS = [
    'הזמנות מפוזרות ב-WhatsApp, אימייל ו-Booking.com',
    'תשלומים שנשכחים ולקוחות שלא משלמים בזמן',
    'חדרים שלא נוקו כי לא היה תיאום עם הצוות',
    'אין נראות על ההכנסות — רק ניחושים',
    'שעות על שעות על ניהול במקום על האורחים',
  ];

  const SOLUTIONS = [
    'כל ההזמנות במקום אחד — מסודרות ומאורגנות',
    'גביית תשלומים אוטומטית עם תזכורות חכמות',
    'ניהול צוות ניקיון עם משימות ועדכונים בזמן אמת',
    'דוחות הכנסה מפורטים בלחיצה אחת',
    'חוסך עד 3 שעות עבודה ביום לכל מנהל',
  ];

  const FEATURES_GRID = [
    { Icon: Calendar, title: 'ניהול הזמנות', text: 'קבל הזמנות מכל הערוצים במקום אחד. תצוגת לוח שנה חכמה.' },
    { Icon: CreditCard, title: 'תשלומים חכמים', text: 'גביה אוטומטית, חשבוניות דיגיטליות, מעקב יתרות.' },
    { Icon: Users, title: 'ניהול לידים', text: 'פייפליין מכירות מלא — מליד ראשוני עד הזמנה מאושרת.' },
    { Icon: CheckSquare, title: 'ניהול ניקיון', text: 'הקצאת משימות לצוות, צ\'קליסטים, ועדכוני סטטוס.' },
    { Icon: MessageSquare, title: 'תקשורת אוטומטית', text: 'הודעות אוטומטיות לפני צ\'ק-אין, ביום עזיבה ובקשת ביקורת.' },
    { Icon: FileText, title: 'חוזים דיגיטליים', text: 'שלח חוזים לחתימה דיגיטלית. עקוב אחר סטטוס.' },
    { Icon: Star, title: 'ניהול ביקורות', text: 'עקוב אחר ביקורות בכל הפלטפורמות. שלח בקשות אוטומטיות.' },
    { Icon: Zap, title: 'אוטומציות חכמות', text: 'הגדר חוקים אוטומטיים — חסוך שעות עבודה כל שבוע.' },
    { Icon: BarChart2, title: 'דוחות ואנליטיקס', text: 'דוחות הכנסה, תפוסה ושביעות רצון בזמן אמת.' },
    { Icon: LinkIcon, title: 'אינטגרציות', text: 'מתחבר ל-Airbnb, Booking.com, WhatsApp, Stripe ועוד.' },
    { Icon: Receipt, title: 'חשבוניות ומע"מ', text: 'הפקת חשבוניות עם מע"מ 17%, ייצוא PDF, חיבור לחשבנאות.' },
    { Icon: Shield, title: 'אבטחה ופרטיות', text: 'הצפנה מלאה, גיבויים אוטומטיים, עמידה בתקני GDPR.' },
  ];

  const HOW_STEPS = [
    { num: '1', title: 'נרשמים חינם', text: 'יוצרים חשבון בלי כרטיס אשראי. לוקח פחות מדקה.' },
    { num: '2', title: 'מוסיפים את המתחם', text: 'מזינים את פרטי הנכסים שלך. תמיכה מלאה בעברית.' },
    { num: '3', title: 'מחברים את הכלים', text: 'מחברים Airbnb, WhatsApp ועוד בלחיצה אחת.' },
    { num: '4', title: 'מתחילים לנהל', text: 'מקבלים הזמנות, מנהלים צוות ועוקבים אחר הכנסות.' },
  ];

  const INTEGRATION_ROWS = [
    { label: 'ערוצי הזמנות', items: ['Airbnb', 'Booking.com', 'Expedia', 'VRBO', 'HomeAway'] },
    { label: 'תשלומים', items: ['Stripe', 'PayPal', 'Tranzila', 'Cardcom', 'iCredit'] },
    { label: 'תקשורת', items: ['WhatsApp Business', 'Gmail', 'SMS', 'Telegram'] },
    { label: 'חשבנאות', items: ['חשבשבת', 'ירוקה', 'Monday', 'Zapier', 'Google Calendar'] },
  ];

  const PRICING_PLANS = [
    { name: 'מתחיל', monthlyPrice: 399, yearlyPrice: 319, desc: 'למתחמים קטנים עד 3 נכסים', included: ['עד 3 נכסים', 'ניהול הזמנות', 'ניהול לידים', 'תשלומים בסיסיים', 'תמיכה במייל'], excluded: ['אוטומציות', 'חוזים דיגיטליים', 'אינטגרציות מתקדמות'], cta: 'התחל חינם', featured: false },
    { name: 'מקצועי', monthlyPrice: 699, yearlyPrice: 559, desc: 'לעסקים צומחים עד 10 נכסים', included: ['עד 10 נכסים', 'כל תכונות Starter', 'אוטומציות חכמות', 'חוזים דיגיטליים', 'כל האינטגרציות', 'דוחות מתקדמים', 'תמיכה בוואטסאפ'], excluded: ['API מותאם אישית'], cta: 'התחל חינם 14 יום', featured: true },
    { name: 'עסקי', monthlyPrice: 999, yearlyPrice: 799, desc: 'לרשתות ומתחמים גדולים — ללא הגבלה', included: ['נכסים ללא הגבלה', 'כל תכונות Pro', 'API מותאם אישית', 'מנהל חשבון אישי', 'הדרכה והטמעה', 'SLA מובטח', 'תמיכה 24/7'], excluded: [], cta: 'דברו איתנו', featured: false, isBusiness: true },
  ];

  const NEW_TESTIMONIALS = [
    { text: 'ATLAS חסכה לי 3 שעות עבודה כל יום. ההזמנות מסודרות, התשלומים אוטומטיים והצוות יודע מה לעשות.', author: 'רחל', role: 'בעלת 4 צימרים — הגליל', avatar: 'https://ui-avatars.com/api/?name=Rachel+M&background=random', rating: 5 },
    { text: 'תוך שבוע הבנתי שזה הכלי שחיכיתי לו. הכל בעברית, הכל פשוט, הכל עובד.', author: 'יוסי', role: 'בעל ריזורט — ים המלח', avatar: 'https://ui-avatars.com/api/?name=Yossi+K&background=random', rating: 5 },
    { text: 'ההכנסות שלי עלו ב-35% כי סוף סוף אני יכול לעקוב אחרי כל ליד ולא לפספס הזמנות.', author: 'מירי', role: 'בעלת 8 בקתות — גולן', avatar: 'https://ui-avatars.com/api/?name=Miri+S&background=random', rating: 4.5 },
    { text: 'הצוות שלי מקבל משימות ניקיון אוטומטית. אין יותר טלפונים מיותרים.', author: 'דני', role: 'מנהל מתחם — כרמל', avatar: 'https://ui-avatars.com/api/?name=Dani+A&background=random', rating: 5 },
    { text: 'שלחתי חוזים לחתימה דיגיטלית לראשונה והלקוחות התרשמו. נראה מקצועי ברמה אחרת.', author: 'נועה', role: 'בעלת וילות — שרון', avatar: 'https://ui-avatars.com/api/?name=Noa+R&background=random', rating: 4.5 },
    { text: 'התמיכה בעברית היא המשחק-שינוי. סוף סוף מערכת שמבינה אותי.', author: 'אורי', role: 'מנהל קומפלקס — אילת', avatar: 'https://ui-avatars.com/api/?name=Uri+F&background=random', rating: 5 },
  ];

  const FAQ_DATA = [
    { q: 'כמה זמן לוקח להתחיל?', a: 'פחות מ-5 דקות. נרשמים, מוסיפים נכס ומתחילים. אין הגדרות מסובכות.' },
    { q: 'האם צריך כרטיס אשראי להתחיל?', a: 'לא. ניסיון של 14 יום חינם לחלוטין, ללא כרטיס אשראי.' },
    { q: 'האם המערכת בעברית?', a: 'כן, המערכת כולה בעברית מלאה כולל תמיכה, חשבוניות ותקשורת עם לקוחות.' },
    { q: 'כמה נכסים אפשר לנהל?', a: 'תלוי בחבילה — מ-3 נכסים בחבילת Starter ועד ללא הגבלה בחבילת Business.' },
    { q: 'האם יש אינטגרציה עם Airbnb ו-Booking.com?', a: 'כן, מתחברים לכל ערוצי ההזמנות המרכזיים בלחיצה אחת.' },
    { q: 'מה קורה אחרי תקופת הניסיון?', a: 'תקבל תזכורת 3 ימים לפני הסיום. אם לא תשדרג, החשבון יעבור למצב קריאה בלבד.' },
    { q: 'האם אפשר לבטל בכל עת?', a: 'כן, ביטול בלחיצה אחת ללא קנסות. הנתונים שלך יישמרו 30 יום.' },
    { q: 'האם יש תמיכה בעברית?', a: 'כן, תמיכה בעברית דרך וואטסאפ, מייל וטלפון בשעות עסקים.' },
  ];

  const DEMO_SLIDES = [
    { title: 'לוח בקרה — מבט כולל על העסק' },
    { title: 'לוח הזמנות — כל ההזמנות במקום אחד' },
    { title: 'ניהול לידים — מליד להזמנה' },
    { title: 'תשלומים — גביה חכמה ואוטומטית' },
    { title: 'אוטומציות — העסק עובד בשבילך' },
  ];

  const renderDemoSlide = (idx) => {
    const mockStyle = { background: '#F8F8FC', borderRadius: 12, padding: 20, minHeight: 320 };
    const cardS = { background: 'white', borderRadius: 10, padding: '12px 16px', border: '1px solid #E5E7EB' };
    const badgeS = (bg, color) => ({ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: bg, color, display: 'inline-block' });

    if (idx === 0) return (
      <div style={mockStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'הכנסה חודשית', value: '₪48,200', color: '#4F46E5' },
            { label: 'הזמנות', value: '24', color: '#10B981' },
            { label: 'תפוסה', value: '92%', color: '#F59E0B' },
            { label: 'דירוג', value: '4.9★', color: '#F43F5E' },
          ].map((k) => (
            <div key={k.label} style={cardS}>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
        <div style={{ ...cardS, marginBottom: 12, padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
            {[40, 65, 50, 80, 70, 55, 90].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 6 ? '#4F46E5' : '#C7D2FE', borderRadius: '3px 3px 0 0' }} />
            ))}
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 6 }}>הכנסות שבועיות</div>
        </div>
        {[
          { name: 'משפחת לוי', room: 'חדר 12', s: 'מאושר', sb: '#D1FAE5', sc: '#065F46' },
          { name: 'דני כהן', room: 'וילה 3', s: 'ממתין', sb: '#FEF3C7', sc: '#92400E' },
          { name: 'שרה א.', room: 'סוויטה 1', s: 'מאושר', sb: '#D1FAE5', sc: '#065F46' },
        ].map((b) => (
          <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: 8, marginBottom: 6, border: '1px solid #F3F4F6' }}>
            <span style={badgeS(b.sb, b.sc)}>{b.s}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{b.name}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{b.room}</div>
            </div>
          </div>
        ))}
      </div>
    );

    if (idx === 1) {
      const days = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
      const bookings = { 3: '#818CF8', 4: '#818CF8', 5: '#818CF8', 10: '#34D399', 11: '#34D399', 12: '#34D399', 13: '#34D399', 18: '#FCD34D', 19: '#FCD34D', 24: '#FB7185', 25: '#FB7185', 26: '#FB7185' };
      return (
        <div style={mockStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <ChevronRight size={18} color="#6B7280" />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>מרץ 2025</span>
            <ChevronLeft size={18} color="#6B7280" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
            {days.map((d) => <div key={d} style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', padding: 6 }}>{d}</div>)}
            {[...Array(2)].map((_, i) => <div key={`e${i}`} />)}
            {[...Array(31)].map((_, i) => {
              const day = i + 1;
              const bg = bookings[day];
              return (
                <div key={day} style={{ padding: '8px 4px', borderRadius: 6, fontSize: 12, fontWeight: bg ? 700 : 400, background: bg || 'transparent', color: bg ? 'white' : '#374151' }}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (idx === 2) {
      const cols = [
        { title: 'ליד חדש', count: 4, color: '#6B7280', cards: ['אבי כהן', 'רונית לוי', 'משפ׳ דוד', 'יעל מ.'] },
        { title: 'פנייה', count: 3, color: '#3B82F6', cards: ['אורן ש.', 'דנה ר.', 'מיכאל א.'] },
        { title: 'הצעה נשלחה', count: 2, color: '#F59E0B', cards: ['נועם כ.', 'שירה ב.'] },
        { title: 'סגור ✓', count: 5, color: '#10B981', cards: ['רחל מ.', 'יוסי כ.', 'דני א.'] },
      ];
      return (
        <div style={mockStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {cols.map((col) => (
              <div key={col.title}>
                <div style={{ fontSize: 12, fontWeight: 700, color: col.color, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {col.title} <span style={{ fontSize: 10, background: '#F3F4F6', borderRadius: 999, padding: '1px 6px', color: '#6B7280' }}>{col.count}</span>
                </div>
                {col.cards.map((c) => (
                  <div key={c} style={{ background: 'white', borderRadius: 8, padding: '10px 12px', marginBottom: 6, border: '1px solid #F3F4F6', borderRight: `3px solid ${col.color}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{c}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>₪{(Math.random() * 4000 + 1000).toFixed(0)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (idx === 3) return (
      <div style={mockStyle}>
        <div style={{ ...cardS, marginBottom: 16, background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.06))', border: '1px solid rgba(79,70,229,0.15)' }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>סה״כ הכנסות החודש</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#4F46E5' }}>₪127,450</div>
          <span style={badgeS('#D1FAE5', '#065F46')}>↑ 23% מהחודש הקודם</span>
        </div>
        {[
          { name: 'משפ׳ לוי', amount: '₪3,200', s: 'שולם', sb: '#D1FAE5', sc: '#065F46' },
          { name: 'דני כהן', amount: '₪1,800', s: 'ממתין', sb: '#FEF3C7', sc: '#92400E' },
          { name: 'שרה א.', amount: '₪4,500', s: 'שולם', sb: '#D1FAE5', sc: '#065F46' },
          { name: 'יוסי מ.', amount: '₪2,100', s: 'באיחור', sb: '#FEE2E2', sc: '#991B1B' },
          { name: 'רונית ל.', amount: '₪2,900', s: 'שולם', sb: '#D1FAE5', sc: '#065F46' },
        ].map((p) => (
          <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'white', borderRadius: 8, marginBottom: 6, border: '1px solid #F3F4F6' }}>
            <span style={badgeS(p.sb, p.sc)}>{p.s}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{p.amount}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{p.name}</span>
            </div>
          </div>
        ))}
      </div>
    );

    if (idx === 4) return (
      <div style={mockStyle}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', marginBottom: 12 }}>אוטומציות פעילות (5)</div>
        {[
          { rule: 'הודעת ברוכים הבאים לאורח', desc: 'נשלחת 24 שעות לפני צ׳ק-אין', on: true },
          { rule: 'תזכורת תשלום אוטומטית', desc: 'נשלחת 3 ימים לפני מועד התשלום', on: true },
          { rule: 'הקצאת ניקיון לפי צ׳ק-אאוט', desc: 'משימה נוצרת אוטומטית לצוות', on: true },
          { rule: 'בקשת ביקורת יום אחרי עזיבה', desc: 'נשלחת הודעה עם קישור לביקורת', on: true },
          { rule: 'עדכון זמינות ב-Airbnb', desc: 'סנכרון אוטומטי של לוח הזמנים', on: false },
        ].map((a) => (
          <div key={a.rule} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'white', borderRadius: 10, marginBottom: 8, border: '1px solid #F3F4F6' }}>
            <div
              style={{
                width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative',
                background: a.on ? '#4F46E5' : '#D1D5DB', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, transition: 'right 0.2s, left 0.2s', ...(a.on ? { left: 2 } : { left: 20 }), boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <div style={{ textAlign: 'right', flex: 1, marginLeft: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{a.rule}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{a.desc}</div>
            </div>
            <Zap size={16} color={a.on ? '#4F46E5' : '#D1D5DB'} style={{ flexShrink: 0 }} />
          </div>
        ))}
      </div>
    );

    return null;
  };

  return (
    <>
      <style>{`
        /* ─ Font ─ */
        .atlas-lp, .atlas-lp * {
          font-family: 'Heebo', sans-serif;
          box-sizing: border-box;
        }

        /* ─ Blobs (static — animating blur() elements is extremely GPU-heavy) ─ */
        .atlas-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .atlas-blob-1 {
          width: 800px; height: 800px;
          background: radial-gradient(circle, #A78BFA 0%, transparent 70%);
          opacity: 0.22;
          top: -180px; right: -160px;
        }
        .atlas-blob-2 {
          width: 700px; height: 700px;
          background: radial-gradient(circle, #93C5FD 0%, transparent 70%);
          opacity: 0.20;
          top: 20%; left: -200px;
        }
        .atlas-blob-3 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #FDE68A 0%, transparent 70%);
          opacity: 0.15;
          bottom: -100px; left: 50%;
          transform: translateX(-50%);
        }

        /* ─ Dashboard floats ─ */
        @keyframes atlasMainFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        .atlas-main-float {
          animation: atlasMainFloat 5s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes atlasFC1 {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        .atlas-fc1 { animation: atlasFC1 4s ease-in-out 0.8s infinite; will-change: transform; }
        @keyframes atlasFC2 {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        .atlas-fc2 { animation: atlasFC2 4s ease-in-out 1.6s infinite; will-change: transform; }
        @keyframes atlasFC3 {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }

        /* ─ Pulsing dot ─ */
        @keyframes atlasDot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(1.35); }
        }
        .atlas-dot { animation: atlasDot 2s ease-in-out infinite; }

        /* ─ Transformation: chaos cards converge to center ─ */
        .atlas-chaos-card {
          transition: left 1.35s cubic-bezier(0.25,0.1,0.25,1), top 1.35s cubic-bezier(0.25,0.1,0.25,1),
            transform 1.35s cubic-bezier(0.25,0.1,0.25,1), opacity 0.85s ease;
        }
        .atlas-chaos-card.atlas-converge {
          left: 50% !important;
          top: 50% !important;
          transform: translate(-50%, -50%) scale(0.12) rotate(0deg) !important;
          opacity: 0.3;
        }

        /* ─ Marquee ─ */
        @keyframes atlasMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .atlas-marquee { animation: atlasMarquee 40s linear infinite; }

        /* ─ Feature card hover ─ */
        .atlas-feat-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: default;
        }
        .atlas-feat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06) !important;
        }

        /* ─ Global minimum touch target for interactive elements ─ */
        .atlas-lp button,
        .atlas-lp a {
          min-height: 44px;
        }
        .atlas-lp button[aria-hidden="true"],
        .atlas-lp .atlas-demo-dot {
          min-height: unset;
        }

        /* ─ Navbar link ─ */
        .atlas-nav-link {
          color: #374151;
          font-weight: 500;
          font-size: 15px;
          text-decoration: none;
          transition: color 0.2s;
          display: inline-flex;
          align-items: center;
        }
        .atlas-nav-link:hover { color: #111827; }

        /* ─ CTA button primary ─ */
        .atlas-btn-primary {
          background: #111827;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 14px 28px;
          font-weight: 700;
          font-size: 16px;
          font-family: 'Heebo', sans-serif;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .atlas-btn-primary:hover {
          background: #000;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        }

        /* ─ FAQ answer ─ */
        .atlas-faq-answer {
          overflow: hidden;
        }
        .atlas-faq-answer--open {
          /* visible */
        }
        .atlas-faq-item {
          transition: all 0.25s ease;
          border: 1.5px solid transparent;
        }
        .atlas-faq-item:hover {
          border-color: #E0E7FF;
          box-shadow: 0 4px 20px rgba(79,70,229,0.06);
          transform: translateY(-1px);
        }
        .atlas-faq-item--active {
          border-color: #C7D2FE !important;
          background: linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 100%) !important;
          box-shadow: 0 4px 24px rgba(79,70,229,0.08) !important;
        }

        /* ─ Pricing card hover ─ */
        .atlas-pricing-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .atlas-pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06) !important;
        }

        /* ─ Integration badge hover ─ */
        .atlas-int-badge {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .atlas-int-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        /* ─ Demo modal ─ */
        @keyframes atlasFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes atlasSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .atlas-demo-overlay {
          animation: atlasFadeIn 0.25s ease;
        }
        .atlas-demo-modal {
          animation: atlasSlideUp 0.35s ease;
        }

        /* ─ Integration marquee ─ */
        @keyframes atlasIntScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(50%); }
        }
        .atlas-int-track {
          display: flex;
          width: max-content;
          animation: atlasIntScroll 120s linear infinite;
        }
        .atlas-int-track:hover { animation-play-state: paused; }

        /* ─ Responsive ─ */
        @media (max-width: 768px) {
          .atlas-nav-links  { display: none !important; }
          .atlas-nav-cta    { display: none !important; }
          .atlas-hamburger  { display: flex !important; }

          .atlas-hero-grid  { grid-template-columns: 1fr !important; text-align: center !important; }
          .atlas-hero-right { order: 1; }
          .atlas-hero-left  { display: none !important; }
          .atlas-hero-h1 { font-size: 36px !important; }
          .atlas-hero-sub { font-size: 16px !important; }
          .atlas-hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .atlas-hero-btns > button,
          .atlas-hero-btns > a { width: 100% !important; text-align: center !important; }

          .atlas-ps-grid { grid-template-columns: 1fr !important; }
          .atlas-ps-section { padding: 60px 16px !important; }

          .atlas-feat-grid  { grid-template-columns: 1fr !important; }
          .atlas-feat-grid-new { grid-template-columns: 1fr !important; }
          /* Bento: two columns on phone so feature tiles sit side by side */
          .atlas-bento-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .atlas-bento-large { grid-column: span 2 !important; min-height: auto !important; }
          .atlas-section-title { font-size: 28px !important; }
          .atlas-section-sub { font-size: 15px !important; }

          .atlas-how-grid { grid-template-columns: 1fr !important; gap: 40px !important; }

          .atlas-pricing-grid { grid-template-columns: 1fr !important; }
          .atlas-pricing-card { transform: none !important; }

          .atlas-testi-grid { grid-template-columns: 1fr !important; }
          .atlas-testi-grid-new { grid-template-columns: 1fr !important; }

          .atlas-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .atlas-stat-divider { border-right: none !important; border-bottom: 1px solid #F3F4F6; }

          .atlas-faq-section { padding: 60px 16px !important; }

          .atlas-cta-section { padding: 60px 16px !important; }
          .atlas-cta-h2 { font-size: 28px !important; }

          .atlas-footer-grid { grid-template-columns: 1fr 1fr !important; }
          .atlas-footer-grid-new { grid-template-columns: 1fr !important; gap: 32px !important; }
          .atlas-why-grid { grid-template-columns: 1fr !important; }

          /* Hero mobile: reduce padding so CTA stays above fold */
          .atlas-lp > div > section:first-of-type {
            padding-top: calc(72px + env(safe-area-inset-top)) !important;
            padding-bottom: 32px !important;
            min-height: auto !important;
          }

          .atlas-demo-slide-mockup { min-height: 200px !important; }
          .atlas-demo-slide-mockup > div > div { grid-template-columns: repeat(2, 1fr) !important; }
          .atlas-demo-modal { border-radius: 12px !important; }
          .atlas-feat-testi { padding: 24px 20px !important; }
          .atlas-use-cases-grid { grid-template-columns: 1fr !important; }
          .atlas-personas-grid { grid-template-columns: 1fr !important; }

          /* Features (#features) — bento readable on phone; no overlapping mocks */
          .atlas-features-section {
            padding-left: max(16px, env(safe-area-inset-left)) !important;
            padding-right: max(16px, env(safe-area-inset-right)) !important;
          }
          .atlas-features-intro { margin-bottom: 40px !important; }
          .atlas-features-lead { font-size: 16px !important; line-height: 1.55 !important; }
          .atlas-bento-hero-card,
          .atlas-bento-auto-card {
            padding: 20px 16px !important;
            min-height: auto !important;
            overflow: visible !important;
          }
          .atlas-bento-calendar-mock,
          .atlas-bento-auto-mock {
            position: static !important;
            margin-left: auto !important;
            margin-right: auto !important;
            left: auto !important;
            bottom: auto !important;
          }
          .atlas-bento-calendar-mock {
            margin-top: 18px !important;
            max-width: 260px !important;
            width: 100% !important;
          }
          .atlas-bento-auto-mock {
            margin-top: 16px !important;
            max-width: 260px !important;
            width: 100% !important;
          }
          .atlas-bento-card-title { font-size: 18px !important; line-height: 1.3 !important; }
          .atlas-bento-grid .atlas-feat-card { padding: 20px 16px !important; }
          .atlas-feat-card:hover { transform: none !important; }
          .atlas-features-compare { margin-top: 48px !important; }
          .atlas-features-compare-title { font-size: 22px !important; margin-bottom: 20px !important; }
          .atlas-compare-scroll { border-radius: 12px !important; }
          .atlas-compare-table { min-width: 420px !important; }
          .atlas-compare-table th,
          .atlas-compare-table td { padding: 12px 10px !important; font-size: 12px !important; }
        }

        @media (max-width: 480px) {
          .atlas-hero-h1 { font-size: 26px !important; }
          .atlas-stats-grid { grid-template-columns: 1fr !important; }
          .atlas-footer-grid { grid-template-columns: 1fr !important; }
          .atlas-how-grid { grid-template-columns: 1fr !important; }
          .atlas-bento-grid { gap: 12px !important; }
          .atlas-section-title { font-size: 22px !important; }
          .atlas-section-sub { font-size: 13px !important; }
          .atlas-features-lead { font-size: 15px !important; }
          .atlas-compare-table { min-width: 320px !important; }
          .atlas-compare-table th,
          .atlas-compare-table td { padding: 10px 6px !important; font-size: 11px !important; }
          .atlas-features-compare-title { font-size: 19px !important; }
          .atlas-features-section {
            padding-top: 48px !important;
            padding-bottom: 48px !important;
          }
          .atlas-ps-grid > div { padding: 20px 16px !important; }
          .atlas-ps-grid > div h3 { font-size: 16px !important; }
          .atlas-nav { padding: 10px 12px !important; }
          .atlas-lp section { padding-top: 40px !important; padding-bottom: 40px !important; }
          .atlas-pricing-card { padding: 20px !important; }
          .atlas-footer-inner { padding: 32px 12px !important; }
        }

        /* Mobile section padding */
        @media (max-width: 768px) {
          .atlas-lp section { padding-left: 16px !important; padding-right: 16px !important; }
          .atlas-lp section[style*="padding: 80px"] { padding-top: 48px !important; padding-bottom: 48px !important; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .atlas-feat-grid  { grid-template-columns: 1fr 1fr !important; }
          .atlas-testi-grid { grid-template-columns: 1fr 1fr !important; }
          .atlas-feat-grid-new { grid-template-columns: 1fr 1fr !important; }
          .atlas-bento-grid { grid-template-columns: 1fr 1fr !important; }
          .atlas-bento-large { grid-column: span 2 !important; }
          .atlas-testi-grid-new { grid-template-columns: 1fr 1fr !important; }
          .atlas-pricing-grid { grid-template-columns: 1fr !important; }
          .atlas-how-grid { grid-template-columns: 1fr 1fr !important; }
        }

        @media (min-width: 769px) {
          .atlas-hamburger    { display: none !important; }
          .atlas-mobile-drawer { display: none !important; }
        }

        /* Integrations marquee — minimal vertical padding (overrides global section padding on mobile) */
        .atlas-int-marquee-section {
          padding-top: 3px !important;
          padding-bottom: 3px !important;
        }
        @media (max-width: 480px) {
          .atlas-lp section.atlas-int-marquee-section {
            padding-top: 3px !important;
            padding-bottom: 3px !important;
          }
        }
      `}</style>

      <div
        className="atlas-lp"
        dir="rtl"
        style={{ background: '#FFFFFF', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}
      >

        {/* ════════════════════════════════════════
            NAVBAR
        ════════════════════════════════════════ */}
        <nav
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            zIndex: 100,
            background: scrolled ? '#FFFFFF' : 'transparent',
            boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.06)' : 'none',
            transition: 'background 0.3s ease, box-shadow 0.3s ease',
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, height: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Link to="/" aria-label="דף הבית ATLAS">
                <img
                  src="/atlas-logo-final.png"
                  width={546}
                  height={183}
                  alt="ATLAS — מערכת ניהול מתחמי נופש"
                  decoding="async"
                  fetchPriority="high"
                  style={{ height: 52, width: 'auto', objectFit: 'contain', display: 'block' }}
                />
              </Link>
            </div>

            <div className="atlas-nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
              {[
                { label: 'תכונות', href: '#features', action: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'מחירים', href: '#pricing', action: () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'לקוחות', href: '#testimonials', action: () => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'דמו', href: '#', action: () => { setDemoOpen(true); setDemoSlide(0); } },
              ].map((l) => (
                <a key={l.label} href={l.href} onClick={(e) => { e.preventDefault(); l.action(); }} className="atlas-nav-link">{l.label}</a>
              ))}
              <Link to="/data-security" className="atlas-nav-link">אבטחה</Link>
              <Link to="/about" className="atlas-nav-link">אודות</Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="atlas-nav-cta"
                onClick={goToLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#374151',
                  padding: '12px 20px',
                  minHeight: 44,
                  fontWeight: 600,
                  fontSize: 14,
                  fontFamily: 'Heebo, sans-serif',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#111827'}
                onMouseLeave={e => e.currentTarget.style.color = '#374151'}
              >
                כניסה
              </button>
              <button
                className="atlas-nav-cta"
                onClick={goToRegister}
                style={{
                  background: '#4F46E5',
                  border: 'none',
                  color: 'white',
                  borderRadius: 8,
                  padding: '12px 24px',
                  minHeight: 44,
                  fontWeight: 600,
                  fontSize: 14,
                  fontFamily: 'Heebo, sans-serif',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#4338CA'}
                onMouseLeave={e => e.currentTarget.style.background = '#4F46E5'}
              >
                הרשמה חינם
              </button>

              <button
                className="atlas-hamburger"
                onClick={() => setMenuOpen((v) => !v)}
                style={{ display: 'none', flexDirection: 'column', gap: 5, padding: 12, minWidth: 44, minHeight: 44, background: 'none', border: 'none', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}
                aria-label="תפריט"
              >
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ display: 'block', width: 24, height: 2, background: '#374151', borderRadius: 2 }} />
                ))}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div
              className="atlas-mobile-drawer"
              style={{ background: 'white', borderTop: '1px solid #F3F4F6', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {[
                { label: 'תכונות', href: '#features', action: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'מחירים', href: '#pricing', action: () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'לקוחות', href: '#testimonials', action: () => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'דמו', href: '#', action: () => { setDemoOpen(true); setDemoSlide(0); } },
              ].map((l) => (
                <a key={l.label} href={l.href} onClick={(e) => { e.preventDefault(); setMenuOpen(false); l.action(); }} className="atlas-nav-link" style={{ fontSize: 16 }}>{l.label}</a>
              ))}
              <Link to="/data-security" onClick={() => setMenuOpen(false)} className="atlas-nav-link" style={{ fontSize: 16 }}>אבטחה</Link>
              <Link to="/about" onClick={() => setMenuOpen(false)} className="atlas-nav-link" style={{ fontSize: 16 }}>אודות</Link>
              <button
                onClick={() => { setMenuOpen(false); goToLogin(); }}
                style={{ background: 'none', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '14px 24px', minHeight: 48, fontWeight: 700, fontSize: 15, fontFamily: 'Heebo, sans-serif', cursor: 'pointer', marginTop: 8 }}
              >
                כניסה
              </button>
              <button
                onClick={() => { setMenuOpen(false); goToRegister(); }}
                style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '14px 24px', minHeight: 48, fontWeight: 700, fontSize: 15, fontFamily: 'Heebo, sans-serif', cursor: 'pointer' }}
              >
                הרשמה חינם
              </button>
            </div>
          )}
        </nav>

        {/* ════════════════════════════════════════
            HERO
        ════════════════════════════════════════ */}
        <section
          style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            paddingTop: 'calc(80px + env(safe-area-inset-top))',
            paddingBottom: 'calc(40px + env(safe-area-inset-bottom))',
            paddingLeft: 16,
            paddingRight: 16,
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
          }}
          className="sm:!pl-6 sm:!pr-6"
        >
          <div className="atlas-blob atlas-blob-1" />
          <div className="atlas-blob atlas-blob-2" />
          <div className="atlas-blob atlas-blob-3" />

          <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 2 }}>
            <div
              className="atlas-hero-grid"
              style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 60, alignItems: 'center' }}
            >
              <div className="atlas-hero-right">
                {/* USP badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EEF2FF', borderRadius: 999, padding: '6px 14px', marginBottom: 20 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4F46E5', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#4F46E5' }}>PMS בעברית · אירוח קצר בישראל</span>
                </div>
                <h1
                  style={{
                    fontSize: 'clamp(44px, 6.5vw, 84px)',
                    fontWeight: 900,
                    color: '#0A0A0A',
                    lineHeight: 1.05,
                    letterSpacing: '-0.03em',
                    margin: 0,
                  }}
                >
                  <span style={{ display: 'block' }}>הפסק לנהל.</span>
                  <span style={{ display: 'block' }}>תתחיל להרוויח.</span>
                </h1>

                <p style={{ fontSize: 17, color: '#6B7280', maxWidth: 420, marginTop: 20, lineHeight: 1.65 }}>
                  ATLAS מנהלת את הכל בשבילך — מלידים לתשלומים, מהזמנות לחוזים.<br />
                  <strong style={{ color: '#374151' }}>חוסכת 20+ שעות שבועיות</strong> לכל מנהל מתחם.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
                  <div style={{ display: 'flex' }}>
                    {AVATARS.map((av, i) => (
                      <div
                        key={i}
                        style={{
                          width: 40, height: 40,
                          borderRadius: '50%',
                          background: av.bg,
                          border: '2.5px solid white',
                          marginLeft: i > 0 ? -10 : 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {av.letter}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      ))}
                    </div>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>+500 מנהלי מתחמים מרוצים</span>
                  </div>
                </div>

                <div className="atlas-hero-btns" style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 28, flexWrap: 'wrap' }}>
                  <button className="atlas-btn-primary" onClick={goToRegister} style={{ minHeight: 52 }}>
                    פתח חשבון חינם — תוך 60 שניות
                  </button>
                  <button
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    style={{
                      background: 'transparent', border: 'none',
                      color: '#374151', fontWeight: 600, fontSize: 16,
                      fontFamily: 'Heebo, sans-serif', cursor: 'pointer',
                      transition: 'color 0.2s', padding: '14px 4px',
                      minHeight: 44,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#111827'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#374151'; }}
                  >
                    איך זה עובד ←
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>ללא כרטיס אשראי • 14 יום ניסיון חינם • ביטול בכל עת</p>
              </div>

              <div
                className="atlas-hero-left"
                style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 40, paddingBottom: 40 }}
              >
                <div
                  className="atlas-main-float"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 20,
                    border: '1px solid #E8E8F0',
                    boxShadow: '0 24px 60px rgba(99,102,241,0.15), 0 8px 24px rgba(0,0,0,0.08)',
                    width: 320,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ height: 8, background: 'linear-gradient(90deg, #4F46E5, #7C3AED, #A78BFA)', width: '100%' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56', flexShrink: 0 }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E', flexShrink: 0 }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F', flexShrink: 0 }} />
                    <div style={{ flex: 1, background: '#EBEBEB', borderRadius: 4, height: 18, marginRight: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, color: '#9CA3AF' }}>atlas.app/dashboard</span>
                    </div>
                  </div>

                  <div style={{ padding: '16px 18px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="atlas-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
                        <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>פעיל</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>לוח בקרה · ATLAS</span>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.06))', borderRadius: 10, padding: '10px 14px', marginBottom: 14, border: '1px solid rgba(79,70,229,0.12)' }}>
                      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>הכנסה החודש</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.02em' }}>₪48,200</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600, background: '#D1FAE5', padding: '1px 6px', borderRadius: 999 }}>↑ 18%</span>
                        <span style={{ fontSize: 10, color: '#9CA3AF' }}>לעומת החודש שעבר</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                      {[
                        { label: 'הזמנות היום', value: '24', color: '#4F46E5', bg: 'rgba(79,70,229,0.07)' },
                        { label: 'אורחים פעילים', value: '183', color: '#F59E0B', bg: 'rgba(245,158,11,0.07)' },
                      ].map((s) => (
                        <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>{s.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: '#F8F8FC', borderRadius: 8, padding: '10px 10px 6px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 48, marginBottom: 4 }}>
                        {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: `${h}%`,
                              background: i === 3 ? 'linear-gradient(180deg, #4F46E5, #7C3AED)' : 'linear-gradient(180deg, #A5B4FC, #C4B5FD)',
                              borderRadius: '3px 3px 0 0',
                            }}
                          />
                        ))}
                      </div>
                      <p style={{ textAlign: 'center', fontSize: 10, color: '#9CA3AF', margin: 0 }}>תפוסה שבועית</p>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      {[
                        { name: 'משפחת לוי', room: 'חדר 12', status: 'מאושר', sbg: '#D1FAE5', sc: '#065F46' },
                        { name: 'דני כהן',    room: 'וילה 3', status: 'ממתין',  sbg: '#FEF3C7', sc: '#92400E' },
                      ].map((b) => (
                        <div
                          key={b.name}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 7, background: '#F9FAFB', marginBottom: 5 }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: b.sbg, color: b.sc }}>{b.status}</span>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{b.name}</div>
                            <div style={{ fontSize: 10, color: '#9CA3AF' }}>{b.room}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className="atlas-fc1"
                  style={{
                    position: 'absolute',
                    top: 10, left: -44,
                    background: 'white',
                    borderRadius: 14,
                    padding: '12px 16px',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    zIndex: 3,
                    display: 'flex', alignItems: 'center', gap: 10,
                    minWidth: 150,
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(79,70,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingUp size={18} strokeWidth={2} color="#4F46E5" aria-hidden />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#4F46E5', lineHeight: 1 }}>+62%</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>המרות</div>
                  </div>
                </div>

                <div
                  className="atlas-fc2"
                  style={{
                    position: 'absolute',
                    bottom: 60, left: -50,
                    background: 'white',
                    borderRadius: 14,
                    padding: '12px 16px',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    zIndex: 3,
                    display: 'flex', alignItems: 'center', gap: 10,
                    minWidth: 170,
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, color: '#059669', fontWeight: 700 }}>✓</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1 }}>מסירה תוך 14 יום</div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>מובטח</div>
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: 20, right: -44,
                    background: 'white',
                    borderRadius: 14,
                    padding: '12px 16px',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    zIndex: 3,
                    minWidth: 140,
                    animation: 'atlasFC3 4s ease-in-out 2.4s infinite',
                  }}
                >
                  <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: '#F59E0B', fontSize: 13 }}>★</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', lineHeight: 1 }}>5.0</div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>דירוג לקוחות</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SOCIAL PROOF STRIP
        ════════════════════════════════════════ */}
        <div
          style={{
            background: '#F9FAFB',
            borderTop: '1px solid #F3F4F6',
            borderBottom: '1px solid #F3F4F6',
            padding: '18px 0',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 10px' }}>
            <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>
              מצטרפים ל-500+ מנהלים שכבר עובדים חכם יותר:
            </span>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="atlas-marquee" style={{ display: 'flex', whiteSpace: 'nowrap' }}>
              {[MARQUEE_TEXT, MARQUEE_TEXT].map((t, i) => (
                <span key={i} style={{ color: '#374151', fontWeight: 600, fontSize: 15, paddingRight: 24, flexShrink: 0 }}>
                  {t}
                </span>
              ))}
              {[MARQUEE_TEXT, MARQUEE_TEXT].map((t, i) => (
                <span key={`b${i}`} aria-hidden style={{ color: '#374151', fontWeight: 600, fontSize: 15, paddingRight: 24, flexShrink: 0 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            SECTION A — מספרים שמדברים (Social Proof Numbers)
        ════════════════════════════════════════ */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1), transparent 50%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
            <div className="atlas-reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', margin: '0 0 12px', fontFamily: 'Heebo, sans-serif' }}>מספרים שמדברים</h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: 'Heebo, sans-serif' }}>מנהלי נכסים בכל הארץ כבר סומכים על ATLAS</p>
            </div>
            <div className="atlas-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
              {[
                { num: '50+', label: 'מתחמים בגרסת בטא', sub: 'בכל רחבי הארץ' },
                { num: '₪500K+', label: 'הכנסות מנוהלות', sub: 'בשנה האחרונה' },
                { num: '500+', label: 'הזמנות מנוהלות', sub: 'מסונכרנות אוטומטית' },
                { num: '98%', label: 'שביעות רצון', sub: 'של המשתמשים שלנו' },
              ].map((s, i) => (
                <div key={i} className="atlas-reveal" style={{ textAlign: 'center', padding: 24, background: 'rgba(255,255,255,0.15)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: 42, fontWeight: 900, color: 'white', lineHeight: 1.1, fontFamily: 'Heebo, sans-serif' }}>{s.num}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.95)', marginTop: 6, fontFamily: 'Heebo, sans-serif' }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontFamily: 'Heebo, sans-serif' }}>{s.sub}</div>
                </div>
              ))}
              <p className="atlas-reveal" style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: -16, fontFamily: 'Heebo, sans-serif' }}>
                נתוני גרסת הבטא — מעודכן מרץ 2025
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION 1 — THE TRANSFORMATION (ATLAS brand)
        ════════════════════════════════════════ */}
        <section ref={psSectionRef} style={{ padding: '120px 24px 140px', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 50%, #EEF2FF 100%)', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 980, margin: '0 auto' }}>
            <div className="atlas-reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
              <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, color: '#111827', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.15, fontFamily: 'Heebo, sans-serif' }}>
                מכירים את הכאוס הזה?
              </h2>
              <p style={{ fontSize: 19, color: '#6B7280', margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5, fontFamily: 'Heebo, sans-serif' }}>
                בלי מערכת — כלים מפוזרים, הודעות שלא נענו, הזמנות אבודות. עם ATLAS — הכל במקום אחד.
              </p>
            </div>

            {/* Auto-playing animation: chaos → converge → atlas */}
            <div
              className="atlas-reveal"
              style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', minHeight: 520,
                boxShadow: '0 8px 32px rgba(79,70,229,0.08), 0 24px 80px rgba(0,0,0,0.06)',
                border: '1px solid rgba(79,70,229,0.15)',
              }}
            >
              {/* Chaos — realistic app windows that converge to center */}
              <div
                style={{
                  position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #F1F5F9 0%, #E2E8F0 50%, #F8FAFC 100%)', zIndex: 1,
                  opacity: psPhase === 'chaos' || psPhase === 'unify' ? 1 : 0,
                  transition: 'opacity 0.95s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: psPhase === 'chaos' || psPhase === 'unify' ? 'auto' : 'none',
                }}
              >
                <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', fontSize: 14, color: '#64748B', fontWeight: 600, fontFamily: 'Heebo, sans-serif' }}>
                  כלים מפוזרים • אין סינכרון
                </div>
                {/* Excel — spreadsheet window */}
                <div className={`atlas-chaos-card ${psPhase === 'unify' ? 'atlas-converge' : ''}`} style={{ position: 'absolute', left: '8%', top: '14%', width: 165, height: 115, transform: 'rotate(-2deg)', zIndex: 3 }}>
                  <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '6px 10px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>{['#EF4444','#F59E0B','#22C55E'].map(c=><div key={c} style={{width:10,height:10,borderRadius:'50%',background:c}}/>)}</div>
                      <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>הזמנות.xlsx</span>
                    </div>
                    <div style={{ padding: 6, fontSize: 9, fontFamily: 'monospace' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '40px 50px 45px 50px', gap: 1 }}>
                        {['שם','תאריך','סכום','?'].map((h,i)=><div key={h} style={{background:'#F1F5F9',padding:'2px 4px',fontWeight:700,color:'#475569'}}>{h}</div>)}
                        {['???','12/03','???',''].map((c,i)=><div key={i} style={{padding:'2px 4px',color:'#94A3B8'}}>{c}</div>)}
                      </div>
                    </div>
                  </div>
                </div>
                {/* WhatsApp — chat window */}
                <div className={`atlas-chaos-card ${psPhase === 'unify' ? 'atlas-converge' : ''}`} style={{ position: 'absolute', left: '52%', top: '12%', width: 150, height: 110, transform: 'rotate(1.5deg)', zIndex: 4 }}>
                  <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '6px 10px', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, fontWeight: 600 }}>WhatsApp</span>
                      <span style={{ fontSize: 9, background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: 10 }}>27</span>
                    </div>
                    <div style={{ padding: 6 }}>
                      <div style={{ fontSize: 9, color: '#334155', background: '#F1F5F9', borderRadius: 6, padding: '4px 8px', marginBottom: 4 }}>מתי הצ׳ק-אין?</div>
                      <div style={{ fontSize: 9, color: '#334155', background: '#F1F5F9', borderRadius: 6, padding: '4px 8px' }}>שלחתי העברה...</div>
                    </div>
                  </div>
                </div>
                {/* Calendar — overlaps */}
                <div className={`atlas-chaos-card ${psPhase === 'unify' ? 'atlas-converge' : ''}`} style={{ position: 'absolute', left: '28%', top: '38%', width: 155, height: 105, transform: 'rotate(0.5deg)', zIndex: 2 }}>
                  <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '6px 10px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>{['#EF4444','#F59E0B','#22C55E'].map(c=><div key={c} style={{width:10,height:10,borderRadius:'50%',background:c}}/>)}</div>
                      <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>יומן</span>
                    </div>
                    <div style={{ padding: 6, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 3 }}>
                      {[...Array(10)].map((_,i)=><div key={i} style={{ height: 12, borderRadius: 3, background: [2,3,7].includes(i)?'#FECACA':'#E2E8F0' }}/>)}
                      <div style={{ gridColumn: '1/-1', fontSize: 8, color: '#DC2626', fontWeight: 700, textAlign: 'center' }}>הזמנות כפולות!</div>
                    </div>
                  </div>
                </div>
                {/* Email */}
                <div className={`atlas-chaos-card ${psPhase === 'unify' ? 'atlas-converge' : ''}`} style={{ position: 'absolute', left: '58%', top: '42%', width: 135, height: 90, transform: 'rotate(-1deg)', zIndex: 5 }}>
                  <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '6px 10px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>{['#EF4444','#F59E0B','#22C55E'].map(c=><div key={c} style={{width:10,height:10,borderRadius:'50%',background:c}}/>)}</div>
                      <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>אימייל</span>
                    </div>
                    <div style={{ padding: 8, fontSize: 9, color: '#94A3B8' }}>הזמנות אבודות בתיבה...</div>
                  </div>
                </div>
                {/* Payments */}
                <div className={`atlas-chaos-card ${psPhase === 'unify' ? 'atlas-converge' : ''}`} style={{ position: 'absolute', left: '12%', top: '48%', width: 140, height: 85, transform: 'rotate(1deg)', zIndex: 1 }}>
                  <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '6px 10px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>{['#EF4444','#F59E0B','#22C55E'].map(c=><div key={c} style={{width:10,height:10,borderRadius:'50%',background:c}}/>)}</div>
                      <span style={{ fontSize: 10, color: '#B91C1C', fontWeight: 600 }}>תשלומים</span>
                    </div>
                    <div style={{ padding: 8, fontSize: 9, color: '#DC2626', fontWeight: 600 }}>תשלומים באיחור</div>
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: '#334155', fontWeight: 700, fontFamily: 'Heebo, sans-serif' }}>בלי ATLAS</div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, fontFamily: 'Heebo, sans-serif', marginTop: 2 }}>אין מקום אחד. אין נראות.</div>
                </div>
              </div>

              {/* Unify — "נכנס ל..." overlay during converge */}
              <div
                style={{
                  position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: psPhase === 'unify' ? 1 : 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.75s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#4F46E5', fontFamily: 'Heebo, sans-serif', marginBottom: 6 }}>הכל נכנס ל</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#7C3AED', fontFamily: 'Heebo, sans-serif', letterSpacing: '-0.02em' }}>ATLAS</div>
                </div>
              </div>

              {/* Atlas — unified dashboard (emerges from center) */}
              <div
                style={{
                  position: 'absolute', inset: 0, zIndex: 3,
                  opacity: psPhase === 'atlas' ? 1 : 0,
                  transform: psPhase === 'atlas' ? 'scale(1)' : 'scale(0.6)',
                  transformOrigin: 'center center',
                  transition: 'opacity 1.25s cubic-bezier(0.25, 0.1, 0.25, 1), transform 1.25s cubic-bezier(0.34, 1.4, 0.64, 1)',
                  pointerEvents: psPhase === 'atlas' ? 'auto' : 'none',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%)', padding: '48px 56px' }}>
                  <div style={{ maxWidth: 420, margin: '0 auto' }}>
                    <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(79,70,229,0.08)', border: '1px solid #E0E7FF' }}>
                      <div dir="ltr" style={{ padding: '18px 22px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'linear-gradient(90deg, rgba(79,70,229,0.04), transparent)' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#4F46E5', fontFamily: 'Heebo, sans-serif' }}>ATLAS</span>
                        <IsraelDemoClock active={psPhase === 'atlas'} />
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>{[1,2,3].map(n=><div key={n} style={{width:8,height:8,borderRadius:'50%',background:n===3?'#4F46E5':n===2?'#F59E0B':'#EF4444'}}/>)}</div>
                      </div>
                      <div style={{ padding: 22 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
                          {[{v:'₪48,200',l:'הכנסות',c:'#4F46E5',bg:'#EEF2FF'},{v:'92%',l:'תפוסה',c:'#7C3AED',bg:'#F5F3FF'},{v:'23',l:'הזמנות',c:'#4F46E5',bg:'#EEF2FF'}].map(k=>(
                            <div key={k.l} style={{ background: k.bg, borderRadius: 10, padding: '14px 16px', textAlign: 'center', border: '1px solid rgba(79,70,229,0.15)' }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: k.c, fontFamily: 'Heebo, sans-serif' }}>{k.v}</div>
                              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, fontFamily: 'Heebo, sans-serif' }}>{k.l}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 52, marginBottom: 18 }}>
                          {[35,50,45,60,70,55,75,65,85,90,80,95].map((h,i)=>(
                            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0', background: `linear-gradient(180deg, rgba(79,70,229,${0.3+i*0.04}), rgba(124,58,237,${0.3+i*0.04}))` }}/>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #E5E7EB' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: 'Heebo, sans-serif' }}>דירת הגליל</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '4px 12px', borderRadius: 8, fontFamily: 'Heebo, sans-serif' }}>מאושר</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'linear-gradient(180deg, #EEF2FF, #E0E7FF)', borderRadius: 12, border: '1px solid #C7D2FE', boxShadow: '0 2px 12px rgba(79,70,229,0.1)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5', fontFamily: 'Heebo, sans-serif' }}>הזמנה חדשה התקבלה</div>
                        <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Heebo, sans-serif' }}>₪1,200 · דוד כ.</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', fontSize: 13, color: '#4F46E5', fontWeight: 700, fontFamily: 'Heebo, sans-serif' }}>
                    מערכת אחת. הכל במקום אחד.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="atlas-reveal atlas-delay-2" style={{ textAlign: 'center', marginTop: 56 }}>
              <p style={{ fontSize: 18, color: '#6B7280', marginBottom: 24, fontWeight: 500, fontFamily: 'Heebo, sans-serif' }}>תפסיקו לנהל בכאוס. תתחילו לנהל עם ATLAS.</p>
              <button
                onClick={() => { setDemoOpen(true); setDemoSlide(0); }}
                style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 12, padding: '14px 36px', fontWeight: 700, fontSize: 15, fontFamily: 'Heebo, sans-serif', cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,70,229,0.3)', transition: 'all 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                צפה בדמו חינם
              </button>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION 2 — BENTO FEATURES GRID
        ════════════════════════════════════════ */}
        <section id="features" className="atlas-features-section" style={{ padding: '80px 24px', background: '#F9FAFB', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="atlas-reveal atlas-features-intro" style={{ textAlign: 'center', marginBottom: 64 }}>
              <h2 className="atlas-section-title" style={{ fontSize: 40, fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>מערכת אחת. במקום 6 כלים שונים.</h2>
              <p className="atlas-features-lead" style={{ fontSize: 18, color: '#6B7280', margin: 0 }}>פלטפורמה אחת שמחליפה 6 כלים שונים</p>
            </div>

            {/* Bento grid — varied sizes */}
            <div className="atlas-bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'auto', gap: 16 }}>
              {/* LARGE — Bookings (spans 2 cols) */}
              <div className="atlas-feat-card atlas-reveal atlas-bento-large atlas-bento-hero-card" style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', border: '1px solid #C7D2FE', borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden', minHeight: 220 }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 48, height: 48, background: '#4F46E5', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 4px 16px rgba(79,70,229,0.25)' }}>
                    <Calendar size={24} color="white" />
                  </div>
                  <h3 className="atlas-bento-card-title" style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>ניהול הזמנות חכם</h3>
                  <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, margin: 0, maxWidth: 320 }}>קבל הזמנות מכל הערוצים במקום אחד. תצוגת לוח שנה חכמה עם סינכרון אוטומטי.</p>
                </div>
                {/* Mini calendar mockup — absolute on desktop; stacked on mobile (see CSS) */}
                <div className="atlas-bento-calendar-mock" style={{ position: 'absolute', bottom: 16, left: 16, background: 'white', borderRadius: 12, padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', width: 180 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
                    {['א','ב','ג','ד','ה','ו','ש'].map(d => <div key={d} style={{ fontSize: 8, color: '#9CA3AF', textAlign: 'center' }}>{d}</div>)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                    {[...Array(28)].map((_, i) => {
                      const booked = [2,3,4,8,9,10,15,16,17,18,22,23].includes(i);
                      return <div key={i} style={{ height: 14, borderRadius: 3, background: booked ? '#818CF8' : '#F3F4F6', fontSize: 7, color: booked ? 'white' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i+1}</div>;
                    })}
                  </div>
                </div>
              </div>

              {/* Payments */}
              <div className="atlas-feat-card atlas-reveal atlas-delay-1" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: 24 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(16,185,129,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <CreditCard size={22} color="#10B981" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>תשלומים חכמים</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: '0 0 12px' }}>גביה אוטומטית, חשבוניות דיגיטליות, מעקב יתרות.</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['₪', '₪₪', '₪₪₪'].map((c, i) => <div key={i} style={{ flex: 1, height: [16, 24, 32][i], background: `rgba(16,185,129,${0.2 + i * 0.15})`, borderRadius: 4 }} />)}
                </div>
              </div>

              {/* Leads */}
              <div className="atlas-feat-card atlas-reveal atlas-delay-2" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: 24 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(139,92,246,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Users size={22} color="#8B5CF6" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>ניהול לידים</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>פייפליין מכירות מלא — מליד ראשוני עד הזמנה מאושרת.</p>
              </div>

              {/* Cleaning */}
              <div className="atlas-feat-card atlas-reveal atlas-delay-3" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: 24 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(245,158,11,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <CheckSquare size={22} color="#F59E0B" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>ניהול ניקיון</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: '0 0 10px' }}>הקצאת משימות לצוות, צ'קליסטים, ועדכוני סטטוס.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {['חדר 12 — נוקה ✓', 'וילה 3 — בתהליך'].map((t, i) => (
                    <div key={i} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: i === 0 ? '#D1FAE5' : '#FEF3C7', color: i === 0 ? '#065F46' : '#92400E', fontWeight: 600 }}>{t}</div>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="atlas-feat-card atlas-reveal atlas-delay-4" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: 24 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(59,130,246,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <MessageSquare size={22} color="#3B82F6" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>תקשורת אוטומטית</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>הודעות אוטומטיות לפני צ'ק-אין, ביום עזיבה ובקשת ביקורת.</p>
              </div>

              {/* LARGE — Automations (spans 2 cols) */}
              <div className="atlas-feat-card atlas-reveal atlas-bento-large atlas-bento-auto-card" style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #FDF4FF, #FAE8FF)', border: '1px solid #E9D5FF', borderRadius: 20, padding: 28, overflow: 'hidden', position: 'relative', minHeight: 180 }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 48, height: 48, background: '#7C3AED', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 4px 16px rgba(124,58,237,0.25)' }}>
                    <Zap size={24} color="white" />
                  </div>
                  <h3 className="atlas-bento-card-title" style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>אוטומציות חכמות</h3>
                  <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, margin: 0, maxWidth: 340 }}>הגדר חוקים אוטומטיים — חסוך שעות עבודה כל שבוע. הודעות, משימות, תזכורות — הכל אוטומטי.</p>
                </div>
                <div className="atlas-bento-auto-mock" style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 6, width: 200 }}>
                  {['הודעת ברוכים הבאים', 'תזכורת תשלום', 'בקשת ביקורת'].map((r, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #E9D5FF' }}>
                      {r}
                      <div style={{ width: 24, height: 12, borderRadius: 6, background: '#7C3AED' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'white', margin: '1px 1px 1px auto', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accent cards row */}
              <div className="atlas-feat-card atlas-reveal" style={{ background: 'linear-gradient(135deg, #111827, #1F2937)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#4F46E5', marginBottom: 4, lineHeight: 1 }}>+3</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>שעות חסכון ביום</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>לכל מנהל מתחם</div>
              </div>

              {/* Contracts */}
              <div className="atlas-feat-card atlas-reveal atlas-delay-1" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: 24 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(79,70,229,0.10)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <FileText size={22} color="#4F46E5" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>חוזים דיגיטליים</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>שלח חוזים לחתימה דיגיטלית. עקוב אחר סטטוס.</p>
              </div>

              {/* Reports */}
              <div className="atlas-feat-card atlas-reveal atlas-delay-2" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: 24 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(236,72,153,0.10)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <BarChart2 size={22} color="#EC4899" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>דוחות ואנליטיקס</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>דוחות הכנסה, תפוסה ושביעות רצון בזמן אמת.</p>
              </div>

              {/* 24/7 accent */}
              <div className="atlas-feat-card atlas-reveal" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981', marginBottom: 8, animation: 'atlasDot 2s ease-in-out infinite', boxShadow: '0 0 12px rgba(16,185,129,0.5)' }} />
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 2 }}>24/7</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>פועל כל הזמן</div>
              </div>

              {/* Integrations */}
              <div className="atlas-feat-card atlas-reveal atlas-delay-3" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: 24 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(79,70,229,0.10)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <LinkIcon size={22} color="#4F46E5" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>אינטגרציות</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>מתחבר ל-Airbnb, Booking.com, WhatsApp, Stripe ועוד.</p>
              </div>

              {/* Invoices */}
              <div className="atlas-feat-card atlas-reveal atlas-delay-4" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: 24 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(234,179,8,0.10)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Receipt size={22} color="#EAB308" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>חשבוניות ומע"מ</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>הפקת חשבוניות עם מע"מ 17%, ייצוא PDF, חיבור לחשבנאות.</p>
              </div>

              {/* Reviews */}
              <div className="atlas-feat-card atlas-reveal atlas-delay-1" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: 24 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(245,158,11,0.10)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Star size={22} color="#F59E0B" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>ניהול ביקורות</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>עקוב אחר ביקורות בכל הפלטפורמות. שלח בקשות אוטומטיות.</p>
              </div>

              {/* Security */}
              <div className="atlas-feat-card atlas-reveal atlas-delay-2" style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: 24 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(16,185,129,0.10)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Shield size={22} color="#10B981" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>אבטחה ופרטיות</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>הצפנה מלאה, גיבויים אוטומטיים, עמידה בתקני GDPR.</p>
              </div>
            </div>

            {/* Comparison table — למה ATLAS ולא Guesty או Hostaway? */}
            <div className="atlas-reveal atlas-features-compare" style={{ marginTop: 80 }}>
              <h2 className="atlas-section-title atlas-features-compare-title" style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: '0 0 32px', textAlign: 'center' }}>למה ATLAS ולא Guesty או Hostaway?</h2>
              <div className="atlas-compare-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 16, border: '1px solid #E5E7EB', background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <table className="atlas-compare-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500, fontFamily: 'Heebo, sans-serif' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 700, color: '#111827', fontSize: 14 }}>פיצ'ר</th>
                      <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 800, color: '#4F46E5', fontSize: 14 }}>ATLAS</th>
                      <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: '#6B7280', fontSize: 14 }}>Guesty</th>
                      <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: '#6B7280', fontSize: 14 }}>Hostaway</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feat: 'שפה', atlas: 'עברית מלאה', g: 'אנגלית', h: 'אנגלית' },
                      { feat: 'מחיר', atlas: '₪399/חודש', g: '$200+/חודש', h: '$100+/נכס' },
                      { feat: 'תמיכה', atlas: 'ישראלית', g: 'גלובלית', h: 'גלובלית' },
                      { feat: 'WhatsApp', atlas: '✓', g: '✗', h: '✗' },
                      { feat: 'חשבוניות ישראליות', atlas: '✓', g: '✗', h: '✗' },
                      { feat: 'הגדרה', atlas: '5 דקות', g: 'שבועות', h: 'ימים' },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: i < 5 ? '1px solid #F3F4F6' : 'none' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 600, color: '#374151', fontSize: 14 }}>{row.feat}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700, color: '#4F46E5', fontSize: 14 }}>{row.atlas}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>{row.g}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>{row.h}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION 3 — HOW IT WORKS
        ════════════════════════════════════════ */}
        <section id="atlas-how" style={{ padding: '80px 24px', background: '#F9FAFB', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 28 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: 'center', marginBottom: 64 }}
            >
              <h2 className="atlas-section-title" style={{ fontSize: 40, fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>מתחילים תוך 5 דקות</h2>
              <p style={{ fontSize: 18, color: '#6B7280', margin: 0 }}>ללא הגדרות מסובכות, ללא צורך בטכנאי</p>
            </motion.div>

            <motion.div
              className="atlas-how-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: reducedMotion ? 0 : 0.12, delayChildren: reducedMotion ? 0 : 0.06 },
                },
              }}
            >
              {HOW_STEPS.map((step, i) => {
                const illustrations = [
                  <svg key="s1" viewBox="0 0 120 100" fill="none" style={{ width: '100%', height: 100 }}>
                    <rect x="20" y="10" width="80" height="80" rx="12" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5"/>
                    <rect x="32" y="30" width="56" height="10" rx="5" fill="#E0E7FF"/>
                    <rect x="32" y="46" width="56" height="10" rx="5" fill="#4F46E5" opacity="0.7"/>
                    <rect x="38" y="64" width="44" height="12" rx="6" fill="#4F46E5"/>
                    <text x="60" y="73" textAnchor="middle" fill="white" fontSize="7" fontWeight="700">הרשמה</text>
                    <circle cx="90" cy="20" r="8" fill="#10B981" opacity="0.2"/><path d="M87 20l2 2 4-4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>,
                  <svg key="s2" viewBox="0 0 120 100" fill="none" style={{ width: '100%', height: 100 }}>
                    <rect x="15" y="15" width="90" height="70" rx="12" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5"/>
                    <rect x="25" y="25" width="35" height="25" rx="6" fill="#C7D2FE"/>
                    <rect x="65" y="25" width="30" height="25" rx="6" fill="#A5B4FC"/>
                    <rect x="25" y="55" width="70" height="6" rx="3" fill="#E0E7FF"/>
                    <rect x="25" y="64" width="50" height="6" rx="3" fill="#E0E7FF"/>
                    <circle cx="95" cy="25" r="6" fill="#4F46E5"/><text x="95" y="28" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">+</text>
                  </svg>,
                  <svg key="s3" viewBox="0 0 120 100" fill="none" style={{ width: '100%', height: 100 }}>
                    <circle cx="60" cy="50" r="18" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="1.5"/>
                    <text x="60" y="54" textAnchor="middle" fill="#4F46E5" fontSize="10" fontWeight="800">A</text>
                    {[[20,30],[100,30],[20,70],[100,70]].map(([cx,cy], j) => (
                      <g key={j}><circle cx={cx} cy={cy} r="12" fill={['#FF5A5F','#003580','#25D366','#635BFF'][j]} opacity="0.15"/>
                      <circle cx={cx} cy={cy} r="8" fill={['#FF5A5F','#003580','#25D366','#635BFF'][j]}/>
                      <line x1={cx > 60 ? cx-12 : cx+12} y1={cy} x2={cx > 60 ? 78 : 42} y2="50" stroke="#C7D2FE" strokeWidth="1" strokeDasharray="3 2"/></g>
                    ))}
                  </svg>,
                  <svg key="s4" viewBox="0 0 120 100" fill="none" style={{ width: '100%', height: 100 }}>
                    <rect x="15" y="15" width="90" height="70" rx="12" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5"/>
                    <rect x="25" y="25" width="20" height="20" rx="6" fill="#D1FAE5"/><text x="35" y="38" textAnchor="middle" fill="#065F46" fontSize="7" fontWeight="700">₪</text>
                    <rect x="50" y="25" width="20" height="20" rx="6" fill="#DBEAFE"/><text x="60" y="38" textAnchor="middle" fill="#1D4ED8" fontSize="7" fontWeight="700">24</text>
                    <rect x="75" y="25" width="20" height="20" rx="6" fill="#FEF3C7"/><text x="85" y="38" textAnchor="middle" fill="#92400E" fontSize="7" fontWeight="700">★</text>
                    {[35,50,65,80,55,70].map((h, j) => (
                      <rect key={j} x={25 + j * 12} y={85 - h * 0.4} width="8" height={h * 0.4} rx="2" fill={`rgba(79,70,229,${0.3 + j * 0.12})`}/>
                    ))}
                  </svg>,
                ];
                return (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: reducedMotion
                        ? { opacity: 1, y: 0, scale: 1 }
                        : { opacity: 0, y: 32, scale: 0.96 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { type: 'spring', stiffness: 380, damping: 30, mass: 0.85 },
                      },
                    }}
                    whileHover={reducedMotion ? undefined : { y: -6, transition: { duration: 0.22 } }}
                    style={{
                      textAlign: 'center',
                      position: 'relative',
                      borderRadius: 20,
                      padding: '20px 16px 24px',
                      background: '#FFFFFF',
                      border: '1px solid rgba(79, 70, 229, 0.08)',
                      boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
                    }}
                  >
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                      <motion.div
                        style={{ width: 140, height: 100 }}
                        animate={reducedMotion ? false : { y: [0, -6, 0] }}
                        transition={reducedMotion ? undefined : {
                          duration: 3.2 + i * 0.35,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: i * 0.2,
                        }}
                      >
                        {illustrations[i]}
                      </motion.div>
                    </div>
                    <motion.div
                      initial={reducedMotion ? false : { scale: 0 }}
                      whileInView={reducedMotion ? undefined : { scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.05 + i * 0.08 }}
                      style={{
                        width: 40, height: 40, borderRadius: '50%', background: '#4F46E5', color: 'white',
                        fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 14px', boxShadow: '0 6px 20px rgba(79,70,229,0.25)',
                      }}
                    >{step.num}</motion.div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>{step.title}</h3>
                    <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{step.text}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION 4 — INTEGRATIONS (Infinite Marquee)
        ════════════════════════════════════════ */}
        <section className="atlas-int-marquee-section" style={{ padding: '3px 0', background: '#FFFFFF', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div className="atlas-reveal" style={{ textAlign: 'center', marginBottom: 14 }}>
              <h2 className="atlas-section-title atlas-int-marquee-title" style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '0 0 6px', lineHeight: 1.25 }}>מתחברים לכלים שאתם כבר משתמשים בהם</h2>
              <p className="atlas-section-sub" style={{ fontSize: 15, color: '#6B7280', margin: 0, lineHeight: 1.45 }}>Airbnb, Booking.com, WhatsApp, Stripe ועוד — הכל מסונכרן</p>
            </div>
          </div>

          {(() => {
            const allItems = INTEGRATION_ROWS.flatMap(r => r.items);
            const brandLogos = {
              'Airbnb': <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#FF5A5F" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.1c-.3.5-.7.8-1.2.8-.3 0-.5-.1-.8-.2-1.5-.8-2.7-2.2-3.5-3.5-.8 1.3-2 2.7-3.5 3.5-.3.2-.5.2-.8.2-.5 0-.9-.3-1.2-.8-.2-.4-.3-.8-.2-1.3.3-1.8 1.8-4.1 3.2-5.8C8.1 8.4 7 6.8 6.8 5.3c0-.5.1-.9.2-1.3.3-.5.7-.8 1.2-.8.3 0 .5.1.8.2C10.5 4.2 11.5 5.5 12 6.5c.5-1 1.5-2.3 3-3.1.3-.2.5-.2.8-.2.5 0 .9.3 1.2.8.2.4.3.8.2 1.3-.2 1.5-1.3 3.1-2.7 4.7 1.4 1.7 2.9 4 3.2 5.8.1.5 0 .9-.2 1.3z"/></svg>,
              'Booking.com': <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#003580" d="M2 2v20h20V2H2zm10.4 16H8.7v-1.2c-.8.9-1.8 1.4-3 1.4-1.1 0-2-.4-2.6-1.1-.6-.7-.9-1.6-.9-2.6 0-1.1.4-2 1.1-2.6.7-.6 1.7-.9 2.8-.9 1.1 0 2 .4 2.7 1.1V8.4h3.6V18zm7.3-3.8c0 1.2-.4 2.2-1.2 2.9-.8.7-1.9 1.1-3.2 1.1-1.3 0-2.3-.4-3.1-1.1-.8-.7-1.2-1.7-1.2-2.9 0-1.2.4-2.2 1.2-2.9.8-.7 1.9-1.1 3.1-1.1 1.3 0 2.4.4 3.2 1.1.8.7 1.2 1.7 1.2 2.9z"/></svg>,
              'Expedia': <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="12" fill="#FFC72C"/><path fill="#1a1a2e" d="M6 8h12v2H6V8zm2 4h8v2H8v-2zm3 4h2v2h-2v-2z"/></svg>,
              'VRBO': <svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="#175AEC"/><path fill="white" d="M4 14l4-8h2l-4 8H4zm4 0l4-8h2l-4 8H8zm8-8h2l-4 8h-2l4-8z"/></svg>,
              'HomeAway': <svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="#003b95"/><path fill="white" d="M12 5l-8 7h3v6h4v-4h2v4h4v-6h3L12 5z"/></svg>,
              'Stripe': <svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="#635BFF"/><path fill="white" d="M13 8.5c0-.83-.68-1.5-1.5-1.5H7v3h4c.55 0 1-.45 1-1v-.5zM7 12v4h2v-4H7zm4 0c.55 0 1-.45 1-1h-1v1zm0 0v4h2v-2.5c0-.83-.67-1.5-1.5-1.5H11zm4-4h2v8h-2V8z"/></svg>,
              'PayPal': <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#003087" d="M7.4 21.2l.5-3H6.2c-.2 0-.4-.2-.3-.4L8.7 3.6c0-.2.2-.3.4-.3h5.4c1.8 0 3.1.4 3.8 1.1.7.7.9 1.7.7 3-.3 1.7-1.1 3-2.4 3.7-1.2.7-2.8 1-4.7 1h-1.2c-.3 0-.6.3-.7.6l-.7 4.5-.2 1.3c0 .2-.2.4-.4.4H7.4z"/><path fill="#0070e0" d="M19.5 7.5c-.1.4-.2.9-.4 1.4-1 3.2-3.6 4.3-7.1 4.3h-1.8c-.4 0-.8.3-.9.7l-.9 5.9c0 .2.1.4.3.4h2.8c.4 0 .7-.3.8-.6l.6-4c.1-.4.4-.6.8-.6h.5c3.2 0 5.7-1.3 6.4-5 .3-1.6.1-2.8-.7-3.6-.1.3-.3.7-.4 1.1z"/></svg>,
              'Tranzila': <svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="#1a73e8"/><path fill="white" d="M7 7h10v2H13v8h-2V9H7V7z"/></svg>,
              'Cardcom': <svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="#f7941d"/><rect x="4" y="7" width="16" height="10" rx="2" fill="white"/><rect x="4" y="9" width="16" height="2.5" fill="#f7941d"/><rect x="6" y="13" width="5" height="1.5" rx=".5" fill="#f7941d" opacity=".5"/></svg>,
              'iCredit': <svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="#00a651"/><rect x="4" y="7" width="16" height="10" rx="2" fill="white"/><circle cx="16" cy="12" r="2" fill="#00a651"/><circle cx="14" cy="12" r="2" fill="#00a651" opacity=".6"/></svg>,
              'WhatsApp Business': <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#25D366" d="M12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.5 5.9L0 24l6.3-1.6c1.7.9 3.6 1.4 5.7 1.4 6.6 0 12-5.4 12-12S18.6 0 12 0zm0 22c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.5 15.8 2 13.9 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm5.4-7.5c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2.1-.3 0-.5s-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z"/></svg>,
              'Gmail': <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#EA4335" d="M1 6.5L12 13l11-6.5V4.2c0-1.2-1-2.2-2.2-2.2H3.2C2 2 1 3 1 4.2v2.3z"/><path fill="#4285F4" d="M1 8v11.8C1 21 2 22 3.2 22h2.3V11.5L1 8z"/><path fill="#34A853" d="M18.5 22h2.3c1.2 0 2.2-1 2.2-2.2V8l-4.5 3.5V22z"/><path fill="#FBBC05" d="M5.5 11.5V22h13V11.5L12 15 5.5 11.5z"/></svg>,
              'SMS': <svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="#6B7280"/><path fill="white" d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1h-4l-4 3v-3H4a1 1 0 01-1-1V6a1 1 0 011-1zm3 4h10v1.5H7V9zm0 3h6v1.5H7V12z"/></svg>,
              'Telegram': <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="12" fill="#2AABEE"/><path fill="white" d="M5.4 11.6l11.8-4.6c.5-.2 1 .1.8.8l-2 9.4c-.1.6-.5.7-1 .4l-2.8-2-1.3 1.3c-.1.2-.3.3-.5.3l.2-2.8 5-4.5c.2-.2 0-.3-.3-.1l-6.2 3.9-2.7-.8c-.6-.2-.6-.6.1-.8z"/></svg>,
              'חשבשבת': <svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="#2563eb"/><rect x="5" y="4" width="14" height="16" rx="1.5" fill="white"/><rect x="7" y="7" width="4" height="2" rx=".5" fill="#2563eb" opacity=".3"/><rect x="13" y="7" width="4" height="2" rx=".5" fill="#2563eb" opacity=".3"/><rect x="7" y="10.5" width="4" height="2" rx=".5" fill="#2563eb" opacity=".3"/><rect x="13" y="10.5" width="4" height="2" rx=".5" fill="#2563eb" opacity=".3"/><rect x="7" y="14" width="4" height="2" rx=".5" fill="#2563eb" opacity=".3"/><rect x="13" y="14" width="4" height="2" rx=".5" fill="#2563eb"/></svg>,
              'ירוקה': <svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="#16a34a"/><path fill="white" d="M12 4c-3.3 0-6 2.2-6 5 0 1.7 1 3.2 2.5 4.2L8 19l4-2 4 2-.5-5.8C17 12.2 18 10.7 18 9c0-2.8-2.7-5-6-5zm0 2c.8 0 1.5.3 2 .8l-2 2-2-2c.5-.5 1.2-.8 2-.8z"/></svg>,
              'Monday': <svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="white"/><circle cx="7" cy="15" r="2.5" fill="#FF3D57"/><circle cx="12" cy="11" r="2.5" fill="#FFB900"/><circle cx="17" cy="7" r="2.5" fill="#00CA72"/><path d="M7 8v5M12 6v3M17 12v-3" stroke="#FF3D57" strokeWidth="0" fill="none"/><rect x="5.5" y="7" width="3" height="6" rx="1.5" fill="#FF3D57"/><rect x="10.5" y="5" width="3" height="8" rx="1.5" fill="#FFB900"/><rect x="15.5" y="9" width="3" height="4" rx="1.5" fill="#00CA72"/></svg>,
              'Zapier': <svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="#FF4A00"/><path fill="white" d="M17 8.5h-4.4L17 12.6v1.9h-4.5V13h4.2l-4.2-4.1V7H17v1.5zM7 7h5v1.5H9.5l3.5 4v2H7v-1.5h3l-3-4V7z"/></svg>,
              'Google Calendar': <svg viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="2" width="20" height="20" rx="2.5" fill="white" stroke="#4285F4" strokeWidth="1.5"/><rect x="2" y="2" width="20" height="5.5" rx="2.5" fill="#4285F4"/><line x1="7" y1="1" x2="7" y2="4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/><line x1="17" y1="1" x2="17" y2="4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/><rect x="5.5" y="10" width="3" height="2.5" rx=".5" fill="#EA4335"/><rect x="10.5" y="10" width="3" height="2.5" rx=".5" fill="#34A853"/><rect x="15.5" y="10" width="3" height="2.5" rx=".5" fill="#FBBC05"/><rect x="5.5" y="14.5" width="3" height="2.5" rx=".5" fill="#4285F4"/><rect x="10.5" y="14.5" width="3" height="2.5" rx=".5" fill="#EA4335"/><rect x="15.5" y="14.5" width="3" height="2.5" rx=".5" fill="#34A853"/></svg>,
            };
            const renderBadge = (item, idx) => (
              <div key={`${item}-${idx}`} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 999, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, cursor: 'default', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {brandLogos[item] || <span style={{ fontSize: 12, fontWeight: 800 }}>{item[0]}</span>}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{item}</span>
              </div>
            );
            return (
              <div style={{ position: 'relative', marginTop: 4 }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 100, background: 'linear-gradient(to left, white, transparent)', zIndex: 2, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 100, background: 'linear-gradient(to right, white, transparent)', zIndex: 2, pointerEvents: 'none' }} />
                <div style={{ overflow: 'hidden', padding: '6px 0' }}>
                  <div className="atlas-int-track" style={{ gap: 14 }}>
                    {[...allItems, ...allItems].map((item, i) => renderBadge(item, i))}
                    {[...allItems, ...allItems].map((item, i) => renderBadge(item, i + allItems.length * 2))}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* ════════════════════════════════════════
            SECTION 5 — PRICING
        ════════════════════════════════════════ */}
        <section id="pricing" style={{ padding: '80px 24px', background: '#F9FAFB', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="atlas-reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 className="atlas-section-title" style={{ fontSize: 40, fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>תמחור פשוט ושקוף</h2>
              <p style={{ fontSize: 18, color: '#6B7280', margin: '0 0 32px' }}>ללא עמלות מוסתרות. ללא הפתעות.</p>

              {/* Billing toggle */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'white', borderRadius: 999, padding: '6px 8px', border: '1px solid #E5E7EB' }}>
                <button
                  onClick={() => setBillingYearly(false)}
                  style={{
                    background: !billingYearly ? '#111827' : 'transparent',
                    color: !billingYearly ? 'white' : '#6B7280',
                    border: 'none', borderRadius: 999,
                    padding: '8px 20px', fontWeight: 600, fontSize: 14,
                    fontFamily: 'Heebo, sans-serif', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  חודשי
                </button>
                <button
                  onClick={() => setBillingYearly(true)}
                  style={{
                    background: billingYearly ? '#111827' : 'transparent',
                    color: billingYearly ? 'white' : '#6B7280',
                    border: 'none', borderRadius: 999,
                    padding: '8px 20px', fontWeight: 600, fontSize: 14,
                    fontFamily: 'Heebo, sans-serif', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  שנתי (חסוך 20%)
                </button>
              </div>
            </div>

            <div className="atlas-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'start' }}>
              {PRICING_PLANS.map((plan, i) => (
                <div
                  key={i}
                  className={`atlas-pricing-card atlas-reveal atlas-delay-${i + 1}`}
                  style={{
                    background: '#FFFFFF',
                    border: plan.featured ? '2px solid #4F46E5' : '1px solid #F3F4F6',
                    borderRadius: 20,
                    boxShadow: plan.featured
                      ? '0 12px 48px rgba(79,70,229,0.15), 0 4px 12px rgba(0,0,0,0.06)'
                      : '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
                    padding: 32,
                    position: 'relative',
                    ...(plan.featured ? { transform: 'scale(1.03)' } : {}),
                  }}
                >
                  {plan.featured && (
                    <div style={{
                      position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                      background: '#4F46E5', color: 'white', fontSize: 12, fontWeight: 700,
                      padding: '4px 16px', borderRadius: 999,
                    }}>
                      הכי פופולרי
                    </div>
                  )}
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>{plan.name}</h3>
                  {billingYearly && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#D1FAE5', color: '#065F46', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, marginBottom: 8 }}>
                      חסוך 20%
                    </div>
                  )}
                  <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 20px' }}>{plan.desc}</p>
                  <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 42, fontWeight: 900, color: '#111827' }}><AnimatedPrice value={billingYearly ? plan.yearlyPrice : plan.monthlyPrice} /></span>
                    <span style={{ fontSize: 16, color: '#6B7280' }}>/חודש</span>
                  </div>

                  {plan.isBusiness ? (
                    <a
                      href="https://wa.me/972545380085?text=מעוניין%20בחבילת%20עסקי"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '100%',
                        background: '#25D366',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        padding: '14px 0',
                        fontWeight: 700,
                        fontSize: 16,
                        fontFamily: 'Heebo, sans-serif',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        marginBottom: 24,
                        display: 'block',
                        textAlign: 'center',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {plan.cta}
                    </a>
                  ) : (
                    <button
                      onClick={goToRegister}
                      style={{
                        width: '100%',
                        background: plan.featured ? '#4F46E5' : '#111827',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        padding: '14px 0',
                        fontWeight: 700,
                        fontSize: 16,
                        fontFamily: 'Heebo, sans-serif',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        marginBottom: 24,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {plan.cta}
                    </button>
                  )}

                  <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 20 }}>
                    {plan.included.map((item, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ color: '#10B981', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: 14, color: '#374151' }}>{item}</span>
                      </div>
                    ))}
                    {plan.excluded.map((item, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ color: '#D1D5DB', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>✗</span>
                        <span style={{ fontSize: 14, color: '#6B7280' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="atlas-reveal" style={{ textAlign: 'center', fontSize: 14, color: '#6B7280', marginTop: 40 }}>
              כל החבילות כוללות: ניסיון חינם 14 יום • ללא כרטיס אשראי • ביטול בכל עת • תמיכה בעברית
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION 6 — TESTIMONIALS (Premium Cards)
        ════════════════════════════════════════ */}
        <section id="testimonials" style={{ padding: '80px 24px', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%)', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="atlas-reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF3C7', borderRadius: 999, padding: '6px 16px', marginBottom: 16 }}>
                <span style={{ color: '#F59E0B', fontSize: 14 }}>★★★★★</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>5.0 — דירוג ממוצע</span>
              </div>
              <h2 className="atlas-section-title" style={{ fontSize: 40, fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>מנהלי מתחמים מספרים</h2>
              <p className="atlas-section-sub" style={{ fontSize: 18, color: '#6B7280', margin: 0 }}>הסיפורים האמיתיים של מי שכבר עובד עם ATLAS</p>
            </div>

            {/* Featured testimonial */}
            <div className="atlas-reveal atlas-feat-testi" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 24, padding: '40px 44px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 20, opacity: 0.4 }}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" fill="white"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="white"/></svg>
              <p style={{ fontSize: 22, color: 'white', lineHeight: 1.7, margin: '0 0 24px', fontWeight: 500, maxWidth: 700 }}>
                "ATLAS חסכה לי 3 שעות עבודה כל יום. ההזמנות מסודרות, התשלומים אוטומטיים והצוות יודע מה לעשות. לא מאמין שניהלתי את הכל עם Excel עד עכשיו."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img src={NEW_TESTIMONIALS[0].avatar} alt={`${NEW_TESTIMONIALS[0].author} — ${NEW_TESTIMONIALS[0].role}`} loading="lazy" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: 16 }}>{NEW_TESTIMONIALS[0].author}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{NEW_TESTIMONIALS[0].role}</div>
                </div>
                <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>ביקורת מאומתת ✓</span>
                  <div style={{ display: 'flex', gap: 1 }}>
                    {[...Array(5)].map((_, j) => <span key={j} style={{ color: j < NEW_TESTIMONIALS[0].rating ? '#FCD34D' : 'rgba(255,255,255,0.3)', fontSize: 16 }}>★</span>)}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid of remaining testimonials */}
            <div className="atlas-testi-grid-new" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {NEW_TESTIMONIALS.slice(1).map((t, i) => (
                <div
                  key={i}
                  className={`atlas-reveal atlas-delay-${(i % 3) + 1}`}
                  style={{
                    background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: 20, padding: 28,
                    transition: 'all 0.25s ease', cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(79,70,229,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={t.avatar} alt={`${t.author} — ${t.role}`} loading="lazy" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>{t.author}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{t.role}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: '#D1FAE5', color: '#065F46', padding: '2px 6px', borderRadius: 999, fontSize: 10, fontWeight: 600 }}>ביקורת מאומתת ✓</span>
                      <div style={{ display: 'flex', gap: 1 }}>
                        {[1,2,3,4,5].map((j) => <span key={j} style={{ color: j <= t.rating ? '#F59E0B' : '#D1D5DB', fontSize: 13 }}>★</span>)}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: 0 }}>"{t.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION B — למה דווקא ATLAS? (Extra Trust)
        ════════════════════════════════════════ */}
        <section style={{ padding: '80px 24px', background: '#FAFAFA', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div className="atlas-reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 className="atlas-section-title" style={{ fontSize: 40, fontWeight: 800, color: '#111827', margin: '0 0 12px', fontFamily: 'Heebo, sans-serif' }}>למה דווקא ATLAS?</h2>
              <p className="atlas-section-sub" style={{ fontSize: 16, color: '#6B7280', margin: 0, fontFamily: 'Heebo, sans-serif' }}>כי אנחנו יודעים מה מנהלי נכסים באמת צריכים</p>
            </div>
            <div className="atlas-why-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { title: 'בנוי לשוק הישראלי', desc: 'עברית מלאה, RTL, חשבוניות ישראליות, שערי תשלום מקומיים — הכל מותאם לישראל.', color: '#4F46E5', iconPath: 'M3 21V5a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M12 10v4 M10 12h4' },
                { title: 'הקמה תוך 5 דקות', desc: 'אין צורך בידע טכני. נרשמים, מוסיפים נכס, ומתחילים לעבוד.', color: '#10B981', iconPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
                { title: 'מחובר לכל הכלים', desc: 'Airbnb, Booking.com, WhatsApp, Stripe — כל האינטגרציות במקום אחד.', color: '#8B5CF6', iconPath: 'M15 7h2a5 5 0 0 1 0 10h-2 M9 17H7A5 5 0 0 1 7 7h2 M8 12h8' },
                { title: 'אוטומציות חכמות', desc: 'הודעות אוטומטיות, עדכוני סטטוס, תזכורות — המערכת עובדת בשבילך 24/7.', color: '#F59E0B', iconPath: 'M12 6V2 M16.24 7.76l2.83-2.83 M18 12h4 M16.24 16.24l2.83 2.83 M12 18v4 M7.76 16.24l-2.83 2.83 M6 12H2 M7.76 7.76L4.93 4.93' },
                { title: 'דוחות בזמן אמת', desc: 'הכנסות, תפוסה, ביצועים — כל המספרים שאתה צריך, בלחיצה אחת.', color: '#EC4899', iconPath: 'M18 20V10 M12 20V4 M6 20v-6' },
                { title: 'אבטחה ופרטיות', desc: 'הנתונים שלך מוגנים בהצפנה מתקדמת. תואם GDPR ותקנות ישראליות.', color: '#06B6D4', iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
              ].map((item, i) => (
                <div key={i} className="atlas-reveal" style={{ background: 'white', borderRadius: 16, padding: '28px 28px', border: '1px solid #F3F4F6', transition: 'all 0.2s ease', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.iconPath} /></svg>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px', fontFamily: 'Heebo, sans-serif' }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6, fontFamily: 'Heebo, sans-serif' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION 7 — FAQ
        ════════════════════════════════════════ */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, #F9FAFB 0%, #FFFFFF 100%)', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
          {/* Decorative background elements */}
          <div style={{ position: 'absolute', top: 60, right: -120, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 40, left: -80, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,209,193,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
            <div className="atlas-reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', padding: '6px 16px', borderRadius: 999, marginBottom: 16 }}>
                <MessageCircle size={15} strokeWidth={2.25} color="#4338CA" aria-hidden />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#4338CA' }}>יש שאלות? יש תשובות</span>
              </div>
              <h2 className="atlas-section-title" style={{ fontSize: 40, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>שאלות נפוצות</h2>
              <p style={{ fontSize: 17, color: '#6B7280', margin: 0 }}>כל מה שצריך לדעת לפני שמתחילים</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FAQ_DATA.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    className={`atlas-faq-item ${isOpen ? 'atlas-faq-item--active' : ''}`}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 16,
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <button
                      onClick={() => toggleFaq(i)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '20px 24px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'Heebo, sans-serif',
                        textAlign: 'right',
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isOpen ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : '#F3F4F6',
                        transition: 'all 0.3s ease',
                        boxShadow: isOpen ? '0 2px 8px rgba(79,70,229,0.3)' : 'none',
                      }}>
                        <span style={{
                          fontSize: 13, fontWeight: 800,
                          color: isOpen ? 'white' : '#9CA3AF',
                          transition: 'color 0.3s ease',
                          lineHeight: 1,
                        }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', flex: 1, lineHeight: 1.5 }}>{faq.q}</span>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isOpen ? '#EEF2FF' : '#F9FAFB',
                        transition: 'all 0.3s ease',
                      }}>
                        <ChevronDown
                          size={16}
                          color={isOpen ? '#4F46E5' : '#9CA3AF'}
                          style={{
                            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), color 0.3s ease',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                      </div>
                    </button>
                    <div
                      style={{
                        display: isOpen ? 'block' : 'none',
                        borderTop: '1px solid #F3F4F6',
                        padding: '16px 24px 20px',
                        background: '#FFFFFF',
                      }}
                    >
                      <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, margin: 0 }}>{faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA below FAQ */}
            <div className="atlas-reveal" style={{ textAlign: 'center', marginTop: 48 }}>
              <p style={{ fontSize: 15, color: '#9CA3AF', marginBottom: 12 }}>לא מצאת תשובה?</p>
              <Link
                to="/contact"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  padding: '12px 28px', borderRadius: 12,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(79,70,229,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.25)'; }}
              >
                דברו איתנו
                <ChevronLeft size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION 8 — FINAL CTA
        ════════════════════════════════════════ */}
        <section
          style={{
            background: '#4F46E5',
            padding: '80px 24px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ maxWidth: 700, margin: '0 auto' }} className="atlas-reveal">
            <h2
              style={{
                fontSize: 'clamp(36px, 5vw, 52px)',
                fontWeight: 900,
                color: 'white',
                margin: '0 0 12px',
              }}
            >
              עדיין מנהל עם Excel ו-WhatsApp? הגיע הזמן לשדרג.
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.80)', margin: '12px 0 40px' }}>
              הצטרף ל-500+ מנהלים שכבר עובדים עם ATLAS
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <button
                onClick={goToRegister}
                style={{
                  background: 'white',
                  color: '#4F46E5',
                  border: 'none',
                  borderRadius: 10,
                  padding: '15px 32px',
                  fontWeight: 700,
                  fontSize: 17,
                  fontFamily: 'Heebo, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                התחל 14 יום חינם ←
              </button>
              <a
                href="https://wa.me/972545380085?text=מעוניין%20בדמו%20אישי%20של%20ATLAS"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  padding: '13px 28px',
                  minHeight: 50,
                  fontWeight: 700,
                  fontSize: 16,
                  fontFamily: 'Heebo, sans-serif',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
              >
                <MessageCircle size={18} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />
                קבע דמו אישי ב-WhatsApp
              </a>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', marginTop: 20 }}>
              ללא כרטיס אשראי • ביטול בכל עת • תמיכה בעברית 24/7
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════
            NEWSLETTER SIGNUP
        ════════════════════════════════════════ */}
        <NewsletterSection />

        {/* ════════════════════════════════════════
            SECTION 9 — FOOTER
        ════════════════════════════════════════ */}
        <footer
          style={{
            background: '#111827',
            padding: '64px 24px 0',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div
              className="atlas-footer-grid-new"
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}
            >
              {/* Brand */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                  <img
                    src="/atlas-logo-final.png"
                    alt="ATLAS — מערכת ניהול מתחמי נופש"
                    loading="lazy"
                    style={{
                      height: 44,
                      width: 'auto',
                      objectFit: 'contain',
                      display: 'block',
                      filter: 'brightness(0) invert(1)',
                    }}
                  />
                </div>
                <p style={{ fontSize: 15, color: '#9CA3AF', margin: '0 0 20px' }}>ניהול מתחמי נופש — פשוט יותר.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { name: 'Instagram', href: 'https://instagram.com', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
                    { name: 'LinkedIn', href: 'https://linkedin.com', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                    { name: 'Facebook', href: 'https://facebook.com', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                    { name: 'Twitter', href: 'https://x.com', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                  ].map((s) => (
                    <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                      style={{
                        width: 36, height: 36,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#9CA3AF',
                        cursor: 'pointer',
                        transition: 'background 0.2s, color 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#9CA3AF'; }}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* מוצר */}
              <div>
                <h4 style={{ fontWeight: 700, color: 'white', fontSize: 14, marginBottom: 18, marginTop: 0 }}>מוצר</h4>
                {[
                  { label: 'תכונות', href: '#features', scroll: true },
                  { label: 'מחירים', href: '#pricing', scroll: true },
                  { label: 'אינטגרציות', href: '#features', scroll: true },
                  { label: 'עדכונים', to: '/changelog' },
                  { label: 'דמו', href: '#', onClick: () => { setDemoOpen(true); setDemoSlide(0); } },
                ].map((l) => (
                  <div key={l.label} style={{ marginBottom: 12 }}>
                    {l.to ? (
                      <Link to={l.to} style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                      >{l.label}</Link>
                    ) : l.onClick ? (
                      <a href="#" onClick={(e) => { e.preventDefault(); l.onClick(); }} style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                      >{l.label}</a>
                    ) : l.to ? (
                      <Link to={l.to} style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                      >{l.label}</Link>
                    ) : l.scroll ? (
                      <a href={l.href} onClick={(e) => { e.preventDefault(); document.getElementById(l.href.slice(1))?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                      >{l.label}</a>
                    ) : (
                      <a href={l.href} style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                      >{l.label}</a>
                    )}
                  </div>
                ))}
              </div>

              {/* חברה */}
              <div>
                <h4 style={{ fontWeight: 700, color: 'white', fontSize: 14, marginBottom: 18, marginTop: 0 }}>חברה</h4>
                {[
                  { label: 'אודות', to: '/about' },
                  { label: 'צור קשר', to: '/contact' },
                  { label: 'אודות', to: '/about' },
                  { label: 'עדכונים', to: '/changelog' },
                  { label: 'סטטוס', to: '/status' },
                ].map((l) => (
                  <div key={l.label} style={{ marginBottom: 12 }}>
                    {l.to ? (
                      <Link to={l.to} style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                      >{l.label}</Link>
                    ) : (
                      <a href={l.href} style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                      >{l.label}</a>
                    )}
                  </div>
                ))}
              </div>

              {/* תמיכה */}
              <div>
                <h4 style={{ fontWeight: 700, color: 'white', fontSize: 14, marginBottom: 18, marginTop: 0 }}>תמיכה</h4>
                {[
                  { label: 'מרכז עזרה', to: '/contact' },
                  { label: 'תיעוד API', to: '/api-docs' },
                  { label: 'סטטוס מערכת', to: '/status' },
                  { label: 'אבטחת מידע', to: '/data-security' },
                  { label: 'פרטיות', to: '/privacy' },
                  { label: 'תנאי שימוש', to: '/terms' },
                  { label: 'נגישות', to: '/accessibility' },
                ].map((l) => (
                  <div key={l.label} style={{ marginBottom: 12 }}>
                    <Link to={l.to} style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                    >{l.label}</Link>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>© 2025 ATLAS. כל הזכויות שמורות.</p>
              <a href="mailto:hello@atlas.app" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
              >hello@atlas.app</a>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>פותח בישראל</p>
            </div>
          </div>
        </footer>

        {/* ════════════════════════════════════════
            DEMO MODAL
        ════════════════════════════════════════ */}
        {demoOpen && (
          <div
            className="atlas-demo-overlay"
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.80)',
              zIndex: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setDemoOpen(false); }}
          >
            <div
              className="atlas-demo-modal"
              style={{
                background: 'white',
                borderRadius: 20,
                maxWidth: 800,
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
              }}
              dir="rtl"
            >
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #F3F4F6' }}>
                <button
                  onClick={() => setDemoOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
                >
                  <X size={22} color="#6B7280" />
                </button>

                {/* Progress dots */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {[0, 1, 2, 3, 4].map((d) => (
                    <div
                      key={d}
                      onClick={() => setDemoSlide(d)}
                      style={{
                        width: demoSlide === d ? 24 : 8, height: 8,
                        borderRadius: 4,
                        background: demoSlide === d ? '#4F46E5' : '#E5E7EB',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>

                <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500, minWidth: 40, textAlign: 'center' }}>
                  {demoSlide + 1} / 5
                </span>
              </div>

              {/* Slide content */}
              <div style={{ padding: '24px 24px 16px' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 20px', textAlign: 'center' }}>
                  {DEMO_SLIDES[demoSlide].title}
                </h3>
                <div className="atlas-demo-slide-mockup">
                  {renderDemoSlide(demoSlide)}
                </div>
              </div>

              {/* צפה בדמו המלא CTA */}
              <div style={{ textAlign: 'center', padding: '0 24px 16px' }}>
                <a
                  href="https://wa.me/972545380085?text=מעוניין%20בדמו%20מלא%20של%20ATLAS"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#25D366', color: 'white', padding: '12px 24px',
                    borderRadius: 10, fontWeight: 700, fontSize: 15,
                    textDecoration: 'none', fontFamily: 'Heebo, sans-serif',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  צפה בדמו המלא
                </a>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 24px' }}>
                <button
                  onClick={prevSlide}
                  disabled={demoSlide === 0}
                  style={{
                    background: demoSlide === 0 ? '#F3F4F6' : '#111827',
                    color: demoSlide === 0 ? '#9CA3AF' : 'white',
                    border: 'none', borderRadius: 10,
                    padding: '10px 20px',
                    fontWeight: 600, fontSize: 14,
                    fontFamily: 'Heebo, sans-serif',
                    cursor: demoSlide === 0 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  הקודם <ChevronRight size={16} />
                </button>
                <button
                  onClick={demoSlide === 4 ? () => setDemoOpen(false) : nextSlide}
                  style={{
                    background: '#4F46E5',
                    color: 'white',
                    border: 'none', borderRadius: 10,
                    padding: '10px 20px',
                    fontWeight: 600, fontSize: 14,
                    fontFamily: 'Heebo, sans-serif',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronLeft size={16} /> {demoSlide === 4 ? 'סיום' : 'הבא'}
                </button>
              </div>
            </div>
          </div>
        )}

      <SupportChat autoOpenAfterMs={30000} />
      <CookieConsent />
      </div>
    </>
  );
}
