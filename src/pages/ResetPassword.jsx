import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateEmail } from '@/lib/validation';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { cn } from '@/lib/utils';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    const r = validateEmail(email);
    setError(r.valid ? '' : r.error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const r = validateEmail(email);
    if (!r.valid) { setError(r.error); return; }

    setIsLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (err) throw err;
      setSent(true);
      atlasToastApi.success('שלחנו לך מייל עם קישור לאיפוס הסיסמה');
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('rate limit')) {
        atlasToastApi.error('יותר מדי ניסיונות. נסה שוב מאוחר יותר.');
      } else if (msg.includes('invalid') || msg.includes('not found')) {
        setError('כתובת אימייל לא רשומה במערכת');
      } else {
        atlasToastApi.error(err.message || 'אירעה שגיאה. נסה שוב.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif", background: '#FFFFFF' }}>
        <div className="w-full max-w-[440px] text-center">
          <img src="/atlas-logo-final.png" alt="ATLAS" className="mx-auto mb-8" style={{ height: 56, width: 'auto' }} />
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
            <p className="text-emerald-800 font-bold text-lg">שלחנו לך מייל עם קישור לאיפוס הסיסמה</p>
            <p className="text-emerald-700 text-sm mt-2">בדוק את תיבת הדואר (וגם בתיקיית הספאם)</p>
          </div>
          <Link to="/login" className="inline-block mt-6 text-indigo-600 hover:text-indigo-700 font-semibold">חזרה להתחברות</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif", background: '#FFFFFF' }}>
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <img src="/atlas-logo-final.png" alt="ATLAS" className="mx-auto mb-6" style={{ height: 56, width: 'auto' }} />
          <h1 className="text-2xl font-extrabold text-gray-900">איפוס סיסמה</h1>
          <p className="text-gray-500 text-sm mt-2">הזן את כתובת האימייל ונשלח לך קישור לאיפוס</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">כתובת אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={handleBlur}
                className={cn("h-12 rounded-xl text-base", touched && error && "border-red-500")}
                autoFocus
                maxLength={255}
              />
              {touched && error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#111827] hover:bg-black text-white font-bold rounded-xl">
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'שלח קישור לאיפוס סיסמה'}
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">חזרה להתחברות</Link>
        </p>
      </div>
    </div>
  );
}
