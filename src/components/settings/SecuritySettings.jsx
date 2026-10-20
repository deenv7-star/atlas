import React, { useState } from 'react';
import { Eye, EyeOff, Shield, AlertCircle, KeyRound } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { validatePassword, getPasswordStrength } from '@/lib/validation';
import { cn } from '@/lib/utils';

const CONFIRM_WORD = 'מחיקה';
const hebrewOr = (msg, fallback) => (/[\u0590-\u05FF]/.test(String(msg || '')) ? msg : fallback);

function PasswordField({ id, label, value, onChange, autoComplete, error, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[14px] font-medium text-navy-900">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          maxLength={128}
          dir="ltr"
          className={cn('h-12 rounded-[12px] pl-12 text-base', error && 'border-danger-500')}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'הסתרת הסיסמה' : 'הצגת הסיסמה'}
          className="absolute left-0.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 hover:text-navy-900"
        >
          {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {hint}
      {error && <p className="text-[14px] text-danger-600" role="alert">{error}</p>}
    </div>
  );
}

function ChangePassword({ user }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const strength = getPasswordStrength(next);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!current) errs.current = 'הקלידו את הסיסמה הנוכחית';
    const v = validatePassword(next);
    if (!v.valid) errs.next = v.error;
    else if (next === current) errs.next = 'הסיסמה החדשה צריכה להיות שונה מהנוכחית';
    if (next !== confirm) errs.confirm = 'הסיסמאות לא תואמות';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!isSupabaseConfigured || !supabase) {
      atlasToastApi.error('אפשר לשנות סיסמה רק בחשבון אמיתי, לא בהדגמה');
      return;
    }
    setBusy(true);
    try {
      // Re-authenticate with the current password before changing it.
      const { error: reauthErr } = await supabase.auth.signInWithPassword({ email: user?.email, password: current });
      if (reauthErr) {
        // Only a real credentials refusal means the password is wrong; a timeout / rate limit / network error is not the user's fault.
        if (reauthErr.code === 'invalid_credentials' || (reauthErr.status === 400 && /invalid/i.test(reauthErr.message || ''))) setErrors({ current: 'הסיסמה הנוכחית שגויה' });
        else atlasToastApi.error(reauthErr.status === 429 ? 'יותר מדי ניסיונות. חכו דקה ונסו שוב.' : 'השרת לא ענה בזמן. הסיסמה לא שונתה, נסו שוב בעוד רגע.');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        if (error.code === 'same_password') setErrors({ next: 'הסיסמה החדשה צריכה להיות שונה מהנוכחית' });
        else atlasToastApi.error(hebrewOr(error.message, 'לא הצלחנו לעדכן את הסיסמה. נסו שוב.'));
        return;
      }
      setCurrent(''); setNext(''); setConfirm('');
      atlasToastApi.success('הסיסמה עודכנה');
    } catch {
      atlasToastApi.error('לא הצלחנו לעדכן את הסיסמה. נסו שוב.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex items-center gap-2">
        <KeyRound className="h-[18px] w-[18px] text-ink-400" aria-hidden />
        <p className="text-[15px] font-bold text-navy-900">שינוי סיסמה</p>
      </div>
      <PasswordField id="pw-current" label="סיסמה נוכחית" value={current} onChange={setCurrent} autoComplete="current-password" error={errors.current} />
      <PasswordField
        id="pw-new"
        label="סיסמה חדשה"
        value={next}
        onChange={setNext}
        autoComplete="new-password"
        error={errors.next}
        hint={next ? (
          <div className="flex items-center gap-2 pt-1" aria-live="polite">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8EAF2]">
              <div className="h-full rounded-full transition-[width]" style={{ width: `${(strength.score / 5) * 100}%`, background: strength.color }} />
            </div>
            <span className="text-[13px] font-medium" style={{ color: strength.textColor }}>{strength.label}</span>
          </div>
        ) : <p className="text-[13px] text-ink-400">לפחות 8 תווים, עם אות וספרה</p>}
      />
      <PasswordField id="pw-confirm" label="אימות הסיסמה החדשה" value={confirm} onChange={setConfirm} autoComplete="new-password" error={errors.confirm} />
      <Button type="submit" disabled={busy} className="h-11 w-full sm:w-auto">
        {busy ? 'מעדכנים…' : 'עדכון הסיסמה'}
      </Button>
    </form>
  );
}

function DeleteAccount({ onDeleted }) {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (word.trim() !== CONFIRM_WORD) return;
    setBusy(true);
    setError('');
    try {
      const res = await base44.auth.deleteAccount({ confirm: word.trim() });
      if (!res?.ok) throw new Error('');
      setOpen(false);
      await onDeleted(res);
    } catch (e) {
      // Nothing was deleted: say so and keep the user signed in.
      setError(hebrewOr(e?.message, 'המחיקה לא בוצעה. שום דבר לא נמחק. נסו שוב או כתבו ל־support@atlas-il.com'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="rounded-[14px] border border-[#F3D4D4] p-4">
        <p className="text-[15px] font-bold text-navy-900">מחיקת החשבון</p>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-600">
          החשבון שלכם יימחק. אם אין עוד אנשים בחשבון העסק, יימחקו גם היחידות, ההזמנות, הלידים, התשלומים וכל שאר הנתונים. אי אפשר לשחזר.
        </p>
        <Button
          variant="outline"
          className="mt-3 h-11 gap-2 border-[#F3D4D4] text-danger-600 hover:bg-[#FDF2F2]"
          onClick={() => { setWord(''); setError(''); setOpen(true); }}
        >
          <AlertCircle className="h-4 w-4" />
          מחיקת החשבון
        </Button>
      </div>
      <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <DialogContent dir="rtl" className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-right">למחוק את החשבון לצמיתות?</DialogTitle>
            <DialogDescription className="text-right leading-relaxed">
              כדי לאשר, הקלידו <b className="text-navy-900">{CONFIRM_WORD}</b>. אחרי המחיקה תצאו מהחשבון, ואי אפשר לבטל.
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="אישור מחיקה"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder={CONFIRM_WORD}
            className="h-12 text-base"
            autoComplete="off"
          />
          {error && <p className="text-[14px] text-danger-600" role="alert">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
            <Button
              className="h-11 bg-danger-600 text-white hover:bg-danger-700"
              disabled={word.trim() !== CONFIRM_WORD || busy}
              onClick={run}
            >
              {busy ? 'מוחקים…' : 'מחיקה לצמיתות'}
            </Button>
            <Button variant="outline" className="h-11" disabled={busy} onClick={() => setOpen(false)}>ביטול</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function SecuritySettings({ user, onDeleted }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[18px] font-bold">אבטחה</CardTitle>
        <CardDescription>הסיסמה, אימות דו-שלבי ומחיקת החשבון</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChangePassword user={user} />
        <div className="h-px bg-line" />
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-ink-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-navy-900">אימות דו-שלבי</p>
            <p className="mt-0.5 text-[14px] text-ink-600">עוד לא זמין. נעדכן אתכם כשאפשר יהיה להפעיל.</p>
          </div>
          <span className="inline-flex h-7 flex-shrink-0 items-center rounded-full bg-[#EEF0FF] px-3 text-[13px] font-semibold text-brand-700">בקרוב</span>
        </div>
        <div className="h-px bg-line" />
        <DeleteAccount onDeleted={onDeleted} />
      </CardContent>
    </Card>
  );
}
