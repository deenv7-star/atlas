import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Rocket, CreditCard, Calendar, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import { PRICING_PLANS } from '@/config/pricing';

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
  const navigate = useNavigate();

  const currentPlan = user?.subscription_plan || 'starter';
  const nextBillingDate = user?.next_billing_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const handleUpgrade = async (planId) => {
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

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0B1220]">מנוי וחיוב</h1>
        <p className="text-gray-500 mt-1">נהל את המנוי ופרטי התשלום שלך</p>
      </div>

      {/* Current Plan */}
      <Card className="border-2 border-[#00D1C1] shadow-lg rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] flex items-center justify-center">
                {React.createElement(PLANS[currentPlan].icon, { className: "h-6 w-6 text-white" })}
              </div>
              <div>
                <CardTitle>תוכנית {PLANS[currentPlan].name}</CardTitle>
                <CardDescription>התוכנית הנוכחית שלך</CardDescription>
              </div>
            </div>
            <div className="text-left">
              <div className="text-3xl font-bold text-[#0B1220]">₪{PLANS[currentPlan].price}</div>
              <div className="text-sm text-gray-500">לחודש</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">תאריך חיוב הבא</span>
              </div>
              <p className="font-semibold text-[#0B1220]">
                {new Date(nextBillingDate).toLocaleDateString('he-IL')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">אמצעי תשלום</span>
              </div>
              <p className="font-semibold text-[#0B1220]">•••• 4242</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3">מה כלול בתוכנית שלך:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLANS[currentPlan].features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-[#00D1C1]" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {currentPlan !== 'business' && (
        <div>
          <h2 className="text-xl font-bold text-[#0B1220] mb-4">שדרג את התוכנית שלך</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(PLANS)
              .filter(([key]) => {
                if (currentPlan === 'starter') return key === 'pro' || key === 'business';
                if (currentPlan === 'pro') return key === 'business';
                return false;
              })
              .map(([key, plan]) => {
                const Icon = plan.icon;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={`h-full ${plan.popular ? 'border-2 border-[#00D1C1]' : 'border'}`}>
                      {plan.popular && (
                        <div className="bg-[#00D1C1] text-center text-[#0B1220] text-sm font-semibold py-2">
                          🔥 הכי פופולרי
                        </div>
                      )}
                      <CardHeader className="text-center">
                        <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${plan.popular ? 'from-[#00D1C1] to-[#00B8A9]' : 'from-gray-100 to-gray-200'} flex items-center justify-center`}>
                          <Icon className={`h-7 w-7 ${plan.popular ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <div className="text-4xl font-bold text-[#0B1220] mt-2">
                          ₪{plan.price}
                          <span className="text-lg text-gray-500 font-normal">/חודש</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-[#00D1C1] flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button 
                          className="w-full rounded-xl bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] hover:opacity-90 text-white"
                          onClick={() => handleUpgrade(key)}
                          disabled={loading}
                        >
                          {loading ? 'מעדכן...' : 'שדרג עכשיו'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}

      {/* Payment History */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            היסטוריית חיובים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: '2026-01-07', amount: PLANS[currentPlan].price, status: 'שולם' },
              { date: '2025-12-07', amount: PLANS[currentPlan].price, status: 'שולם' },
              { date: '2025-11-07', amount: PLANS[currentPlan].price, status: 'שולם' }
            ].map((payment, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">₪{payment.amount}</p>
                    <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString('he-IL')}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  {payment.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}