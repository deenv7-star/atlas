/**
 * /pricing: the same pricing component as the landing (Pricing8, prices from src/config/pricing.js:
 * ₪399 / ₪699 / ₪999, Hebrew plan names). The old page had its own ₪299 / ₪599 / "Enterprise"
 * illustration that no longer matched what we sell.
 */
import React, { useRef } from 'react';
import { useReveal } from '@/components/landing/v5/motion';
import { Faq, Footer } from '@/components/landing/v5/LandingV5';
import { V7Header } from '@/components/landing/v7/shared7';
import { Pricing8 } from '@/components/landing/v8/Pricing8';
import '@/components/landing/v5/landing-v5.css';
import '@/components/landing/v7/landing-v7.css';
import '@/components/landing/v8/shared8.css';
import '@/components/landing/v8/landing-v8m.css';

const NAV = [['/#features', 'המוצר'], ['/#facts', 'למה ATLAS'], ['#pricing', 'מחירים'], ['#faq', 'שאלות']];

export default function PricingPlans() {
  const root = useRef(null);
  useReveal(root);
  return (
    <div ref={root} className="l5 l7 v8 lm" dir="rtl" lang="he">
      <a href="#main" className="l5-skip">דלגו לתוכן</a>
      <V7Header links={NAV} />
      <main id="main" className="pt-[72px]">
        <Pricing8 title="מחירים. פשוט, לפי מספר המתחמים." />
        <Faq limit={5} />
      </main>
      <Footer />
    </div>
  );
}
