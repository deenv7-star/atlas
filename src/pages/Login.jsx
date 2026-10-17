import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthShell from '@/components/app/AuthShell';
import { validateEmail } from '@/lib/validation';
import { checkRateLimit, recordAttempt, clearAttempts } from '@/lib/authRateLimit';
import { getSafeReturnUrl } from '@/config/routes';
import { mapAuthErrorToHebrew } from '@/lib/authErrors';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { cn } from '@/lib/utils';

export default function Login() {
  const { loginUser, isLoadingAuth } = useAuth();
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
    if (successMsg) atlasToastApi.success(decodeURIComponent(successMsg));
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
      atlasToastApi.error(`נסה שוב בעוד ${rl.retryAfter} שניות`);
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
      const mapped = mapAuthErrorToHebrew(err);
      if (mapped?.kind === 'fields') {
        setErrors(mapped.fields || { email: mapped.message, password: mapped.message });
      } else if (mapped?.kind === 'toast') {
        atlasToastApi.error(mapped.message);
      } else {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('invalid') || msg.includes('credentials')) {
          setErrors({ email: 'אימייל או סיסמה שגויים', password: 'אימייל או סיסמה שגויים' });
        } else if (msg.includes('email not confirmed')) {
          atlasToastApi.error('יש לאמת את כתובת האימייל תחילה. בדוק את תיבת הדואר.');
        } else if (err?.status === 404 || msg.includes('http 404')) {
          atlasToastApi.error(
            'שרת ה-API לא נמצא. הגדר Supabase או שרת Express עם הפניה ל-/api.'
          );
        } else {
          atlasToastApi.error(err.message || 'אירעה שגיאה. נסה שוב.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F8FB' }} dir="rtl">
        <div
          className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"
          role="status"
          aria-label="טוען"
        />
      </div>
    );
  }

  const field = (bad) => cn(
    'h-12 rounded-[10px] border bg-white text-base text-navy-900 shadow-[0_1px_2px_rgba(16,24,64,0.04)] placeholder:text-ink-300 focus-visible:border-brand-500 focus-visible:ring-[3px] focus-visible:ring-[rgba(62,43,241,0.14)] focus-visible:ring-offset-0',
    bad ? 'border-danger-500' : 'border-line',
  );

  return (
    <AuthShell>
      <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-navy-900 md:text-[28px]">ברוכים השבים</h1>
      <p className="mt-1.5 text-[15px] text-ink-400">נכנסים, ורואים מה קורה היום בצימר.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[14px] font-medium text-navy-900">אימייל</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={set('email')}
            onBlur={handleBlur('email')}
            className={field(touched.email && errors.email)}
            dir="ltr"
            autoComplete="email"
            autoFocus={!prefilledEmail}
            maxLength={255}
          />
          {touched.email && errors.email && <p className="text-[14px] text-danger-600">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[14px] font-medium text-navy-900">סיסמה</Label>
            <Link to="/reset-password" className="-my-2 inline-flex min-h-[44px] items-center px-1 text-[14px] font-medium text-brand-600 hover:underline">שכחתי סיסמה</Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              className={cn(field(touched.password && errors.password), 'pl-12')}
              autoComplete="current-password"
              maxLength={128}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'הסתרת הסיסמה' : 'הצגת הסיסמה'}
              className="press absolute left-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 hover:text-navy-900"
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
          {touched.password && errors.password && <p className="text-[14px] text-danger-600">{errors.password}</p>}
        </div>

        <Button type="submit" size="lg" disabled={isLoading} className="h-12 w-full text-[15px] font-semibold">
          {isLoading ? 'מתחברים…' : 'כניסה'}
        </Button>
      </form>

      <p className="mt-8 text-center text-[15px] text-ink-600">
        עוד אין לכם חשבון?{' '}
        <Link to="/register" className="font-bold text-brand-600 hover:underline">פתיחת חשבון</Link>
      </p>
      <p className="mt-6 flex items-center justify-center gap-1.5 text-[13px] text-ink-400">
        <Shield className="h-3.5 w-3.5" />החיבור מוצפן ומאובטח
      </p>
    </AuthShell>
  );
}
