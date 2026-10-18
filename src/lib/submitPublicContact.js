import { LOCAL_API_URL, supabase, isSupabaseConfigured } from '@/api/supabaseClient';

/**
 * Public contact form.
 * Production (Supabase): inserts into public.contact_messages (migration 013b: anon insert-only RLS,
 * server-side rate limit; platform admins read them in the admin console).
 * Without Supabase: POST /api/public/contact on the Express server.
 * @returns {{ ok: boolean, status: number, data?: object }}
 */
export async function submitPublicContact(payload) {
  if (payload?.website) return { ok: false, status: 204, data: {} }; // honeypot
  if (isSupabaseConfigured && supabase) {
    const row = {
      name: String(payload.name || '').slice(0, 120),
      email: String(payload.email || '').slice(0, 200),
      phone: payload.phone ? String(payload.phone).slice(0, 40) : null,
      subject: payload.subject ? String(payload.subject).slice(0, 200) : null,
      message: String(payload.message || '').slice(0, 5000),
      source: 'contact',
    };
    const { error } = await supabase.from('contact_messages').insert(row);
    if (!error) return { ok: true, status: 201, data: {} };
    const msg = /[\u0590-\u05FF]/.test(error.message || '')
      ? error.message
      : (error.code === '23514' ? 'חלק מהפרטים לא תקינים. בדקו את האימייל ואת אורך ההודעה.' : 'לא הצלחנו לשלוח. נסו שוב או כתבו ל־support@atlas-il.com');
    return { ok: false, status: 400, data: { error: msg } };
  }
  const base = LOCAL_API_URL || '';
  const url = `${base}/api/public/contact`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 204) {
    return { ok: false, status: 204, data: {} };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function buildContactMailto({ name, email, phone, subject, message }) {
  const to = 'support@atlas-il.com';
  const subj = encodeURIComponent(`ATLAS: ${subject || 'פנייה מהאתר'}`);
  const body = encodeURIComponent(
    `שם: ${name}\nאימייל: ${email}\nטלפון: ${phone || '—'}\nנושא: ${subject || '—'}\n\n${message}`
  );
  return `mailto:${to}?subject=${subj}&body=${body}`;
}
