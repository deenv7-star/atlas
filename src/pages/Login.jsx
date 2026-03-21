import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, Shield } from 'lucide-react';
import { validateEmail } from '@/lib/validation';
import { checkRateLimit, recordAttempt, clearAttempts } from '@/lib/authRateLimit';
import { getSafeReturnUrl } from '@/config/routes';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LiquidBackground } from '@/components/ui/LiquidGlass';
import { ShimmerButton } from '@/components/ui/AnimatedButton';

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledEmail = searchParams.get('email') || '';
  const successMsg = searchParams.get('success');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ email: prefilledEmail, password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (prefilledEmail) setForm(f => ({ ...f, email: prefilledEmail }));
  }, [prefilledEmail]);

  useEffect(() => {
    if (successMsg) toast.success(decodeURIComponent(successMsg));
  }, [successMsg]);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const handleBlur = (field) => () => {
    setTouched(t => ({ ...t, [field]: true }));
    if (field === 'email') {
      const r = validateEmail(form.email);
      setErrors(e => ({ ...e, email: r.valid ? null : r.error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!form.email.trim()) { setErrors(e => ({ ...e, email: 'שדה חובה' })); return; }
    if (!form.password) { setErrors(e => ({ ...e, password: 'שדה חובה' })); return; }

    const rl = checkRateLimit(form.email);
    if (!rl.allowed) {
      toast.error(`נסה שוב בעוד ${rl.retryAfter} שניות`);
      return;
    }

    setIsLoading(true);
    try {
      await base44.auth.signIn({ email: form.email.trim(), password: form.password });
      clearAttempts(form.email);
      await loginUser(null);
      const rawReturn = searchParams.get('return');
      const safeReturn = getSafeReturnUrl(rawReturn);
      try { localStorage.setItem('login_just_completed', String(Date.now())); } catch {}
      navigate(safeReturn || '/dashboard', { replace: true });
    } catch (err) {
      recordAttempt(form.email);
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('invalid') || msg.includes('credentials')) {
        setErrors({ email: 'אימייל או סיסמה שגויים', password: 'אימייל או סיסמה שגויים' });
      } else if (msg.includes('email not confirmed')) {
        toast.error('יש לאמת את כתובת האימייל תחילה. בדוק את תיבת הדואר.');
      } else {
        toast.error(err.message || 'אירעה שגיאה. נסה שוב.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LiquidBackground
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #0B1220 0%, #0f1a2e 50%, #0a1628 100%)' }}
      dir="rtl"
    >
      <motion.div
        className="w-full max-w-[440px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ fontFamily: "'Heebo', sans-serif" }}
      >
        {/* Logo & heading */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <img
            src="/atlas-logo-final.png"
            alt="ATLAS"
            className="mx-auto mb-6"
            style={{ height: 52, width: 'auto', objectFit: 'contain', filter: 'brightness(1.15)' }}
          />
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#fff' }}>
            ברוכים השבים
          </h1>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            הזן את הפרטים שלך כדי להתחבר
          </p>
        </motion.div>

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45 }}
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(40px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.6)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: `
              0 8px 40px rgba(0,0,0,0.35),
              0 2px 12px rgba(0,0,0,0.20),
              inset 0 1px 0 rgba(255,255,255,0.12),
              inset 0 -1px 0 rgba(0,0,0,0.15)
            `,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            style={{
              background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.07) 50%, transparent 65%)',
              borderRadius: '24px',
            }}
          />
          {/* Top highlight */}
          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(0,209,193,0.5) 40%, rgba(139,92,246,0.4) 70%, transparent)',
            }}
          />

          <form onSubmit={handleSubmit} className="space-y-5" style={{ position: 'relative', zIndex: 1 }}>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500 }}>
                כתובת אימייל
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                onBlur={handleBlur('email')}
                className={cn("h-12 rounded-xl text-base", touched.email && errors.email && "border-red-500")}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: touched.email && errors.email ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.14)',
                  color: '#fff',
                }}
                autoComplete="email"
                autoFocus={!prefilledEmail}
                maxLength={255}
              />
              {touched.email && errors.email && (
                <p className="text-sm" style={{ color: '#f87171' }}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500 }}>
                  סיסמה
                </Label>
                <Link
                  to="/reset-password"
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#00D1C1' }}
                >
                  שכחתי סיסמה
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  className={cn("h-12 rounded-xl text-base pl-10", touched.password && errors.password && "border-red-500")}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: touched.password && errors.password ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.14)',
                    color: '#fff',
                  }}
                  autoComplete="current-password"
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-sm" style={{ color: '#f87171' }}>{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <ShimmerButton
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-2 text-base"
              style={{
                background: isLoading
                  ? 'linear-gradient(135deg, #0f1a2e 0%, #1e2d4a 100%)'
                  : 'linear-gradient(135deg, #00D1C1 0%, #00a89a 100%)',
                color: isLoading ? 'rgba(255,255,255,0.6)' : '#0B1220',
                boxShadow: isLoading ? 'none' : '0 4px 20px rgba(0,209,193,0.35), inset 0 1px 0 rgba(255,255,255,0.20)',
              }}
            >
              {isLoading
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <LogIn className="w-5 h-5" />
              }
              {isLoading ? 'מתחבר...' : 'כניסה'}
            </ShimmerButton>
          </form>

          <div className="flex items-center justify-center gap-1.5 mt-6" style={{ color: 'rgba(255,255,255,0.30)' }}>
            <Shield className="w-3.5 h-3.5" />
            <p className="text-xs">המידע שלך מאובטח ומוגן בהצפנה מתקדמת</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.40)' }}>
            אין לך חשבון?{' '}
            <Link
              to="/register"
              className="font-semibold transition-colors"
              style={{ color: '#00D1C1' }}
            >
              צור חשבון חינמי
            </Link>
          </p>
          <p className="text-center text-xs mt-3">
            <Link
              to="/"
              className="transition-colors"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              חזרה לדף הבית
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </LiquidBackground>
  );
}
