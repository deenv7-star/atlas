import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { validateEmail } from '@/lib/validation';
import { checkRateLimit, recordAttempt, clearAttempts } from '@/lib/authRateLimit';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (signInError) throw signInError;

      clearAttempts(form.email);
      const currentUser = await loginUser(null);
      const returnUrl = searchParams.get('return');
      const dest = currentUser?.onboarding_completed ? (returnUrl || '/Dashboard') : '/onboarding';
      navigate(dest, { replace: true });
    } catch (err) {
      recordAttempt(form.email);
      const msg = (err.message || '').toLowerCase();
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 px-4 py-12" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <img src="/atlas-logo-final.png" alt="ATLAS" className="mx-auto mb-6" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">ברוכים השבים</h1>
          <p className="text-gray-500 text-sm mt-2">הזן את הפרטים שלך כדי להתחבר</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">כתובת אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                onBlur={handleBlur('email')}
                className={cn("h-12 rounded-xl text-base", touched.email && errors.email && "border-red-500")}
                autoComplete="email"
                autoFocus={!prefilledEmail}
                maxLength={255}
              />
              {touched.email && errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">סיסמה</Label>
                <Link to="/reset-password" className="text-sm text-indigo-600 hover:text-indigo-700">שכחתי סיסמה</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  className={cn("h-12 rounded-xl text-base pl-10", touched.password && errors.password && "border-red-500")}
                  autoComplete="current-password"
                  maxLength={128}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#111827] hover:bg-black text-white font-bold rounded-xl gap-2">
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn className="w-5 h-5" />}
              {isLoading ? 'מתחבר...' : 'כניסה'}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-1.5 mt-6 text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <p className="text-xs">המידע שלך מאובטח ומוגן בהצפנה מתקדמת</p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          אין לך חשבון? <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">צור חשבון חינמי</Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-3">
          <Link to="/" className="hover:text-gray-600">חזרה לדף הבית</Link>
        </p>
      </div>
    </div>
  );
}
