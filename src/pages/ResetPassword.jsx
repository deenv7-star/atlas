import AuthShell from '@/components/app/AuthShell';
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

  // ecosystem v1 #18: same shell as /login (logo, layout, field style), not a separate centred card
  const field = (bad) => cn(
    'h-12 rounded-[16px] border bg-white text-base md:text-base text-navy-900 text-right shadow-[0_1px_2px_rgba(16,24,64,0.04)] placeholder:text-ink-300 focus-visible:border-brand-500 focus-visible:ring-[3px] focus-visible:ring-[rgba(62,43,241,0.14)] focus-visible:ring-offset-0',
    bad ? 'border-danger-500' : 'border-line',
  );

  if (sent) {
    return (
      <AuthShell caption="חוזרים לצימר בכמה שניות.">
        <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.02em] text-navy-900">בדקו את המייל</h1>
        <p className="mt-2 text-[15px] text-ink-600">אם יש חשבון עם <bdi dir="ltr">{email.trim()}</bdi>, שלחנו אליו קישור לאיפוס הסיסמה. חפשו גם בספאם. הקישור תקף לשעה.</p>
        <Link to="/login" className="mt-6 inline-flex min-h-[44px] items-center font-semibold text-brand-600 hover:text-brand-700">חזרה להתחברות</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell caption="חוזרים לצימר בכמה שניות.">
      <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.02em] text-navy-900">איפוס סיסמה</h1>
      <p className="mt-1.5 text-[15px] text-ink-600">כתבו את המייל שאיתו נרשמתם, ונשלח קישור לאיפוס.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[14px] font-medium text-navy-900">מייל</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={handleBlur}
            className={field(touched && error)}
            dir="ltr"
            autoComplete="email"
            autoFocus
            maxLength={255}
          />
          {touched && error && <p className="text-[14px] text-danger-600">{error}</p>}
        </div>
        <Button type="submit" size="lg" disabled={isLoading} className="h-12 w-full text-[15px] font-semibold">
          {isLoading ? 'שולחים…' : 'שליחת קישור לאיפוס'}
        </Button>
      </form>
      <p className="mt-6 text-[15px]">
        <Link to="/login" className="inline-flex min-h-[44px] items-center font-semibold text-brand-600 hover:text-brand-700">חזרה להתחברות</Link>
      </p>
    </AuthShell>
  );
}
