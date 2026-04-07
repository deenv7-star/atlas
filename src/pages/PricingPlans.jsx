import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, X, TrendingUp } from 'lucide-react';

const PLANS = [
  {
    name: 'בסיסית',
    tag: 'להתחלה',
    priceMonthly: 299,
    priceYearly: 2990,
    blurb: 'צימר בודד או נכס ראשון — כל מה שצריך לנהל הזמנות ולידים.',
    cta: 'התחילו',
    highlight: false,
    features: [
      { label: 'לוח שנה וניהול הזמנות', ok: true },
      { label: 'לידים והודעות בסיסיות', ok: true },
      { label: 'אינטגרציית יומן אחת', ok: true },
      { label: 'דוחות מתקדמים ו-BI', ok: false },
      { label: 'מנהל חשבון ייעודי', ok: false },
      { label: 'SLA מורחב וזמינות', ok: false },
    ],
  },
  {
    name: 'מתקדמת',
    tag: 'הכי פופולרית',
    priceMonthly: 599,
    priceYearly: 5990,
    blurb: 'מספר נכסים, תשלומים, חשבוניות ואוטומציות — רוב המתחמים בישראל.',
    cta: 'בחרו במתקדמת',
    highlight: true,
    features: [
      { label: 'כל מה שבבסיסית', ok: true },
      { label: 'תשלומים, חשבוניות, חוזים', ok: true },
      { label: 'מספר אינטגרציות וערוצים', ok: true },
      { label: 'אוטומציות והודעות', ok: true },
      { label: 'דוחות בעלים ותובנות', ok: true },
      { label: 'מנהל חשבון ייעודי', ok: false },
    ],
  },
  {
    name: 'Enterprise',
    tag: 'ארגונים',
    priceMonthly: null,
    priceYearly: null,
    enterpriseFromMonthly: 2400,
    blurb: 'שרשרות נכסים, צוותים גדולים, דרישות אבטחה ותמחור מותאם.',
    cta: 'צרו קשר',
    highlight: false,
    features: [
      { label: 'כל מה שבמתקדמת', ok: true },
      { label: 'SSO, הרשאות מתקדמות', ok: true },
      { label: 'ייעוץ אינטגרציה ו-API', ok: true },
      { label: 'SLA מוגדר חוזית', ok: true },
      { label: 'מנהל הצלחה ייעודי', ok: true },
      { label: 'סביבת בדיקות / Staging', ok: true },
    ],
  },
];

function PricingRoiCalculator() {
  const [properties, setProperties] = useState(3);
  const [hourlyRate, setHourlyRate] = useState(90);

  const { weeklyHours, annualValue, suggestedPlan, annualPlanCost, netAnnual, note } = useMemo(() => {
    const n = Math.min(50, Math.max(1, properties));
    const weekly = Math.round(Math.min(40, 5 + n * 2.3));
    const annual = Math.round(weekly * hourlyRate * 52);
    let planName = 'בסיסית';
    let monthly = 299;
    if (n >= 9) {
      planName = 'Enterprise (הערכה)';
      monthly = null;
    } else if (n >= 4) {
      planName = 'מתקדמת';
      monthly = 599;
    }
    const planAnnual = monthly != null ? monthly * 12 : null;
    const net = planAnnual != null ? annual - planAnnual : null;
    let hint = '';
    if (n >= 9) {
      hint = 'למספר נכסים גבוה — תמחור לפי נפח ו-SLA; צרו קשר לאומדן מדויק.';
    }
    return {
      weeklyHours: weekly,
      annualValue: annual,
      suggestedPlan: planName,
      annualPlanCost: planAnnual,
      netAnnual: net,
      note: hint,
    };
  }, [properties, hourlyRate]);

  return (
    <section className="max-w-3xl mx-auto mt-14 mb-4 rounded-2xl border border-[#00D1C1]/25 bg-gradient-to-br from-teal-50/80 to-white p-6 md:p-8 text-right shadow-sm" aria-labelledby="roi-calculator-title">
      <div className="flex items-center gap-2 mb-2 text-[#0a7c72]">
        <TrendingUp className="w-5 h-5 shrink-0" aria-hidden />
        <h2 id="roi-calculator-title" className="text-xl font-extrabold text-gray-900">
          מחשבון חיסכון (אומדן שנתי)
        </h2>
      </div>
      <p className="text-gray-600 text-base leading-relaxed mb-6">
        הזיזו את מספר הנכסים ואת עלות השעה שלכם — נראה כמה זמן ניהול ידני (הזמנות, תשלומים, לידים, תיאומים)
        אתם עשויים לחסוך לעומת ריכוז הכל במערכת אחת.{' '}
        <strong className="text-gray-800">המספרים להמחשה בלבד</strong> ואינם התחייבות.
      </p>

      <div className="space-y-5">
        <div>
          <Label htmlFor="roi-properties" className="text-gray-800 font-semibold">
            כמה נכסים אתם מנהלים? ({properties})
          </Label>
          <input
            id="roi-properties"
            type="range"
            min={1}
            max={25}
            value={Math.min(25, properties)}
            onChange={(e) => setProperties(Number(e.target.value))}
            className="w-full mt-2 h-2 accent-[#00D1C1] cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>25+</span>
          </div>
        </div>
        <div>
          <Label htmlFor="roi-rate" className="text-gray-800 font-semibold">
            עלות שעה משוערת (₪) — ניהול / תפעול
          </Label>
          <input
            id="roi-rate"
            type="number"
            min={50}
            max={400}
            step={5}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
            className="mt-2 w-full max-w-[200px] rounded-xl border border-gray-200 px-3 py-2 text-base text-right"
          />
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white border border-gray-100 p-4">
          <p className="text-sm text-gray-500">שעות ניהול משוערות שנחסכות בשבוע</p>
          <p className="text-2xl font-black text-gray-900 tabular-nums mt-1">{weeklyHours}</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-4">
          <p className="text-sm text-gray-500">שווי זמן שנתי משוער (לפי השעה שהזנתם)</p>
          <p className="text-2xl font-black text-[#0a7c72] tabular-nums mt-1">₪{annualValue.toLocaleString('he-IL')}</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-4 sm:col-span-2">
          <p className="text-sm text-gray-500">חבילה מתאימה (המלצה גסה)</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{suggestedPlan}</p>
          {annualPlanCost != null && netAnnual != null && (
            <p className="text-base text-gray-600 mt-2 leading-relaxed">
              עלות משוערת לתוכנית ({Math.round(annualPlanCost / 12)} ₪/חודש × 12):{' '}
              <span className="font-semibold tabular-nums">₪{annualPlanCost.toLocaleString('he-IL')}</span>
              {' · '}
              <span className="text-[#0a7c72] font-bold">
                הפרש משוער לשנה: ₪{netAnnual.toLocaleString('he-IL')}
              </span>
            </p>
          )}
          {note && <p className="text-sm text-amber-800 mt-2">{note}</p>}
        </div>
      </div>
    </section>
  );
}

export default function PricingPlans() {
  return (
    <div dir="rtl" className="min-h-screen bg-white text-base" style={{ fontFamily: "'Heebo', sans-serif" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/">
            <img src="/atlas-logo-final.png" alt="ATLAS" className="h-9" />
          </Link>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link to="/register">
              <Button size="sm" className="font-bold bg-[#00D1C1] text-[#0B1220] hover:bg-[#00c4b4] shadow-sm">
                14 יום חינם
              </Button>
            </Link>
            <Link to={createPageUrl('HowItWorks')}>
              <Button variant="ghost" size="sm">איך זה עובד</Button>
            </Link>
            <Link to={createPageUrl('Landing')}>
              <Button variant="outline" size="sm">דף הבית</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main id="main" className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">תוכניות ותמחור</h1>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed text-base">
            השוואה מהירה בין חבילות, מחשבון חיסכון משוער, ושקיפות לגבי ניסיון ו-Enterprise.
            המחירים להמחשה — בפועל ייתכנו מבצעים, שנתיות ומותאם ארגון.{' '}
            <Link to="/contact" className="text-[#00D1C1] font-semibold underline-offset-2 hover:underline">
              צרו קשר
            </Link>
            .
          </p>
        </div>

        <PricingRoiCalculator />

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 items-stretch mt-10">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? 'border-[#00D1C1] shadow-lg shadow-teal-900/10 ring-2 ring-[#00D1C1]/30 md:-translate-y-1'
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-[#00a89a] mb-1">{plan.tag}</p>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{plan.name}</h2>
              <p className="text-sm text-gray-600 mb-4 flex-1 leading-relaxed">{plan.blurb}</p>
              <div className="mb-6">
                {plan.priceMonthly != null ? (
                  <>
                    <p className="text-3xl font-black text-gray-900">
                      ₪{plan.priceMonthly}
                      <span className="text-base font-semibold text-gray-500"> / חודש</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">או ₪{plan.priceYearly} לשנה (חיסכון)</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">לפי הצעה</p>
                    {plan.enterpriseFromMonthly != null && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        ברוב הארגונים תוכניות Enterprise <strong className="text-gray-800">מתחילות מסביבות ₪{plan.enterpriseFromMonthly.toLocaleString('he-IL')} לחודש</strong>
                        {' '}(תלוי נפח נכסים, SLA ואינטגרציות). לאומדן מדויק —{' '}
                        <Link to="/contact" className="text-[#00a89a] font-semibold underline-offset-2 hover:underline">
                          דברו עם מכירות
                        </Link>
                        .
                      </p>
                    )}
                  </>
                )}
              </div>
              <ul className="space-y-2 mb-8 text-sm w-full">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex flex-row-reverse items-center gap-2 w-full">
                    {f.ok ? (
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" aria-label="כן" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 shrink-0" aria-label="לא" />
                    )}
                    <span className="text-gray-700 flex-1 text-right">{f.label}</span>
                  </li>
                ))}
              </ul>
              <Link to={plan.priceMonthly == null ? '/contact' : '/register'} className="mt-auto">
                <Button
                  className={`w-full font-bold min-h-[48px] text-base ${
                    plan.highlight ? 'bg-[#00D1C1] text-[#0B1220] hover:bg-[#00c4b4]' : ''
                  }`}
                  variant={plan.highlight ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-12 rounded-2xl border border-gray-100 bg-gray-50/80 p-6 text-right space-y-3">
          <h2 className="text-lg font-bold text-gray-900">שקיפות לפני שמחליטים</h2>
          <ul className="text-base text-gray-600 space-y-2 leading-relaxed list-disc pr-5">
            <li>
              <strong className="text-gray-800">ניסיון:</strong> 14 יום ללא חיוב (ללא כרטיס אשראי), ביטול בכל עת — כפי שמופיע גם בהרשמה.
            </li>
            <li>
              <strong className="text-gray-800">בסיסית / מתקדמת:</strong> המחירים להמחשה; בפועל עשויים לחול מבצעים, תשלום שנתי או התאמה לארגון.
            </li>
            <li>
              <strong className="text-gray-800">Enterprise:</strong> תמחור, SLA ואינטגרציות —{' '}
              <Link to="/contact" className="text-[#00a89a] font-semibold underline-offset-2 hover:underline">בשיחה עם המכירות</Link>.
            </li>
            <li>
              <strong className="text-gray-800">תמיכה:</strong> ימים א–ה 09:00–18:00 — דף{' '}
              <Link to="/contact" className="text-[#00a89a] font-semibold underline-offset-2 hover:underline">צור קשר</Link>
              {' '}או וואטסאפ מהאתר.
            </li>
            <li>
              <strong className="text-gray-800">אבטחה ותקנים:</strong>{' '}
              <Link to="/data-security#security-compliance" className="text-[#00a89a] font-semibold underline-offset-2 hover:underline">
                סיכום עמידה בתקנים ודוחות (כולל SOC 2 / ISO)
              </Link>
              .
            </li>
          </ul>
        </div>

        <p className="text-center text-sm text-gray-500 max-w-xl mx-auto mt-8 leading-relaxed">
          מחירים בשקלים חדשים, לא כוללים מע״ם אם חל. תכונות ספציפיות עשויות להשתנות לפי גרסת המוצר.
        </p>
      </main>
    </div>
  );
}
