import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, ArrowRight, Check, Building2, Home,
  CalendarDays, CreditCard, Users, BarChart2, Crown, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import {
  validateFirstName, validateLastName, validatePhone,
  validateOrgName, validateAddress, validateOrgType,
  validatePropertyName, validateRooms, validatePricePerNight,
  validateCardNumber, validateExpiry, validateCvv, validateNameOnCard,
} from '@/lib/validation';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { PRICING_PLANS } from '@/config/pricing';

const TOTAL_STEPS = 4;
const SAVE_TIMEOUT_MS = 45_000;

function withSaveTimeout(promise, ms = SAVE_TIMEOUT_MS) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(
      () => reject(new Error('השמירה ארכה יותר מדי זמן. בדוק חיבור לאינטרנט ונסה שוב.')),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

function handleOnboardingError(err, context) {
  console.error(`[Onboarding] ${context}:`, err);
  const msg = String(err?.message || '');
  const code = err?.code || '';
  if ((msg.includes('column') && msg.includes('does not exist')) || code === '42703') {
    toast.error('המסד נתונים לא מעודכן. הרץ את supabase/migrations/002_trial_system.sql ב-Supabase SQL Editor.');
  } else if (msg.includes('JWT') || msg.includes('session')) {
    toast.error('ההתחברות פגה. נא להתחבר מחדש.');
  } else if (msg.includes('row-level security') || msg.includes('RLS')) {
    toast.error('אין הרשאה לשמור נתונים. בדוק את מדיניות ה-RLS ב-Supabase או פנה לתמיכה.');
  } else if (msg && msg.length < 280) {
    toast.error(msg);
  } else {
    toast.error('שגיאה בשמירת הנתונים, נסה שוב.');
  }
}

const PROPERTY_TYPES = [
  { value: 'zimmer', label: 'צימרים' },
  { value: 'villa', label: 'וילות' },
  { value: 'resort', label: 'ריזורט' },
  { value: 'cabin', label: 'בקתות' },
  { value: 'other', label: 'אחר' },
];

const PLANS = PRICING_PLANS.map((p) => ({
  key: p.key,
  name: p.name,
  price: p.price,
  desc: p.desc,
  features: p.features,
  recommended: p.popular,
}));

const FEATURES = [
  { icon: CalendarDays, title: 'הזמנות מתקבלות אוטומטית', desc: 'כל ההזמנות מכל הערוצים נכנסות למערכת לבד' },
  { icon: CreditCard, title: 'תשלומים מתנהלים לבד', desc: 'גביה אוטומטית, תזכורות חכמות וחשבוניות' },
  { icon: Users, title: 'הצוות מקבל משימות אוטומטית', desc: 'משימות ניקיון ותחזוקה מוקצות אוטומטית' },
  { icon: BarChart2, title: 'דוחות בזמן אמת', desc: 'מעקב הכנסות, תפוסה ושביעות רצון בכל רגע' },
];

export default function Onboarding() {
  const { user, checkAppState } = useAuth();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [personalForm, setPersonalForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [orgForm, setOrgForm] = useState({ name: '', address: '', type: '' });
  const [propertyForm, setPropertyForm] = useState({ name: '', bedrooms: '1', base_price: '' });
  const [createdOrgName, setCreatedOrgName] = useState('');
  const [createdPropertyName, setCreatedPropertyName] = useState('');
  const [selectedPlanKey, setSelectedPlanKey] = useState('pro');
  const [paymentForm, setPaymentForm] = useState({ cardNumber: '', expiry: '', cvv: '', nameOnCard: '' });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [visibleFeatures, setVisibleFeatures] = useState(0);

  const persistStep = useCallback(async (s) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase.from('profiles').update({ onboarding_step: s + 1 }).eq('id', authUser.id);
        }
      } else {
        await base44.auth.updateMe({ onboarding_step: s + 1 });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (user?.onboarding_completed) {
      window.location.replace('/dashboard');
      return;
    }
    if (user?.onboarding_step && !loaded) {
      const s = Math.min(Math.max(0, user.onboarding_step - 1), TOTAL_STEPS - 1);
      setStep(s);
      setLoaded(true);
    } else if (!user?.onboarding_step) {
      setLoaded(true);
    }
  }, [user?.onboarding_completed, user?.onboarding_step, loaded]);

  useEffect(() => {
    if (step === 2) {
      setVisibleFeatures(0);
      const timers = FEATURES.slice(0, 2).map((_, i) =>
        setTimeout(() => setVisibleFeatures(v => Math.max(v, i + 1)), 300 + i * 300)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [step]);

  const goNext = async () => {
    setDirection(1);
    const next = Math.min(step + 1, TOTAL_STEPS - 1);
    setStep(next);
    await persistStep(next);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 0));
  };

  const isPersonalValid = () => {
    const fn = validateFirstName(personalForm.first_name);
    const ln = validateLastName(personalForm.last_name);
    const ph = validatePhone(personalForm.phone);
    return fn.valid && ln.valid && ph.valid;
  };

  const handleSavePersonal = async () => {
    setTouched(t => ({ ...t, first_name: true, last_name: true, phone: true }));
    const fn = validateFirstName(personalForm.first_name);
    const ln = validateLastName(personalForm.last_name);
    const ph = validatePhone(personalForm.phone);
    if (!fn.valid || !ln.valid || !ph.valid) {
      setErrors({ first_name: fn.error, last_name: ln.error, phone: ph.error });
      return;
    }
    setSaving(true);
    try {
      const fullName = `${personalForm.first_name.trim()} ${personalForm.last_name.trim()}`;
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('ההתחברות פגה. נא להתחבר מחדש.');
        return;
      }
      const { error: baseError } = await supabase.from('profiles').update({
        full_name: fullName,
        phone: personalForm.phone.trim() || null,
      }).eq('id', authUser.id);
      if (baseError) throw baseError;
      const { error: stepError } = await supabase.from('profiles').update({
        onboarding_step: 2,
      }).eq('id', authUser.id);
      if (stepError) {
        console.warn('[Onboarding] onboarding_step update failed (migration 002?), continuing:', stepError);
      }
      await goNext();
    } catch (err) {
      handleOnboardingError(err, 'handleSavePersonal');
    } finally {
      setSaving(false);
    }
  };

  const isOrgValid = () => {
    const n = validateOrgName(orgForm.name);
    const a = validateAddress(orgForm.address);
    const t = validateOrgType(orgForm.type);
    return n.valid && a.valid && t.valid;
  };

  const handleSaveOrg = async () => {
    setTouched(t => ({ ...t, orgName: true, orgAddress: true, orgType: true }));
    const n = validateOrgName(orgForm.name);
    const a = validateAddress(orgForm.address);
    const t = validateOrgType(orgForm.type);
    if (!n.valid || !a.valid || !t.valid) {
      setErrors({ orgName: n.error, orgAddress: a.error, orgType: t.error });
      return;
    }
    setSaving(true);
    try {
      if (user?.organization_id) {
        const { error } = await supabase.from('organizations').update({
          name: orgForm.name.trim().slice(0, 50),
          address: orgForm.address.trim().slice(0, 255),
        }).eq('id', user.organization_id);
        if (error) throw error;
      }
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { error: profErr } = await supabase.from('profiles').update({ onboarding_step: 3 }).eq('id', authUser.id);
        if (profErr) console.warn('[Onboarding] profiles onboarding_step update failed:', profErr);
      }
      setCreatedOrgName(orgForm.name.trim());
      await goNext();
    } catch (err) {
      if (!user?.organization_id) {
        toast.error('חשבון לא מוגדר במלואו. נא להתחבר מחדש או ליצור חשבון חדש.');
      } else {
        handleOnboardingError(err, 'handleSaveOrg');
      }
    } finally {
      setSaving(false);
    }
  };

  const isPropertyValid = () => {
    const n = validatePropertyName(propertyForm.name);
    const r = validateRooms(propertyForm.bedrooms);
    const p = validatePricePerNight(propertyForm.base_price);
    return n.valid && r.valid && p.valid;
  };

  const handleSaveProperty = async () => {
    setTouched(t => ({ ...t, propName: true, propRooms: true, propPrice: true }));
    const n = validatePropertyName(propertyForm.name);
    const r = validateRooms(propertyForm.bedrooms);
    const p = validatePricePerNight(propertyForm.base_price);
    if (!n.valid || !r.valid || !p.valid) {
      setErrors({ propName: n.error, propRooms: r.error, propPrice: p.error });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('properties').insert({
        name: propertyForm.name.trim().slice(0, 100),
        org_id: user?.organization_id,
        bedrooms: parseInt(propertyForm.bedrooms, 10) || 1,
        base_price: parseFloat(String(propertyForm.base_price).replace(/[^\d.]/g, '')) || null,
      });
      if (error) throw error;
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { error: profErr } = await supabase.from('profiles').update({ onboarding_step: 4 }).eq('id', authUser.id);
        if (profErr) console.warn('[Onboarding] profiles onboarding_step update failed:', profErr);
      }
      setCreatedPropertyName(propertyForm.name.trim());
      await goNext();
    } catch (err) {
      if (!user?.organization_id) {
        toast.error('חשבון לא מוגדר במלואו. נא להתחבר מחדש.');
      } else {
        handleOnboardingError(err, 'handleSaveProperty');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPlan = async (planKey) => {
    setSelectedPlanKey(planKey);
    setSaving(true);
    try {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      if (isSupabaseConfigured && supabase) {
        if (user?.organization_id) {
          await supabase.from('organizations').update({ subscription_plan: planKey }).eq('id', user.organization_id);
        }
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase.from('profiles').update({
            selected_plan: planKey,
            onboarding_step: TOTAL_STEPS,
            trial_ends_at: trialEnd.toISOString(),
            subscription_status: 'trialing',
          }).eq('id', authUser.id);
        }
      } else {
        if (user?.organization_id) {
          await base44.entities.Organization.update(user.organization_id, { subscription_plan: planKey });
        }
        await base44.auth.updateMe({
          selected_plan: planKey,
          subscription_plan: planKey,
          onboarding_step: TOTAL_STEPS,
          trial_ends_at: trialEnd.toISOString(),
          subscription_status: 'trialing',
        });
      }
      setDirection(1);
      setStep(3);
      await persistStep(3);
    } catch (err) {
      console.warn('[Onboarding] handleSelectPlan:', err);
      await goNext();
    } finally {
      setSaving(false);
    }
  };

  const handleSkipPlan = async () => {
    await handleSelectPlan(selectedPlanKey);
  };

  const isPaymentValid = () => {
    const card = validateCardNumber(paymentForm.cardNumber);
    const exp = validateExpiry(paymentForm.expiry);
    const cvv = validateCvv(paymentForm.cvv);
    const name = validateNameOnCard(paymentForm.nameOnCard);
    return card.valid && exp.valid && cvv.valid && name.valid;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setTouched(t => ({ ...t, cardNumber: true, expiry: true, cvv: true, nameOnCard: true }));
    const card = validateCardNumber(paymentForm.cardNumber);
    const exp = validateExpiry(paymentForm.expiry);
    const cvv = validateCvv(paymentForm.cvv);
    const name = validateNameOnCard(paymentForm.nameOnCard);
    if (!card.valid || !exp.valid || !cvv.valid || !name.valid) {
      setErrors({ cardNumber: card.error, expiry: exp.error, cvv: cvv.error, nameOnCard: name.error });
      return;
    }
    await savePlanAndProceed(selectedPlanKey);
  };

  const savePlanAndProceed = async (planKey) => {
    setSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { error } = await supabase.from('profiles').update({
          selected_plan: planKey,
          onboarding_step: 7,
        }).eq('id', authUser.id);
        if (error) {
          console.warn('[Onboarding] savePlanAndProceed profiles update failed:', error);
        }
      }
      await goNext();
    } catch (err) {
      handleOnboardingError(err, 'savePlanAndProceed');
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      if (isSupabaseConfigured && supabase) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { error } = await supabase.from('profiles').update({
            onboarding_completed: true,
            onboarding_step: TOTAL_STEPS,
            selected_plan: selectedPlanKey,
            trial_ends_at: trialEnd.toISOString(),
            subscription_status: 'trialing',
          }).eq('id', authUser.id);
          if (error) {
            console.warn('[Onboarding] handleFinish update failed:', error);
            toast.error('שגיאה בשמירת הנתונים. הרץ את החלק האחרון של 001_initial.sql ב-Supabase SQL Editor.');
          }
        }
      } else {
        await base44.auth.updateMe({
          onboarding_completed: true,
          onboarding_step: TOTAL_STEPS,
          selected_plan: selectedPlanKey,
          trial_ends_at: trialEnd.toISOString(),
          subscription_status: 'trialing',
        });
      }
    } catch (err) {
      console.warn('[Onboarding] handleFinish:', err);
      if (isSupabaseConfigured) {
        toast.error('שגיאה בשמירת הנתונים. הרץ את החלק האחרון של 001_initial.sql ב-Supabase SQL Editor.');
      } else {
        toast.error('שגיאה בשמירת הנתונים. נסה שוב.');
      }
    } finally {
      setSaving(false);
    }
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      confetti({ origin: { y: 0.6 }, particleCount: 80, spread: 70 });
    }
    try {
      localStorage.setItem('onboarding_just_completed', String(Date.now()));
    } catch {}
    window.location.replace('/dashboard');
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    if (step === 0) { e.preventDefault(); goNext(); return; }
    if (step === 1 && isOrgValid() && isPropertyValid()) { e.preventDefault(); handleSaveOrgAndProperty(); return; }
    if (step === 2) { e.preventDefault(); return; }
  };

  const handleSaveOrgAndProperty = async () => {
    setTouched(t => ({ ...t, orgName: true, orgAddress: true, orgType: true, propName: true, propRooms: true, propPrice: true }));
    const n = validateOrgName(orgForm.name);
    const a = validateAddress(orgForm.address);
    const t = validateOrgType(orgForm.type);
    const pn = validatePropertyName(propertyForm.name);
    const pr = validateRooms(propertyForm.bedrooms);
    const pp = validatePricePerNight(propertyForm.base_price);
    if (!n.valid || !a.valid || !t.valid || !pn.valid || !pr.valid || !pp.valid) {
      setErrors({ orgName: n.error, orgAddress: a.error, orgType: t.error, propName: pn.error, propRooms: pr.error, propPrice: pp.error });
      return;
    }
    setSaving(true);
    try {
      await withSaveTimeout((async () => {
        if (isSupabaseConfigured && supabase) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) throw new Error('ההתחברות פגה. נא להתחבר מחדש.');

          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', authUser.id)
            .maybeSingle();
          if (profErr) throw new Error(profErr.message);

          const orgId = prof?.organization_id ?? user?.organization_id;
          if (!orgId) {
            throw new Error('לא נמצא ארגון לחשבון. נסה להתחבר מחדש או פנה לתמיכה.');
          }

          const { error: orgErr } = await supabase
            .from('organizations')
            .update({
              name: orgForm.name.trim().slice(0, 50),
              address: orgForm.address.trim().slice(0, 255),
            })
            .eq('id', orgId);
          if (orgErr) throw new Error(orgErr.message);

          const { error: propErr } = await supabase.from('properties').insert({
            name: propertyForm.name.trim().slice(0, 100),
            org_id: orgId,
            type: orgForm.type?.trim() || null,
            bedrooms: parseInt(propertyForm.bedrooms, 10) || 1,
            base_price: parseFloat(String(propertyForm.base_price).replace(/[^\d.]/g, '')) || null,
          });
          if (propErr) throw new Error(propErr.message);
        } else {
          let orgId = user?.organization_id || null;
          if (orgId) {
            try {
              await base44.entities.Organization.update(orgId, {
                name: orgForm.name.trim().slice(0, 50),
                address: orgForm.address.trim().slice(0, 255),
              });
            } catch {
              await base44.entities.Organization.create({
                id: orgId,
                name: orgForm.name.trim().slice(0, 50),
                address: orgForm.address.trim().slice(0, 255),
              });
            }
          } else {
            orgId = `org_${Date.now()}`;
            const orgs = await base44.entities.Organization.list();
            const orgList = Array.isArray(orgs) ? orgs : (orgs?.data ? orgs.data : []);
            const existingOrg = orgList.find(o => o.id === orgId);
            if (existingOrg) {
              await base44.entities.Organization.update(orgId, {
                name: orgForm.name.trim().slice(0, 50),
                address: orgForm.address.trim().slice(0, 255),
              });
            } else {
              await base44.entities.Organization.create({
                id: orgId,
                name: orgForm.name.trim().slice(0, 50),
                address: orgForm.address.trim().slice(0, 255),
              });
            }
          }
          await base44.entities.Property.create({
            name: propertyForm.name.trim().slice(0, 100),
            org_id: orgId,
            type: orgForm.type?.trim() || null,
            bedrooms: parseInt(propertyForm.bedrooms, 10) || 1,
            base_price: parseFloat(String(propertyForm.base_price).replace(/[^\d.]/g, '')) || null,
          });
          await base44.auth.updateMe({
            organization_id: orgId,
            organization_name: orgForm.name.trim(),
            onboarding_step: 3,
          });
        }
      })());

      setCreatedOrgName(orgForm.name.trim());
      setCreatedPropertyName(propertyForm.name.trim());
      await goNext();
    } catch (err) {
      handleOnboardingError(err, 'handleSaveOrgAndProperty');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      /* ─── Step 0: Welcome ─── */
      case 0:
        return (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 mb-5">
              <img src="/atlas-logo-final.png" alt="ATLAS" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
            </div>
            <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-2">ברוך הבא ל-ATLAS!</h2>
            <p className="text-sm text-zinc-600 mb-6 leading-relaxed">בואו נגדיר את המתחם שלך תוך 2 דקות</p>

            <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
              {['חינם ל-14 יום', 'ללא כרטיס אשראי', 'ביטול בכל עת'].map((t, i) => (
                <motion.span
                  key={t}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 22, delay: reduceMotion ? 0 : 0.06 * i }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-500/8 border border-teal-600/15 text-teal-800"
                >
                  <Check className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                  {t}
                </motion.span>
              ))}
            </div>

            <Button
              onClick={goNext}
              className="w-full h-12 text-base font-bold rounded-xl gap-2 transition-[transform,opacity] duration-200 atlas-ease-out-trans active:scale-[0.99] bg-zinc-900 text-white hover:bg-zinc-800"
            >
              בואו נתחיל!
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (saving) return;
                setSaving(true);
                try {
                  if (isSupabaseConfigured && supabase) {
                    const { data: { user: authUser } } = await supabase.auth.getUser();
                    if (authUser) {
                      const { error } = await supabase.from('profiles').update({
                        onboarding_completed: true,
                        onboarding_step: TOTAL_STEPS,
                      }).eq('id', authUser.id);
                      if (error) console.warn('[Onboarding] profiles update failed:', error);
                    } else {
                      window.location.href = `/login?return=${encodeURIComponent('/dashboard')}`;
                      setSaving(false);
                      return;
                    }
                  } else {
                    try {
                      await base44.auth.updateMe({ onboarding_completed: true, onboarding_step: TOTAL_STEPS });
                    } catch (upErr) {
                      console.warn('[Onboarding] updateMe failed:', upErr);
                    }
                  }
                  try {
                    localStorage.setItem('onboarding_just_completed', String(Date.now()));
                    localStorage.setItem('login_just_completed', String(Date.now()));
                  } catch {}
                  await checkAppState();
                  window.location.replace(createPageUrl('Dashboard') || '/dashboard');
                } catch (err) {
                  toast.error('שגיאה. נסה שוב.');
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="w-full mt-3 text-sm font-medium text-zinc-500 hover:text-teal-700 transition-colors duration-200 ease-out py-2 cursor-pointer hover:underline focus:outline-none focus:ring-2 focus:ring-teal-500/25 rounded"
            >
              יש לי חשבון קיים — מעבר לדאשבורד
            </button>
          </div>
        );

      /* ─── Step 1: Organization + Property (combined) ─── */
      case 1: {
        const orgN = validateOrgName(orgForm.name);
        const orgA = validateAddress(orgForm.address);
        const orgT = validateOrgType(orgForm.type);
        const propN = validatePropertyName(propertyForm.name);
        const propR = validateRooms(propertyForm.bedrooms);
        const propP = validatePricePerNight(propertyForm.base_price);
        const combinedValid = orgN.valid && orgA.valid && orgT.valid && propN.valid && propR.valid && propP.valid;
        const showOrgNErr = touched.orgName && errors.orgName;
        const showOrgAErr = touched.orgAddress && errors.orgAddress;
        const showOrgTErr = touched.orgType && errors.orgType;
        const showPropNErr = touched.propName && errors.propName;
        const showPropRErr = touched.propRooms && errors.propRooms;
        const showPropPErr = touched.propPrice && errors.propPrice;
        return (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 bg-teal-500/8 border border-teal-600/15">
                <Building2 className="w-6 h-6 text-teal-700" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">הגדרת המתחם והנכס הראשון</h2>
              <p className="text-sm text-zinc-600 mt-1 leading-relaxed">פרטי הארגון והנכס הראשון</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">שם הארגון *</Label>
              <div className="relative">
                <Input
                  value={orgForm.name}
                  onChange={e => { setOrgForm(p => ({ ...p, name: e.target.value.slice(0, 50) })); setErrors(er => ({ ...er, orgName: '' })); }}
                  onBlur={() => { setTouched(t => ({ ...t, orgName: true })); const r = validateOrgName(orgForm.name); if (!r.valid) setErrors(e => ({ ...e, orgName: r.error })); }}
                  placeholder="למשל: נופש בגליל בע״מ"
                  maxLength={50}
                  className={cn('h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base pr-10', showOrgNErr && 'border-red-500', orgN.valid && touched.orgName && 'border-green-500')}
                  autoFocus
                />
                {orgN.valid && touched.orgName && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                {showOrgNErr && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />}
              </div>
              {showOrgNErr && <p className="text-xs text-red-500">{errors.orgName}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">כתובת *</Label>
              <div className="relative">
                <Input
                  value={orgForm.address}
                  onChange={e => { setOrgForm(p => ({ ...p, address: e.target.value.slice(0, 255) })); setErrors(er => ({ ...er, orgAddress: '' })); }}
                  onBlur={() => { setTouched(t => ({ ...t, orgAddress: true })); const r = validateAddress(orgForm.address); if (!r.valid) setErrors(e => ({ ...e, orgAddress: r.error })); }}
                  placeholder="רחוב, עיר"
                  maxLength={255}
                  className={cn('h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base pr-10', showOrgAErr && 'border-red-500', orgA.valid && touched.orgAddress && 'border-green-500')}
                />
                {orgA.valid && touched.orgAddress && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                {showOrgAErr && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />}
              </div>
              {showOrgAErr && <p className="text-xs text-red-500">{errors.orgAddress}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">סוג המתחם *</Label>
              <div className="relative">
                <Select
                  value={orgForm.type}
                  onValueChange={val => { setOrgForm(p => ({ ...p, type: val })); setErrors(er => ({ ...er, orgType: '' })); setTouched(t => ({ ...t, orgType: true })); }}
                  onOpenChange={open => { if (!open) { setTouched(t => ({ ...t, orgType: true })); const r = validateOrgType(orgForm.type); if (!r.valid) setErrors(e => ({ ...e, orgType: r.error })); } }}
                >
                  <SelectTrigger className={cn('h-12 rounded-xl border-gray-200 bg-gray-50 text-base pr-10', showOrgTErr && 'border-red-500', orgT.valid && touched.orgType && 'border-green-500')}>
                    <SelectValue placeholder="בחר סוג" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {orgT.valid && touched.orgType && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none z-10" />}
                {showOrgTErr && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500 pointer-events-none z-10" />}
              </div>
              {showOrgTErr && <p className="text-xs text-red-500">{errors.orgType}</p>}
            </div>
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Home className="w-5 h-5 text-teal-600" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-zinc-800">נכס ראשון</h3>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">שם הנכס *</Label>
                <Input
                  value={propertyForm.name}
                  onChange={e => { setPropertyForm(p => ({ ...p, name: e.target.value.slice(0, 100) })); setErrors(er => ({ ...er, propName: '' })); }}
                  onBlur={() => { setTouched(t => ({ ...t, propName: true })); const r = validatePropertyName(propertyForm.name); if (!r.valid) setErrors(e => ({ ...e, propName: r.error })); }}
                  placeholder="למשל: וילה בכנרת"
                  maxLength={100}
                  className={cn('h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base pr-10', showPropNErr && 'border-red-500', propN.valid && touched.propName && 'border-green-500')}
                />
                {showPropNErr && <p className="text-xs text-red-500">{errors.propName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">מספר חדרים *</Label>
                  <Input
                    type="number"
                    value={propertyForm.bedrooms}
                    onChange={e => { setPropertyForm(p => ({ ...p, bedrooms: e.target.value })); setErrors(er => ({ ...er, propRooms: '' })); }}
                    onBlur={() => { setTouched(t => ({ ...t, propRooms: true })); const r = validateRooms(propertyForm.bedrooms); if (!r.valid) setErrors(e => ({ ...e, propRooms: r.error })); }}
                    placeholder="3"
                    min={1}
                    max={100}
                    className={cn('h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base pr-10', showPropRErr && 'border-red-500', propR.valid && touched.propRooms && 'border-green-500')}
                  />
                  {showPropRErr && <p className="text-xs text-red-500">{errors.propRooms}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">מחיר ללילה (₪) *</Label>
                  <div className="relative">
                    <span className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 text-base z-10">₪</span>
                    <Input
                      value={propertyForm.base_price}
                      onChange={e => { setPropertyForm(p => ({ ...p, base_price: e.target.value.replace(/[^\d.]/g, '') })); setErrors(er => ({ ...er, propPrice: '' })); }}
                      onBlur={() => { setTouched(t => ({ ...t, propPrice: true })); const r = validatePricePerNight(propertyForm.base_price); if (!r.valid) setErrors(e => ({ ...e, propPrice: r.error })); }}
                      placeholder="800"
                      maxLength={10}
                      className={cn('h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base pr-12 pl-8', showPropPErr && 'border-red-500', propP.valid && touched.propPrice && 'border-green-500')}
                      dir="ltr"
                    />
                    {showPropPErr && <p className="text-xs text-red-500">{errors.propPrice}</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={goBack} className="h-12 px-5 rounded-xl border-gray-200 gap-2 font-semibold">
                <ArrowRight className="w-4 h-4" />
                חזור
              </Button>
              <Button
                onClick={handleSaveOrgAndProperty}
                disabled={!combinedValid || saving}
                className="flex-1 h-12 text-base font-bold rounded-xl gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors duration-200"
              >
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowLeft className="w-5 h-5" />}
                {saving ? 'שומר...' : 'הבא'}
              </Button>
            </div>
          </div>
        );
      }

      /* ─── Step 2: Plan Selection ─── */
      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 bg-teal-500/8 border border-teal-600/15">
                <Crown className="w-6 h-6 text-teal-700" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">בחר את התוכנית שמתאימה לך</h2>
              <p className="text-sm text-zinc-600 mt-1 leading-relaxed">כל התוכניות כוללות 14 יום ניסיון חינם</p>
            </div>
            <div className="space-y-3">
              {PLANS.map(plan => (
                <motion.button
                  key={plan.key}
                  type="button"
                  onClick={() => handleSelectPlan(plan.key)}
                  whileHover={reduceMotion ? undefined : { y: -1 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.995 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={cn(
                    'w-full text-right p-4 rounded-xl border-2 transition-shadow duration-300 atlas-ease-out-trans hover:shadow-md',
                    selectedPlanKey === plan.key
                      ? 'border-teal-600/50 bg-teal-500/6 shadow-sm'
                      : plan.recommended
                        ? 'border-teal-500/25 bg-teal-500/[0.03]'
                        : 'border-zinc-100 bg-white',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-zinc-900">{plan.name}</span>
                        {plan.recommended && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-600/20 text-teal-800">מומלץ</span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 text-zinc-600 font-normal leading-relaxed">{plan.desc}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {plan.features.slice(0, 3).map(f => (
                          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full text-zinc-600 bg-zinc-100">{f}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-left flex-shrink-0 mr-2">
                      <div className="text-lg font-extrabold text-zinc-900 atlas-tabular">₪{plan.price}</div>
                      <div className="text-[10px] text-zinc-500">לחודש</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={goBack} className="h-12 px-5 rounded-xl border-gray-200 gap-2 font-semibold">
                <ArrowRight className="w-4 h-4" />
                חזור
              </Button>
            </div>
            <button onClick={handleSkipPlan} disabled={saving} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
              אדלג לעכשיו →
            </button>
          </div>
        );

      /* ─── Step 3: Done ─── */
      case 3:
        return (
          <div className="text-center py-4">
            <div className="mb-6 flex justify-center" style={{ minHeight: 120 }}>
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-fade-in">
                <defs>
                  <linearGradient id="successCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34D399" stopOpacity="1" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="successGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34D399" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="54" fill="url(#successGlow)" />
                <circle cx="60" cy="60" r="44" fill="url(#successCircleGrad)" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                <path d="M38 60 L52 74 L82 44" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-2">המתחם שלך מוכן!</h2>
            <p className="text-sm text-zinc-600 mb-6 leading-relaxed">הכל מוגדר ומוכן לשימוש</p>

            {(createdOrgName || createdPropertyName) && (
              <div className="rounded-xl p-4 mb-6 space-y-2 text-right bg-zinc-50 border border-zinc-100">
                {createdOrgName && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-teal-500/8 border border-teal-600/15">
                      <Building2 className="w-3.5 h-3.5 text-teal-700" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500">ארגון</p>
                      <p className="text-sm font-semibold text-zinc-900">{createdOrgName}</p>
                    </div>
                  </div>
                )}
                {createdPropertyName && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-teal-500/8 border border-teal-600/15">
                      <Home className="w-3.5 h-3.5 text-teal-700" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500">נכס</p>
                      <p className="text-sm font-semibold text-zinc-900">{createdPropertyName}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleFinish}
              disabled={saving}
              className="w-full h-12 text-base font-bold rounded-xl gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors duration-200"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowLeft className="w-5 h-5" />}
              {saving ? 'מעביר...' : 'כניסה ללוח הבקרה'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
      style={{ fontFamily: "'Heebo', sans-serif", background: '#FFFFFF' }}
      onKeyDown={handleKeyDown}
    >
      {/* Subtle gradient blobs (landing page style) */}
      <div className="atlas-onb-blob atlas-onb-blob-1" />
      <div className="atlas-onb-blob atlas-onb-blob-2" />
      <div className="atlas-onb-blob atlas-onb-blob-3" />

      <div className="w-full max-w-[520px] relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <img
            src="/atlas-logo-final.png"
            alt="ATLAS"
            style={{ height: 56, width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Progress — spring-driven fill + step chips */}
        <div className="mb-4">
          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 95, damping: 22, mass: 0.8 }}
              style={{
                background: 'linear-gradient(90deg, #00D1C1 0%, #089b8e 100%)',
              }}
            />
          </div>
          <div className="flex justify-center gap-1.5 mt-3" aria-hidden>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <motion.span
                key={i}
                layout
                className={cn(
                  'h-1.5 rounded-full',
                  i === step ? 'w-7 bg-teal-600' : 'w-1.5 bg-zinc-200',
                )}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              />
            ))}
          </div>
          <p className="text-xs mt-2 text-center text-zinc-500 font-medium tabular-nums">
            שלב {step + 1} מתוך {TOTAL_STEPS}
          </p>
        </div>

        {/* Card — app style */}
        <div
          className="rounded-[20px] p-8 overflow-hidden bg-white border border-zinc-100 shadow-[0_4px_24px_rgba(15,23,42,0.06)]"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduceMotion ? false : { opacity: 0, x: direction > 0 ? -20 : 20, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={reduceMotion ? undefined : { opacity: 0, x: direction > 0 ? 14 : -14, filter: 'blur(4px)' }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 110, damping: 24, mass: 0.88 }
              }
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .atlas-onb-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .atlas-onb-blob-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #5EEAD4 0%, transparent 70%);
          opacity: 0.09;
          top: -120px; right: -150px;
        }
        .atlas-onb-blob-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #94A3B8 0%, transparent 70%);
          opacity: 0.05;
          top: 40%; left: -180px;
        }
        .atlas-onb-blob-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #99F6E4 0%, transparent 70%);
          opacity: 0.06;
          bottom: -80px; left: 50%;
          transform: translateX(-50%);
        }
      `}</style>
    </div>
  );
}
