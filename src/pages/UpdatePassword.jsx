import { Wordmark } from '@/components/app/shell/shared';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { initialAuthUrlError } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { validatePassword, getPasswordStrength } from '@/lib/validation';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { cn } from '@/lib/utils';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [errors, setErrors] = useState({});

  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [linkError] = useState(() => initialAuthUrlError());
  // The recovery link signs the user in (session from the URL). No session and no error = opened
  // without a link or after it was used; give the auth listener a moment before deciding.
  const [graceOver, setGraceOver] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGraceOver(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const linkInvalid = Boolean(linkError) || (graceOver && !isLoadingAuth && !isAuthenticated);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const handleBlur = (field) => () => {
    setTouched(t => ({ ...t, [field]: true }));
    if (field === 'password') {
      const r = validatePassword(form.password);
      setErrors(e => ({ ...e, password: r.valid ? null : r.error }));
    } else {
      setErrors(e => ({ ...e, confirmPassword: form.password === form.confirmPassword ? null : 'הסיסמאות לא תואמות' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    const r = validatePassword(form.password);
    if (!r.valid) { setErrors(e => ({ ...e, password: r.error })); return; }
    if (form.password !== form.confirmPassword) { setErrors(e => ({ ...e, confirmPassword: 'הסיסמאות לא תואמות' })); return; }

    setIsLoading(true);
    try {
      if (!supabase) throw new Error('אין חיבור כרגע. נסו שוב בעוד רגע.');
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) throw error;
      atlasToastApi.success('הסיסמה עודכנה');
      // The recovery session stays signed in; go straight to the app.
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = String(err?.message || '');
      const code = String(err?.code || '');
      if (code === 'same_password' || /different from the old/i.test(msg)) {
        setErrors((e) => ({ ...e, password: 'הסיסמה החדשה צריכה להיות שונה מהקודמת' }));
      } else if (code === 'session_not_found' || /session/i.test(msg)) {
        atlasToastApi.error('פג תוקף הקישור. בקשו קישור חדש לאיפוס.');
      } else {
        atlasToastApi.error(/[\u0590-\u05FF]/.test(msg) ? msg : 'לא הצלחנו לעדכן את הסיסמה. נסו שוב.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(form.password);
  const pValid = validatePassword(form.password).valid;
  const canSubmit = form.password && form.confirmPassword && pValid && form.password === form.confirmPassword;

  if (linkInvalid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-canvas" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>
        <div className="w-full max-w-[440px] text-center">
          <div className="mb-6 flex justify-center"><Wordmark size={30} /></div>
          <div className="v7-card p-8">
            <h1 className="text-2xl font-extrabold text-navy-900">פג תוקף הקישור</h1>
            <p className="text-ink-600 text-[15px] mt-2 leading-relaxed" role="status">
              הקישור לאיפוס הסיסמה כבר לא בתוקף, או שכבר השתמשו בו. שלחו לעצמכם קישור חדש, הוא תקף לשעה.
            </p>
            <Button asChild className="mt-6 w-full h-12 font-bold rounded-xl">
              <Link to="/reset-password">שליחת קישור חדש</Link>
            </Button>
          </div>
          <p className="text-center text-sm mt-6">
            <Link to="/login" className="inline-flex min-h-[44px] items-center text-brand-600 hover:text-brand-700 font-semibold">חזרה להתחברות</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif", background: '#F7F8FB' }}>
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <div className="mb-6 flex justify-center"><Wordmark size={30} /></div>
          <h1 className="text-2xl font-extrabold text-gray-900">סיסמה חדשה</h1>
          <p className="text-ink-600 text-sm mt-2">בחרו סיסמה חדשה וחזקה</p>
        </div>

        <div className="v7-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="password">סיסמה חדשה</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="לפחות 8 תווים, ספרה ואות"
                  value={form.password}
                  onChange={set('password')}
                  onBlur={handleBlur('password')}
                  className={cn("h-12 rounded-xl text-base pl-10 pr-10", touched.password && errors.password && "border-red-500")}
                  autoFocus
                  maxLength={128}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute left-0.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[8px] text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'הסתרת הסיסמה' : 'הצגת הסיסמה'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(passwordStrength.score / 5) * 100}%`, background: passwordStrength.color }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: passwordStrength.textColor }}>{passwordStrength.label}</span>
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
                  placeholder="הקלידו שוב את הסיסמה"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  className={cn("h-12 rounded-xl text-base pl-10", touched.confirmPassword && errors.confirmPassword && "border-red-500")}
                  maxLength={128}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute left-0.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[8px] text-gray-400 hover:text-gray-600" aria-label={showConfirm ? 'הסתרת הסיסמה' : 'הצגת הסיסמה'}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" disabled={!canSubmit || isLoading} className="w-full h-12 font-bold rounded-xl">
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'עדכון הסיסמה'}
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="inline-flex min-h-[44px] items-center text-brand-600 hover:text-brand-700 font-semibold">חזרה להתחברות</Link>
        </p>
      </div>
    </div>
  );
}
