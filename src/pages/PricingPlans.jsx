import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

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

export default function PricingPlans() {
  return (
    <div dir="rtl" className="min-h-screen bg-white" style={{ fontFamily: "'Heebo', sans-serif" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <img src="/atlas-logo-final.png" alt="ATLAS" className="h-9" />
          </Link>
          <div className="flex items-center gap-2">
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
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">תוכניות ותמחור</h1>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            השוואה מהירה בין חבילות. המחירים להמחשה בלבד — בפועל ייתכנו מבצעים, שנתיות ומותאם ארגון.
            לקבלת הצעה מדויקת{' '}
            <Link to="/contact" className="text-[#00D1C1] font-semibold underline-offset-2 hover:underline">
              צרו קשר
            </Link>
            .
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 items-stretch">
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
              <p className="text-sm text-gray-600 mb-6 flex-1 leading-relaxed">{plan.blurb}</p>
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
                  <p className="text-2xl font-bold text-gray-900">לפי הצעה</p>
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

        <p className="text-center text-xs text-gray-500 max-w-xl mx-auto mt-10 leading-relaxed">
          מחירים בשקלים חדשים, לא כוללים מע״ם אם חל. תכונות ספציפיות עשויות להשתנות לפי גרסת המוצר.
        </p>
      </main>
    </div>
  );
}
