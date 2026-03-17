import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { validatePassword, getPasswordStrength } from '@/lib/validation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked reset link
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) throw error;
      toast.success('הסיסמה עודכנה בהצלחה');
      navigate('/Login?success=' + encodeURIComponent('הסיסמה עודכנה. התחבר עם הסיסמה החדשה.'), { replace: true });
    } catch (err) {
      toast.error(err.message || 'אירעה שגיאה. נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(form.password);
  const pValid = validatePassword(form.password).valid;
  const canSubmit = form.password && form.confirmPassword && pValid && form.password === form.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif", background: '#FFFFFF' }}>
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <img src="/atlas-logo-final.png" alt="ATLAS" className="mx-auto mb-6" style={{ height: 48, width: 'auto' }} />
          <h1 className="text-2xl font-extrabold text-gray-900">סיסמה חדשה</h1>
          <p className="text-gray-500 text-sm mt-2">בחר סיסמה חזקה חדשה</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
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
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
                  className={cn("h-12 rounded-xl text-base pl-10", touched.confirmPassword && errors.confirmPassword && "border-red-500")}
                  maxLength={128}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" disabled={!canSubmit || isLoading} className="w-full h-12 bg-[#111827] hover:bg-black text-white font-bold rounded-xl">
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'עדכן סיסמה'}
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/Login" className="text-indigo-600 hover:text-indigo-700 font-semibold">חזרה להתחברות</Link>
        </p>
      </div>
    </div>
  );
}
