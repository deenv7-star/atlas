import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Page, PageHeader, Card, Section, EmptyState, fmtMoney, fmtDay } from '@/components/ds';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap, Rocket, CreditCard, Calendar, Receipt } from 'lucide-react';
import { PRICING_PLANS } from '@/config/pricing';
import { isSupabaseConfigured, LOCAL_API_URL } from '@/api/supabaseClient';
import TermsConsent from '@/components/legal/TermsConsent';

const PLANS = Object.fromEntries(
  PRICING_PLANS.map((p) => [
    p.key,
    {
      name: p.name,
      price: p.price,
      icon: p.key === 'starter' ? Zap : p.key === 'pro' ? Crown : Rocket,
      propertyLimit: p.properties ?? Infinity,
      popular: p.popular,
      features: p.features,
    },
  ])
);

export default function BillingPage({ user }) {
  const [loading, setLoading] = useState(false);
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
      window.alert('יש להתחבר מחדש');
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
        window.alert(data.error || 'לא הצלחנו לפתוח את דף התשלום. נסו שוב בעוד רגע.');
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
      else window.alert(data.error || 'לא ניתן לפתוח פורטל ניהול מנוי');
    } finally {
      setStripeLoading(false);
    }
  };

  const planKey = user?.subscription_plan;
  const currentPlan = (planKey && PLANS[planKey]) ? planKey : 'starter';
  const nextBillingDate = user?.next_billing_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const handleUpgrade = async (planId) => {
    if (needConsent('billing-consent-up')) return;
    setLoading(true);
    try {
      await base44.auth.updateMe({ subscription_plan: planId });
      alert('התוכנית עודכנה בהצלחה! התשלום יחויב בתאריך החיוב הבא.');
    } catch (error) {
      alert('שגיאה בעדכון התוכנית');
    } finally {
      setLoading(false);
    }
  };

  const plan = PLANS[currentPlan];
  const upgrades = Object.entries(PLANS).filter(([key]) => {
    if (currentPlan === 'starter') return key === 'pro' || key === 'business';
    if (currentPlan === 'pro') return key === 'business';
    return false;
  });

  return (
    <Page className="max-w-[960px] space-y-6">
      <PageHeader title="חיובים" subtitle="התוכנית שלכם, החיוב הבא והיסטוריית התשלומים." className="!mb-0" />

      <Card className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="ds-icon-square">{React.createElement(plan.icon, { className: 'h-5 w-5', strokeWidth: 1.75 })}</span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink-400">התוכנית הנוכחית</p>
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
            <dd className="mt-1 text-[15px] font-bold text-navy-900">{fmtDay(nextBillingDate)}</dd>
          </div>
          <div className="rounded-[12px] bg-canvas p-4">
            <dt className="flex items-center gap-2 text-[13px] text-ink-600"><CreditCard className="h-4 w-4" strokeWidth={1.75} />אמצעי תשלום</dt>
            <dd className="mt-1 text-[15px] font-bold text-navy-900">עדיין לא נוסף כרטיס</dd>
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

      {upgrades.length > 0 && (
        <section>
          <h2 className="mb-3 text-[20px] font-bold text-navy-900">שדרוג</h2>
          <TermsConsent id="billing-consent-up" className="mb-4 max-w-[560px]" checked={agreed} onChange={(v) => { setAgreed(v); if (v) setConsentError(false); }} error={consentError} />
          <div className="grid gap-4 md:grid-cols-2">
            {upgrades.map(([key, p]) => (
              <Card key={key} className={cn('flex h-full flex-col p-5 md:p-6', p.popular && 'border-brand-600 ring-1 ring-brand-600')}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="ds-icon-square">{React.createElement(p.icon, { className: 'h-5 w-5', strokeWidth: 1.75 })}</span>
                    <h3 className="text-[18px] font-bold text-navy-900">{p.name}</h3>
                  </div>
                  {p.popular ? <span className="inline-flex h-6 items-center rounded-full bg-brand-50 px-2.5 text-[13px] font-bold text-brand-700">הכי נבחרת</span> : null}
                </div>
                <p className="mt-4 text-navy-900"><span className="tabular text-[32px] font-bold">{fmtMoney(p.price)}</span><span className="text-[15px] text-ink-400"> לחודש</span></p>
                <ul className="mb-6 mt-4 flex-1 space-y-2">
                  {p.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-[15px] text-ink-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={p.popular ? 'default' : 'outline'} onClick={() => handleUpgrade(key)} disabled={loading}>
                  {loading ? 'מעדכנים…' : `מעבר ל-${p.name}`}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Section title="היסטוריית חיובים" icon={Receipt}>
        <EmptyState compact title="אין עדיין חיובים" description="אחרי החיוב הראשון הקבלות יופיעו כאן." />
      </Section>
    </Page>
  );
}
