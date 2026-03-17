import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
// Note: user prop is injected by Layout via React.cloneElement
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Rocket, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B1220] mb-4">
            בחר את התוכנית המתאימה לך
          </h1>
          <p className="text-xl text-gray-600">
            התחל עם ניסיון חינם ל-14 יום • ביטול בכל עת
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`relative h-full ${plan.popular ? 'border-2 border-[#00D1C1] shadow-xl' : 'border'}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[#00D1C1] text-[#0B1220] text-sm px-4 py-1">
                        🔥 הכי פופולרי
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl ${plan.popular ? 'bg-gradient-to-br from-[#00D1C1] to-[#00B8A9]' : 'bg-gray-100'} flex items-center justify-center`}>
                      <Icon className={`h-7 w-7 ${plan.popular ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <div className="mb-4">
                      <span className="text-5xl font-bold text-[#0B1220]">₪{plan.price}</span>
                      <span className="text-gray-500">/חודש</span>
                    </div>
                    {isCurrent && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        התוכנית הנוכחית שלך
                      </Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-2 text-gray-600">
                          <Check className="h-5 w-5 text-[#00D1C1] flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full rounded-xl ${plan.popular 
                        ? 'bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] hover:opacity-90 text-white' 
                        : 'bg-[#0B1220] hover:bg-[#1a2744] text-white'} ${isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => !isCurrent && handleSelectPlan(plan.id)}
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'התוכנית הנוכחית' : 'בחר תוכנית'}
                      {!isCurrent && <ArrowLeft className="mr-2 h-4 w-4" />}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              ניסיון חינם 14 יום
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              ביטול בכל עת
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              ללא התחייבות
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              תשלום מאובטח
            </div>
          </div>
          
          <p className="text-gray-400 text-sm">
            יש שאלות? <a href="mailto:support@stayflow.io" className="text-[#00D1C1] hover:underline">צור קשר עם התמיכה</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}