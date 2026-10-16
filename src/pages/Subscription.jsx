import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
// Note: user prop is injected by Layout via React.cloneElement
import { Page, PageHeader, Card, fmtMoney } from '@/components/ds';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, Zap, Crown, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { PRICING_PLANS } from '@/config/pricing';

const PLANS = PRICING_PLANS.map((p) => ({
  id: p.key,
  name: p.name,
  price: p.price,
  icon: p.key === 'starter' ? Zap : p.key === 'pro' ? Crown : Rocket,
  propertyLimit: p.properties ?? Infinity,
  popular: p.popular,
  features: p.features,
}));

export default function SubscriptionPage({ user }) {
  const [currentPlan, setCurrentPlan] = useState('starter');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setCurrentPlan(user.subscription_plan || 'starter');
    }
  }, [user]);

  const handleSelectPlan = async (planId) => {
    // Note: Stripe integration will handle actual payment
    // For now, we'll just update the user's plan selection
    await base44.auth.updateMe({ subscription_plan: planId });
    setCurrentPlan(planId);
    navigate(createPageUrl('Dashboard') || '/dashboard');
  };

  return (
    <Page className="space-y-6">
      <PageHeader title="מנוי" subtitle="14 יום ניסיון חינם. אפשר להחליף תוכנית או לבטל בכל רגע." className="!mb-0" />

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          return (
            <Card key={plan.id} className={cn('flex h-full flex-col p-5 md:p-6', plan.popular && 'border-brand-600 ring-1 ring-brand-600')}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="ds-icon-square"><Icon className="h-5 w-5" strokeWidth={1.75} /></span>
                  <h2 className="text-[18px] font-extrabold text-navy-900">{plan.name}</h2>
                </div>
                {isCurrent ? (
                  <span className="inline-flex h-6 items-center rounded-full bg-success-50 px-2.5 text-[13px] font-bold text-success-600">התוכנית שלכם</span>
                ) : plan.popular ? (
                  <span className="inline-flex h-6 items-center rounded-full bg-brand-50 px-2.5 text-[13px] font-bold text-brand-700">הכי נבחרת</span>
                ) : null}
              </div>
              <p className="mt-4 text-navy-900">
                <span className="tabular text-[36px] font-extrabold tracking-[-0.02em]">{fmtMoney(plan.price)}</span>
                <span className="text-[15px] text-ink-400"> לחודש</span>
              </p>
              <p className="text-[13px] text-ink-400">{plan.propertyLimit === Infinity ? 'נכסים ללא הגבלה' : `עד ${plan.propertyLimit} נכסים`}</p>
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
                onClick={() => !isCurrent && handleSelectPlan(plan.id)}
                disabled={isCurrent}
              >
                {isCurrent ? 'התוכנית הנוכחית' : `בחירת ${plan.name}`}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] text-ink-600">
          {['ניסיון חינם 14 יום', 'ביטול בכל רגע', 'ללא התחייבות', 'תשלום מאובטח'].map((t) => (
            <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success-600" strokeWidth={2} />{t}</li>
          ))}
        </ul>
        <p className="text-[14px] text-ink-400">
          שאלות? <a href="mailto:support@atlas-app.co.il" className="inline-flex min-h-11 items-center font-medium text-brand-600 hover:underline">כתבו לנו</a>
        </p>
      </div>
    </Page>
  );
}
