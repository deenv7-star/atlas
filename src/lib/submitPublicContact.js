import { LOCAL_API_URL } from '@/api/supabaseClient';

/**
 * POST /api/public/contact — same-origin in prod, or VITE_API_URL / dev Express.
 * @returns {{ ok: boolean, status: number, data?: object }}
 */
export async function submitPublicContact(payload) {
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
  const to = 'support@atlas-app.co.il';
  const subj = encodeURIComponent(`ATLAS — ${subject || 'פנייה מהאתר'}`);
  const body = encodeURIComponent(
    `שם: ${name}\nאימייל: ${email}\nטלפון: ${phone || '—'}\nנושא: ${subject || '—'}\n\n${message}`
  );
  return `mailto:${to}?subject=${subj}&body=${body}`;
}
