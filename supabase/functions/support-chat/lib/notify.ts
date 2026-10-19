// Tell the ATLAS team a customer asked for a human. Every channel is optional and off unless its
// secret is set; a failure here never blocks the customer's handoff.
//   RESEND_API_KEY + SUPPORT_NOTIFY_EMAIL   → email (Resend, free tier 3,000/month)
//   SUPPORT_NOTIFY_WEBHOOK                  → POST JSON (e.g. a Telegram bot / ntfy / Slack relay)
//   SUPPORT_ADMIN_URL                       → base for the inbox link (default https://atlas-il.com)
export type Handoff = { conversation_id: string; customer: string; email: string | null; phone: string | null; org: string | null; reason: string; last_question: string };

export function inboxLink(convId: string) {
  return `${(Deno.env.get('SUPPORT_ADMIN_URL') || 'https://atlas-il.com').replace(/\/$/, '')}/admin/support?c=${convId}`;
}

export async function notifyHandoff(h: Handoff): Promise<string[]> {
  const sent: string[] = [];
  const text = `פנייה חדשה לנציג ב-atlas\n${h.customer}${h.org ? ` · ${h.org}` : ''}${h.phone ? ` · ${h.phone}` : ''}\nסיבה: ${h.reason}\nשאלה: ${h.last_question}\n${inboxLink(h.conversation_id)}`;
  const resend = Deno.env.get('RESEND_API_KEY'), to = Deno.env.get('SUPPORT_NOTIFY_EMAIL');
  if (resend && to) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: Deno.env.get('SUPPORT_NOTIFY_FROM') || 'atlas <onboarding@resend.dev>',
          to: to.split(',').map((s) => s.trim()),
          subject: `atlas · פנייה לנציג: ${h.customer}`,
          text,
        }),
      });
      if (r.ok) sent.push('email');
    } catch { /* never block the customer */ }
  }
  const hook = Deno.env.get('SUPPORT_NOTIFY_WEBHOOK');
  if (hook) {
    try {
      const r = await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, ...h, link: inboxLink(h.conversation_id) }) });
      if (r.ok) sent.push('webhook');
    } catch { /* ignore */ }
  }
  return sent;
}
