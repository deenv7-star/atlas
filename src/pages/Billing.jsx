import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page, PageHeader, Card, Section, EmptyState, fmtMoney, fmtDay } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap, Rocket, CreditCard, Calendar, Receipt } from 'lucide-react';
import { PRICING_PLANS, VAT_LINE } from '@/config/pricing';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { heError } from '@/lib/heError';
import { isSupabaseConfigured, LOCAL_API_URL } from '@/api/supabaseClient';
import TermsConsent from '@/components/legal/TermsConsent';

const PLANS = Object.fromEntries(
  PRICING_PLANS.map((p) => [
    p.key,
    {
      name: p.nameHe,
      price: p.price,
      icon: p.key === 'starter' ? Zap : p.key === 'pro' ? Crown : Rocket,
      propertyLimit: p.properties ?? Infinity,
      popular: p.popular,
      features: p.features,
    },
  ])
);

/**
 * COPY-054 (01.11.2026): one honest payment flow. Self-serve billing is not live in production (Stripe buttons
 * only render without Supabase, i.e. the local API), and Subscription.jsx sends a plan request to the team.
 * So this screen says the same: choose a package on /subscription, the team gets back within a business day.
 * The old "upgrade" button wrote subscription_plan on the user and said "המסלול עודכן" without any charge.
 */
export default function BillingPage({ user }) {
  const [stripeLoading, setStripeLoading] = useState(false);
  // Upay/Bit requirement: active consent before any payment step.
  const [agreed, setAgreed] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const needConsent = (anchor) => {
    if (agreed) return false;
    setConsentError(true);
    document.getElementById(anchor)?.focus();
    return true;
  };

  const goStripeCheckout = async () => {
    if (needConsent('billing-consent')) return;
    const token = localStorage.getItem('atlas_jwt_token');
    if (!token) {
      atlasToastApi.error('צריך להתחבר שוב כדי להמשיך.');
      return;
    }
    setStripeLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL || LOCAL_API_URL;
      const res = await fetch(`${base}/api/billing/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
      } else {
        atlasToastApi.error(heError(data.error, 'לא הצלחנו לפתוח את דף התשלום. נסו שוב בעוד רגע.'));
      }
    } finally {
      setStripeLoading(false);
    }
  };

  const goStripePortal = async () => {
    const token = localStorage.getItem('atlas_jwt_token');
    if (!token) return;
    setStripeLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL || LOCAL_API_URL;
      const res = await fetch(`${base}/api/billing/portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) window.location.href = data.url;
      else atlasToastApi.error(heError(data.error, 'לא הצלחנו לפתוח את ניהול המנוי. נסו שוב בעוד רגע.'));
    } finally {
      setStripeLoading(false);
    }
  };

  const planKey = user?.subscription_plan;
  const currentPlan = (planKey && PLANS[planKey]) ? planKey : 'starter';
  const nextBillingDate = user?.next_billing_date || null; // never invent a date

  const plan = PLANS[currentPlan];
  const upgrades = Object.entries(PLANS).filter(([key]) => {
    if (currentPlan === 'starter') return key === 'pro' || key === 'business';
    if (currentPlan === 'pro') return key === 'business';
    return false;
  });

  return (
    <Page className="max-w-[960px] space-y-6">
      <PageHeader title="חיובים" subtitle="החבילה שלכם, החיוב הבא והיסטוריית התשלומים." className="!mb-0" />

      <Card className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="ds-icon-square">{React.createElement(plan.icon, { className: 'h-5 w-5', strokeWidth: 1.75 })}</span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink-400">החבילה הנוכחית</p>
              <h2 className="truncate text-[20px] font-bold text-navy-900">{plan.name}</h2>
            </div>
          </div>
          <div className="shrink-0 text-left">
            <p className="tabular text-[28px] font-bold leading-none text-navy-900">{fmtMoney(plan.price)}</p>
            <p className="mt-1 text-[13px] text-ink-400">לחודש</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-[12px] bg-canvas p-4">
            <dt className="flex items-center gap-2 text-[13px] text-ink-600"><Calendar className="h-4 w-4" strokeWidth={1.75} />החיוב הבא</dt>
            <dd className="mt-1 text-[15px] font-bold text-navy-900">{nextBillingDate ? fmtDay(nextBillingDate) : 'ייקבע כשתופעל החבילה'}</dd>
          </div>
          <div className="rounded-[12px] bg-canvas p-4">
            <dt className="flex items-center gap-2 text-[13px] text-ink-600"><CreditCard className="h-4 w-4" strokeWidth={1.75} />אמצעי תשלום</dt>
            <dd className="mt-1 text-[15px] font-bold text-navy-900">מוסדר מול הצוות שלנו</dd>
          </div>
        </dl>

        <div className="mt-5 border-t border-line pt-5">
          <h3 className="mb-3 text-[15px] font-bold text-navy-900">מה כלול</h3>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] text-ink-600">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {!isSupabaseConfigured && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
            <TermsConsent id="billing-consent" className="w-full" checked={agreed} onChange={(v) => { setAgreed(v); if (v) setConsentError(false); }} error={consentError} />
            <Button type="button" disabled={stripeLoading} onClick={goStripeCheckout}>
              {stripeLoading ? 'פותחים…' : 'הוספת אמצעי תשלום'}
            </Button>
            <Button type="button" variant="outline" disabled={stripeLoading} onClick={goStripePortal}>
              ניהול המנוי
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-5 md:p-6">
        <h2 className="text-[18px] font-bold text-navy-900">{upgrades.length > 0 ? 'החלפת חבילה' : 'איך משלמים'}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
          התשלום מוסדר מול הצוות שלנו. בוחרים חבילה במסך המנוי, ונחזור אליכם תוך יום עסקים כדי להפעיל אותה. אין חיוב אוטומטי.
        </p>
        <p className="mt-1 text-[14px] text-ink-400">{VAT_LINE}</p>
        <Button asChild className="mt-4 min-h-11">
          <Link to="/subscription">בחירת חבילה</Link>
        </Button>
      </Card>

      <Section title="היסטוריית חיובים" icon={Receipt}>
        <EmptyState compact title="אין עדיין חיובים" description="אחרי החיוב הראשון הוא יופיע כאן, עם אישור במייל." />
      </Section>
    </Page>
  );
}
