import React, { useState, useEffect } from 'react';
// Note: user prop is injected by Layout via React.cloneElement
import { Page, PageHeader, Card, fmtMoney } from '@/components/ds';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, Zap, Crown, Rocket } from 'lucide-react';
import { PRICING_PLANS, TRIAL_LINE } from '@/config/pricing';
import { submitPublicContact } from '@/lib/submitPublicContact';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import TermsConsent from '@/components/legal/TermsConsent';
import { TERMS_VERSION } from '@/config/consent';

const PLANS = PRICING_PLANS.map((p) => ({
  id: p.key,
  name: p.nameHe,
  price: p.price,
  limitLabel: p.limit,
  icon: p.key === 'starter' ? Zap : p.key === 'pro' ? Crown : Rocket,
  propertyLimit: p.properties ?? Infinity,
  popular: p.popular,
  features: p.features,
}));

export default function SubscriptionPage({ user }) {
  const [currentPlan, setCurrentPlan] = useState('starter');
  const [requested, setRequested] = useState('');
  const [busy, setBusy] = useState('');
  // Upay/Bit requirement: active consent before any purchase step.
  const [agreed, setAgreed] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const isTrial = !user?.subscription_status || user.subscription_status === 'trialing';

  useEffect(() => {
    if (user) {
      setCurrentPlan(user.subscription_plan || 'starter');
    }
  }, [user]);

  // There is no self-serve billing yet. Choosing a plan sends a real request to the ATLAS team
  // (contact_messages, seen in the admin console) instead of pretending the plan changed.
  const handleSelectPlan = async (plan) => {
    if (!agreed) {
      setConsentError(true);
      document.getElementById('sub-consent')?.focus();
      return;
    }
    setBusy(plan.id);
    try {
      const { ok, data } = await submitPublicContact({
        name: user?.full_name || user?.organization_name || user?.email || 'לקוח atlas',
        email: user?.email || '',
        phone: user?.phone || '',
        subject: `upgrade:${plan.id}`,
        message: `בקשה לעבור לחבילת ${plan.name} (₪${plan.price} לחודש). ארגון: ${user?.organization_name || '—'} (${user?.organization_id || '—'}). הלקוח אישר את התקנון ומדיניות הפרטיות (גרסה ${TERMS_VERSION}) ב-${new Date().toISOString()}.`,
      });
      if (!ok) throw new Error(data?.error || '');
      setRequested(plan.id);
      atlasToastApi.success('הבקשה התקבלה. נחזור אליכם תוך יום עסקים כדי להפעיל את החבילה.');
    } catch (e) {
      atlasToastApi.error(e?.message || 'לא הצלחנו לשלוח. כתבו לנו ל־support@atlas-il.com');
    } finally {
      setBusy('');
    }
  };

  return (
    <Page className="space-y-6">
      <PageHeader title="מנוי" subtitle={isTrial ? TRIAL_LINE : 'אפשר להחליף חבילה או לבטל בכל רגע.'} className="!mb-0" />

      <TermsConsent id="sub-consent" className="max-w-[560px]" checked={agreed} onChange={(v) => { setAgreed(v); if (v) setConsentError(false); }} error={consentError} />

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = !isTrial && currentPlan === plan.id;
          const isRequested = requested === plan.id;
          return (
            <Card key={plan.id} className={cn('flex h-full flex-col p-5 md:p-6', plan.popular && 'border-brand-600 ring-1 ring-brand-600')}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="ds-icon-square"><Icon className="h-5 w-5" strokeWidth={1.75} /></span>
                  <h2 className="text-[18px] font-bold text-navy-900">{plan.name}</h2>
                </div>
                {isCurrent ? (
                  <span className="inline-flex h-6 items-center rounded-full bg-success-50 px-2.5 text-[13px] font-bold text-success-600">התוכנית שלכם</span>
                ) : plan.popular ? (
                  <span className="inline-flex h-6 items-center rounded-full bg-brand-50 px-2.5 text-[13px] font-bold text-brand-700">מומלץ</span>
                ) : null}
              </div>
              <p className="mt-4 text-navy-900">
                <span className="tabular text-[36px] font-bold tracking-[-0.02em]">{fmtMoney(plan.price)}</span>
                <span className="text-[15px] text-ink-400"> לחודש</span>
              </p>
              <p className="text-[13px] text-ink-400">{plan.limitLabel}</p>
              <ul className="mb-6 mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-[15px] text-ink-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular && !isCurrent ? 'default' : 'outline'}
                onClick={() => !isCurrent && !isRequested && handleSelectPlan(plan)}
                disabled={isCurrent || isRequested || Boolean(busy)}
              >
                {isCurrent ? 'התוכנית הנוכחית' : isRequested ? 'הבקשה נשלחה' : busy === plan.id ? 'שולחים…' : `בחירת ${plan.name}`}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] text-ink-600">
          {['ניסיון חינם 14 יום', 'ביטול בכל רגע', 'בלי התחייבות'].map((t) => (
            <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success-600" strokeWidth={2} />{t}</li>
          ))}
        </ul>
        <p className="text-[14px] text-ink-400">
          שאלות? <a href="/contact" className="inline-flex min-h-11 items-center font-medium text-brand-600 hover:underline">כתבו לנו</a>
        </p>
      </div>
    </Page>
  );
}
