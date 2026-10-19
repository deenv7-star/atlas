import { Wordmark } from '@/components/app/shell/shared';
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
      atlasToastApi.success('אם הכתובת רשומה, שלחנו אליה קישור לאיפוס');
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('rate limit')) {
        atlasToastApi.error('יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.');
      } else if (msg.includes('invalid') || msg.includes('not found')) {
        setError('כתובת אימייל לא רשומה במערכת');
      } else {
        atlasToastApi.error(err.message || 'לא הצלחנו לשלוח את הקישור. נסו שוב בעוד רגע.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif", background: '#F7F8FB' }}>
        <div className="w-full max-w-[440px] text-center">
          <div className="mb-6 flex justify-center"><Wordmark size={30} /></div>
          <div className="v7-card p-6">
            <p className="text-navy-900 font-bold text-lg">שלחנו לכם קישור לאיפוס הסיסמה</p>
            <p className="text-ink-600 text-sm mt-2">בדקו את תיבת המייל (וגם את הספאם). הקישור תקף לשעה.</p>
          </div>
          <Link to="/login" className="inline-flex min-h-[44px] items-center mt-6 text-brand-600 hover:text-brand-700 font-semibold">חזרה להתחברות</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif", background: '#F7F8FB' }}>
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <div className="mb-6 flex justify-center"><Wordmark size={30} /></div>
          <h1 className="text-2xl font-extrabold text-gray-900">איפוס סיסמה</h1>
          <p className="text-gray-500 text-sm mt-2">כתבו את כתובת האימייל, ונשלח לכם קישור לאיפוס</p>
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
            <Button type="submit" disabled={isLoading} className="w-full h-12 font-bold rounded-xl">
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'שליחת קישור לאיפוס'}
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
