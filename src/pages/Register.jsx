import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield, ArrowLeft, Check, X } from 'lucide-react';
import { validateEmail, validatePassword, getPasswordStrength } from '@/lib/validation';
import { checkRateLimit, recordAttempt, clearAttempts } from '@/lib/authRateLimit';
import { mapAuthErrorToHebrew } from '@/lib/authErrors';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Register() {
  const navigate = useNavigate();
  const { loginUser, isLoadingAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setEmailExists(false);
    if (errors[field]) {
      const v = field === 'email' ? validateEmail(e.target.value) : field === 'password' ? validatePassword(e.target.value) : { valid: e.target.value === form.password };
      setErrors(e => ({ ...e, [field]: v.valid ? null : v.error }));
    }
  };

  const validate = useCallback(() => {
    const e = {};
    const emailRes = validateEmail(form.email);
    if (!emailRes.valid) e.email = emailRes.error;
    const passRes = validatePassword(form.password);
    if (!passRes.valid) e.password = passRes.error;
    if (form.password !== form.confirmPassword) e.confirmPassword = 'הסיסמאות לא תואמות';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form.email, form.password, form.confirmPassword]);

  const handleBlur = (field) => () => {
    setTouched(t => ({ ...t, [field]: true }));
    if (field === 'email') {
      const r = validateEmail(form.email);
      setErrors(e => ({ ...e, email: r.valid ? null : r.error }));
    } else if (field === 'password') {
      const r = validatePassword(form.password);
      setErrors(e => ({ ...e, password: r.valid ? null : r.error }));
    } else if (field === 'confirmPassword') {
      setErrors(e => ({ ...e, confirmPassword: form.password === form.confirmPassword ? null : 'הסיסמאות לא תואמות' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true });
    if (!validate()) return;

    const rl = checkRateLimit(form.email);
    if (!rl.allowed) {
      toast.error(`נסה שוב בעוד ${rl.retryAfter} שניות`);
      return;
    }

    setIsLoading(true);
    setEmailExists(false);
    try {
      const data = await base44.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        full_name: '',
        organization_name: '',
      });
      clearAttempts(form.email);

      if (data?.user && !data?.session) {
        toast.success('נשלח מייל לאימות');
        navigate('/verify-email', { state: { email: form.email.trim() }, replace: true });
      } else if (data?.session) {
        await loginUser(null);
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase();
      const code = String(err?.code || '').toLowerCase();
      const duplicate =
        msg.includes('already registered') ||
        msg.includes('already exists') ||
        code === 'user_already_exists';
      if (duplicate) {
        setEmailExists(true);
        recordAttempt(form.email);
      } else {
        recordAttempt(form.email);
        const mapped = mapAuthErrorToHebrew(err);
        if (mapped?.kind === 'toast') {
          toast.error(mapped.message);
        } else {
          const isNetworkError = msg.includes('failed to fetch') || msg.includes('network') || err?.name === 'TypeError';
          const isApiMissing = err?.status === 404 || msg.includes('http 404');
          if (isApiMissing) {
            toast.error(
              'שרת ה-API לא נמצא. אם האתר מוצג כקבצים סטטיים בלבד, הגדר Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY) או פרוס את שרת Express והפנה את הנתיב /api אליו.'
            );
          } else {
            toast.error(isNetworkError ? 'שגיאת חיבור. בדוק את החיבור לאינטרנט וודא שהשרת פעיל.' : (err?.message || 'אירעה שגיאה. נסה שוב.'));
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(form.password);
  const canSubmit = form.email && form.password && form.confirmPassword && !errors.email && !errors.password && form.password === form.confirmPassword;

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50/30" dir="rtl">
        <div
          className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"
          role="status"
          aria-label="טוען"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 px-4 py-12" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <img src="/atlas-logo-final.png" alt="ATLAS" className="mx-auto mb-6" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">התחל לנהל חכם יותר</h1>
          <p className="text-gray-500 text-sm mt-2">צור חשבון חינמי ותתחיל לנהל את המתחם שלך</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
          {emailExists ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-amber-800 font-semibold">כתובת המייל הזו כבר רשומה במערכת</p>
              </div>
              <Link to={`/login?email=${encodeURIComponent(form.email)}`}>
                <Button className="w-full h-12 bg-[#111827] hover:bg-black text-white font-bold rounded-xl gap-2">
                  התחבר עם מייל זה
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">כתובת אימייל</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="הזן כתובת מייל"
                    value={form.email}
                    onChange={set('email')}
                    onBlur={handleBlur('email')}
                    className={cn(
                      "h-12 rounded-xl text-base pr-10",
                      touched.email && errors.email ? "border-red-500 focus:border-red-500" : "border-gray-200",
                      touched.email && !errors.email && form.email ? "border-emerald-500" : ""
                    )}
                    autoComplete="email"
                    autoFocus
                    maxLength={255}
                  />
                  {touched.email && (errors.email ? <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" /> : form.email && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />)}
                </div>
                {touched.email && errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">סיסמה</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="לפחות 8 תווים, ספרה ואות"
                    value={form.password}
                    onChange={set('password')}
                    onBlur={handleBlur('password')}
                    className={cn(
                      "h-12 rounded-xl text-base pl-10 pr-10",
                      touched.password && errors.password ? "border-red-500" : "border-gray-200",
                      touched.password && !errors.password && form.password ? "border-emerald-500" : ""
                    )}
                    autoComplete="new-password"
                    maxLength={128}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {touched.password && (errors.password ? <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" /> : form.password && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />)}
                </div>
                {form.password && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(passwordStrength.score / 5) * 100}%`, background: passwordStrength.color }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                  </div>
                )}
                {touched.password && errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="הזן שוב את הסיסמה"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    className={cn(
                      "h-12 rounded-xl text-base pr-10",
                      touched.confirmPassword && errors.confirmPassword ? "border-red-500" : "border-gray-200",
                      touched.confirmPassword && !errors.confirmPassword && form.confirmPassword && form.password === form.confirmPassword ? "border-emerald-500" : ""
                    )}
                    autoComplete="new-password"
                    maxLength={128}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {touched.confirmPassword && (errors.confirmPassword ? <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" /> : form.confirmPassword && form.password === form.confirmPassword && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />)}
                </div>
                {touched.confirmPassword && errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>

              <Button type="submit" disabled={!canSubmit || isLoading} className="w-full h-12 bg-[#111827] hover:bg-black text-white font-bold rounded-xl gap-2">
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowLeft className="w-5 h-5" />}
                {isLoading ? 'יוצר חשבון...' : 'צור חשבון חינמי'}
              </Button>
            </form>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-6 text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <p className="text-xs">המידע שלך מאובטח ומוגן בהצפנה מתקדמת</p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          יש לך חשבון?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">התחבר</Link>
        </p>
      </div>
    </div>
  );
}
