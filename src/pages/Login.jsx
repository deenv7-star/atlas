import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, UserPlus, Building2, Eye, EyeOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { isSupabaseConfigured, isLocalApiConfigured } from '@/api/supabaseClient';
import { cn } from '@/lib/utils';

// Show real-auth UI when either Supabase or the local REST API is available
const isRealAuthConfigured = isSupabaseConfigured || isLocalApiConfigured;

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name:         '',
    email:             '',
    password:          '',
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
      // ── Real auth (Supabase or local REST API) ─────────────────────────────
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
            email:             form.email.trim(),
            password:          form.password,
            full_name:         form.full_name.trim(),
            organization_name: form.organization_name.trim() || `${form.full_name.trim()}'s Organization`,
          });

          if (data?.user && !data.session) {
            // Email confirmation required
            setError('');
            setIsLoading(false);
            alert('נשלח לך אימייל לאימות החשבון. אנא בדוק את תיבת הדואר שלך.');
            return;
          }
        } else {
          await base44.auth.signIn({
            email:    form.email.trim(),
            password: form.password,
          });
        }

        // loginUser(null) triggers a server-side profile fetch via onAuthStateChange
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
      // ── localStorage fallback (no backend configured) ──────────────────────
      if (!form.full_name.trim()) {
        setError('נא למלא שם מלא וכתובת אימייל');
        return;
      }

      const userObj = {
        id:                `user_${Date.now()}`,
        full_name:         form.full_name.trim(),
        email:             form.email.trim(),
        organization_id:   `org_${Date.now()}`,
        organization_name: form.organization_name.trim() || 'הארגון שלי',
        subscription_plan: 'pro',
        created_date:      new Date().toISOString(),
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
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B1220] via-[#0f1d35] to-[#0B1220] px-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#00D1C1] flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-[#0B1220]" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">ATLAS</span>
          </div>
          <p className="text-white/50 text-sm">מערכת ניהול נכסים לטווח קצר</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">

          {/* Mode tabs — show when any real auth is configured */}
          {isRealAuthConfigured && (
            <div className="flex rounded-xl bg-white/5 p-1 mb-6 gap-1">
              {[
                { value: 'login',  label: 'כניסה',    icon: LogIn },
                { value: 'signup', label: 'הרשמה',    icon: UserPlus },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => { setMode(value); setError(''); }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all',
                    mode === value
                      ? 'bg-[#00D1C1] text-[#0B1220] shadow-sm'
                      : 'text-white/50 hover:text-white/80'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          )}

          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            {isRealAuthConfigured
              ? (mode === 'login' ? 'כניסה לחשבון' : 'יצירת חשבון חדש')
              : 'כניסה למערכת'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name — shown on signup or when no real auth configured */}
            {(!isRealAuthConfigured || mode === 'signup') && (
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-white/70 text-sm">שם מלא</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="ישראל ישראלי"
                  value={form.full_name}
                  onChange={set('full_name')}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#00D1C1] focus:ring-[#00D1C1]/30"
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/70 text-sm">כתובת אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#00D1C1] focus:ring-[#00D1C1]/30"
                autoComplete={mode === 'login' ? 'email' : 'email'}
                required
              />
            </div>

            {/* Password — shown when any real auth is configured */}
            {isRealAuthConfigured && (
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/70 text-sm">סיסמה</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'signup' ? 'לפחות 8 תווים' : '••••••••'}
                    value={form.password}
                    onChange={set('password')}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#00D1C1] focus:ring-[#00D1C1]/30 pl-10"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    minLength={mode === 'signup' ? 8 : undefined}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Organization name — signup only (real auth) */}
            {isRealAuthConfigured && mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="org" className="text-white/70 text-sm">שם הארגון (אופציונלי)</Label>
                <Input
                  id="org"
                  type="text"
                  placeholder="חברת הנכסים שלי"
                  value={form.organization_name}
                  onChange={set('organization_name')}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#00D1C1] focus:ring-[#00D1C1]/30"
                />
              </div>
            )}

            {/* Org name for localStorage mode */}
            {!isRealAuthConfigured && (
              <div className="space-y-1.5">
                <Label htmlFor="org" className="text-white/70 text-sm">שם הארגון (אופציונלי)</Label>
                <Input
                  id="org"
                  type="text"
                  placeholder="חברת הנכסים שלי"
                  value={form.organization_name}
                  onChange={set('organization_name')}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#00D1C1] focus:ring-[#00D1C1]/30"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-semibold h-11 rounded-xl mt-2 gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
              ) : mode === 'signup' ? (
                <UserPlus className="w-4 h-4" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isLoading ? 'מתחבר...' : mode === 'signup' ? 'צור חשבון' : 'כניסה'}
            </Button>
          </form>

          {/* Footer note */}
          <p className="text-white/30 text-xs text-center mt-6 leading-relaxed">
            {isRealAuthConfigured
              ? 'המידע שלך מאובטח ומוגן בענן.'
              : 'המידע נשמר באופן מקומי בדפדפן שלך.\nאין צורך בחשבון חיצוני.'}
          </p>
        </div>
      </div>
    </div>
  );
}
