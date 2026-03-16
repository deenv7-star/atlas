import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, UserPlus, Eye, EyeOff, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { isSupabaseConfigured, isLocalApiConfigured } from '@/api/supabaseClient';
import { cn } from '@/lib/utils';

const isRealAuthConfigured = isSupabaseConfigured || isLocalApiConfigured;

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    organization_name: '',
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) {
      setError('נא להזין כתובת אימייל');
      return;
    }

    if (isRealAuthConfigured) {
      if (!form.password) {
        setError('נא להזין סיסמה');
        return;
      }

      setIsLoading(true);
      try {
        if (mode === 'signup') {
          if (!form.full_name.trim()) {
            setError('נא להזין שם מלא');
            setIsLoading(false);
            return;
          }

          const { data } = await base44.auth.signUp({
            email: form.email.trim(),
            password: form.password,
            full_name: form.full_name.trim(),
            organization_name: form.organization_name.trim() || `${form.full_name.trim()}'s Organization`,
          });

          if (data?.user && !data.session) {
            setError('');
            setIsLoading(false);
            alert('נשלח לך אימייל לאימות החשבון. אנא בדוק את תיבת הדואר שלך.');
            return;
          }
        } else {
          await base44.auth.signIn({
            email: form.email.trim(),
            password: form.password,
          });
        }

        await loginUser(null);
        const returnUrl = searchParams.get('return');
        navigate(returnUrl || '/Dashboard', { replace: true });
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
          setError('אימייל או סיסמה שגויים');
        } else if (msg.includes('Email not confirmed')) {
          setError('יש לאמת את כתובת האימייל תחילה. בדוק את תיבת הדואר.');
        } else if (msg.includes('User already registered')) {
          setError('כתובת אימייל זו כבר רשומה. נסה להתחבר.');
        } else {
          setError(msg || 'אירעה שגיאה. נסה שוב.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!form.full_name.trim()) {
        setError('נא למלא שם מלא וכתובת אימייל');
        return;
      }

      const userObj = {
        id: `user_${Date.now()}`,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        organization_id: `org_${Date.now()}`,
        organization_name: form.organization_name.trim() || 'הארגון שלי',
        subscription_plan: 'pro',
        created_date: new Date().toISOString(),
      };

      loginUser(userObj);
      const returnUrl = searchParams.get('return');
      if (returnUrl) {
        window.location.href = returnUrl;
      } else {
        navigate('/Dashboard');
      }
    }
  };

  return (
    <div
      className="min-h-screen flex"
      dir="rtl"
      style={{ fontFamily: "'Heebo', sans-serif" }}
    >
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 items-center justify-center p-12">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-indigo-400/10 blur-2xl" />

        <div className="relative text-center max-w-md z-10">
          <img
            src="/atlas-logo-final.png"
            alt="ATLAS"
            className="mx-auto mb-8"
            style={{ height: 72, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            ניהול מתחמי נופש
            <br />
            פשוט יותר מאי פעם
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed mb-10">
            הזמנות, תשלומים, ניקיון, תקשורת — הכל במקום אחד.
            <br />
            הצטרפו ל-500+ מנהלי נכסים שכבר סומכים עלינו.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { num: '500+', label: 'נכסים' },
              { num: '98%', label: 'שביעות רצון' },
              { num: '3 שעות', label: 'חסכון ביום' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="text-xl font-bold text-white">{s.num}</div>
                <div className="text-xs text-indigo-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/atlas-logo-final.png"
              alt="ATLAS"
              className="mx-auto mb-3"
              style={{ height: 48, width: 'auto', objectFit: 'contain' }}
            />
            <p className="text-gray-500 text-sm">מערכת ניהול מתחמי נופש</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">

            {/* Mode tabs */}
            {isRealAuthConfigured && (
              <div className="flex rounded-xl bg-gray-100 p-1 mb-7 gap-1">
                {[
                  { value: 'login', label: 'כניסה', icon: LogIn },
                  { value: 'signup', label: 'הרשמה', icon: UserPlus },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => { setMode(value); setError(''); }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                      mode === value
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}

            <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">
              {isRealAuthConfigured
                ? (mode === 'login' ? 'ברוכים השבים' : 'יצירת חשבון חדש')
                : 'כניסה למערכת'}
            </h2>
            <p className="text-sm text-gray-400 text-center mb-6">
              {isRealAuthConfigured
                ? (mode === 'login' ? 'הזן את הפרטים שלך כדי להתחבר' : 'הירשם בחינם — ללא כרטיס אשראי')
                : 'הזן את הפרטים שלך כדי להתחיל'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name */}
              {(!isRealAuthConfigured || mode === 'signup') && (
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-gray-700 text-sm font-medium">שם מלא</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="ישראל ישראלי"
                    value={form.full_name}
                    onChange={set('full_name')}
                    className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 rounded-xl"
                    autoComplete="name"
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-700 text-sm font-medium">כתובת אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 rounded-xl"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              {isRealAuthConfigured && (
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-gray-700 text-sm font-medium">סיסמה</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'signup' ? 'לפחות 8 תווים' : '••••••••'}
                      value={form.password}
                      onChange={set('password')}
                      className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 rounded-xl pl-10"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      minLength={mode === 'signup' ? 8 : undefined}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Organization name */}
              {(isRealAuthConfigured ? mode === 'signup' : true) && (
                <div className="space-y-1.5">
                  <Label htmlFor="org" className="text-gray-700 text-sm font-medium">שם הארגון <span className="text-gray-400 font-normal">(אופציונלי)</span></Label>
                  <Input
                    id="org"
                    type="text"
                    placeholder="חברת הנכסים שלי"
                    value={form.organization_name}
                    onChange={set('organization_name')}
                    className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 h-11 rounded-xl"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold h-12 rounded-xl mt-2 gap-2 shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : mode === 'signup' ? (
                  <UserPlus className="w-4 h-4" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {isLoading ? 'מתחבר...' : mode === 'signup' ? 'צור חשבון חינם' : 'כניסה'}
              </Button>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-center gap-1.5 mt-6 text-gray-400">
              <Shield className="w-3.5 h-3.5" />
              <p className="text-xs">
                {isRealAuthConfigured
                  ? 'המידע שלך מאובטח ומוגן בהצפנה מתקדמת'
                  : 'המידע נשמר באופן מקומי בדפדפן שלך'}
              </p>
            </div>
          </div>

          {/* Bottom link */}
          <p className="text-center text-xs text-gray-400 mt-6">
            <a href="/" className="text-indigo-500 hover:text-indigo-700 font-medium transition-colors">חזרה לדף הבית</a>
          </p>
        </div>
      </div>
    </div>
  );
}
