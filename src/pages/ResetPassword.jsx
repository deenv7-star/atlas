import { Wordmark } from '@/components/app/shell/shared';
import { heError } from '@/lib/heError';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateEmail } from '@/lib/validation';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { cn } from '@/lib/utils';
import { publicOrigin } from '@/lib/native';

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
        redirectTo: `${publicOrigin()}/update-password`,
      });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      // COPY-027: one neutral answer whether or not the address has an account (no account enumeration)
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('rate limit')) {
        atlasToastApi.error('יותר מדי ניסיונות. חכו כמה דקות ונסו שוב.');
      } else if (msg.includes('invalid') || msg.includes('not found')) {
        setSent(true);
      } else {
        atlasToastApi.error(heError(err, 'לא הצלחנו לשלוח את הקישור. בדקו את החיבור ונסו שוב.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif", background: '#F7F8FB' }}>
        <div className="w-full max-w-[440px] text-center">
          <div className="mb-6 flex justify-center"><Wordmark size={30} /></div>
          <div className="v7-card p-6">
            <p className="text-navy-900 font-bold text-lg">בדקו את המייל</p>
            <p className="text-ink-600 text-sm mt-2">אם יש חשבון עם {email.trim()}, שלחנו אליו קישור לאיפוס הסיסמה. חפשו גם בספאם. הקישור תקף לשעה.</p>
          </div>
          <Link to="/login" className="inline-flex min-h-[44px] items-center mt-6 text-brand-600 hover:text-brand-700 font-semibold">חזרה להתחברות</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif", background: '#F7F8FB' }}>
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <div className="mb-6 flex justify-center"><Wordmark size={30} /></div>
          <h1 className="text-2xl font-extrabold text-gray-900">איפוס סיסמה</h1>
          <p className="text-gray-500 text-sm mt-2">כתבו את המייל שאיתו נרשמתם, ונשלח קישור לאיפוס</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">מייל</Label>
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
            <Button type="submit" disabled={isLoading} className="w-full h-12 font-bold rounded-xl">
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'שליחת קישור לאיפוס'}
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="inline-flex min-h-[44px] items-center text-brand-600 hover:text-brand-700 font-semibold">חזרה להתחברות</Link>
        </p>
      </div>
    </main>
  );
}
