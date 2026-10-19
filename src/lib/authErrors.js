/**
 * Maps Supabase / REST auth errors to user-facing Hebrew copy.
 * Callers may also attach err.code from Supabase AuthApiError.
 */

export function mapAuthErrorToHebrew(err) {
  const code = String(err?.code || '').toLowerCase();
  const msg = String(err?.message || '').toLowerCase();

  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return { kind: 'toast', message: 'עוד צעד קטן: שלחנו לכם מייל. לחצו על הקישור שבו ותיכנסו.' };
  }
  if (
    code === 'user_banned' ||
    code === 'otp_disabled' ||
    msg.includes('user is banned') ||
    msg.includes('banned') ||
    (msg.includes('disabled') && msg.includes('user'))
  ) {
    return { kind: 'toast', message: 'החשבון הזה מושהה. כתבו לנו בוואטסאפ ונבדוק.' };
  }
  if (
    code === 'invalid_credentials' ||
    code === 'invalid_grant' ||
    msg.includes('invalid login credentials') ||
    msg.includes('invalid credentials') ||
    (msg.includes('invalid') && msg.includes('password'))
  ) {
    return {
      kind: 'fields',
      message: 'המייל או הסיסמה לא נכונים',
      fields: { email: 'המייל או הסיסמה לא נכונים', password: 'המייל או הסיסמה לא נכונים' },
    };
  }
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'too_many_requests' ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  ) {
    return { kind: 'toast', message: 'יותר מדי ניסיונות. חכו דקה ונסו שוב.' };
  }
  if (code === 'weak_password' || msg.includes('weak password')) {
    return { kind: 'toast', message: 'קל לנחש את הסיסמה הזו. נסו סיסמה ארוכה יותר, עם אות וספרה.' };
  }
  if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
    return { kind: 'toast', message: 'המייל הזה כבר רשום. התחברו או אפסו סיסמה.' };
  }

  return null;
}
