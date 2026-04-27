/**
 * Maps Supabase / REST auth errors to user-facing Hebrew copy.
 * Callers may also attach err.code from Supabase AuthApiError.
 */

export function mapAuthErrorToHebrew(err) {
  const code = String(err?.code || '').toLowerCase();
  const msg = String(err?.message || '').toLowerCase();

  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return { kind: 'toast', message: 'יש לאמת את כתובת האימייל תחילה. בדוק את תיבת הדואר.' };
  }
  if (
    code === 'user_banned' ||
    code === 'otp_disabled' ||
    msg.includes('user is banned') ||
    msg.includes('banned') ||
    (msg.includes('disabled') && msg.includes('user'))
  ) {
    return { kind: 'toast', message: 'החשבון הושבת או נחסם. פנה לתמיכה.' };
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
      message: 'אימייל או סיסמה שגויים',
      fields: { email: 'אימייל או סיסמה שגויים', password: 'אימייל או סיסמה שגויים' },
    };
  }
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'too_many_requests' ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  ) {
    return { kind: 'toast', message: 'יותר מדי ניסיונות. המתן דקה ונסה שוב.' };
  }
  if (code === 'weak_password' || msg.includes('weak password')) {
    return { kind: 'toast', message: 'הסיסמה חלשה מדי. בחר סיסמה חזקה יותר.' };
  }
  if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
    return { kind: 'toast', message: 'כתובת המייל כבר רשומה במערכת.' };
  }

  return null;
}
