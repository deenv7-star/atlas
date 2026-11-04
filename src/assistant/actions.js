/**
 * The only place an assistant proposal becomes a real action, and only after the owner tapped "אישור".
 * Each kind uses the app's normal path, so RLS, validation and caches behave exactly like a manual action:
 *   create_booking   → base44.entities.Booking.create (same as "שמירת הזמנה" in הזמנות)
 *   guest_message    → opens WhatsApp with the text (the owner presses send there); never sends by itself
 *   support_handoff  → support chat: the summary as a message, then "שיחה עם נציג"
 */
import { base44 } from '@/api/base44Client';
import { supportApi } from '@/support/api';
import { queryClientInstance } from '@/lib/query-client';

export const ACTION_COPY = {
  create_booking: { title: 'הזמנה חדשה', confirm: 'שמירת ההזמנה', done: 'ההזמנה נשמרה', open: 'פתיחת ההזמנה' },
  guest_message: { title: 'הודעה לאורח', confirm: 'פתיחה בוואטסאפ', done: 'נפתח בוואטסאפ', open: 'פתיחת ההזמנה' },
  support_handoff: { title: 'פנייה לנציג', confirm: 'העברה לנציג', done: 'הפנייה הועברה לנציג', open: null },
};

async function propertyIdByName(name) {
  const list = await base44.entities.Property.list().catch(() => []);
  return list.find((p) => p.name === name)?.id || null;
}

/** → { ok, href?, message? }. Throws on failure (the card shows the Hebrew line). */
export async function performAction(p, { user, page } = {}) {
  if (p.kind === 'create_booking') {
    const d = { ...(p.payload || {}) };
    if (!d.property_id && d.unit_name) d.property_id = await propertyIdByName(d.unit_name);
    if (!d.property_id) throw new Error('לא מצאנו את היחידה. פתחו את ההזמנה ידנית ממסך הזמנות.');
    delete d.unit_name;
    const orgId = user?.organization_id ?? user?.org_id;
    const row = await base44.entities.Booking.create(orgId ? { org_id: orgId, ...d } : d);
    queryClientInstance.invalidateQueries(); // the new booking shows at once in היום, יומן and הזמנות
    return { ok: true, href: row?.id ? `/booking/${row.id}` : '/bookings' };
  }
  if (p.kind === 'guest_message') {
    const link = p.client?.wa_link;
    if (!link) return { ok: false, href: p.display?.booking_link, message: 'אין לאורח מספר טלפון שמור. הוסיפו מספר במסך ההזמנה, או העתיקו את הנוסח.' };
    window.open(link, '_blank', 'noopener,noreferrer');
    return { ok: true, href: p.display?.booking_link };
  }
  if (p.kind === 'support_handoff') {
    const device = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches ? 'mobile' : 'desktop';
    // hand off first (opens a human conversation), then the summary: in human mode the help bot stays quiet
    const h = await supportApi.handoff({ reason: 'button', user, page, device });
    await supportApi.send({ conversationId: h?.conversation_id, text: `מהעוזר: ${p.display?.text || ''}`.slice(0, 1900), user, page, device }).catch(() => null);
    return { ok: true, message: 'נציג מצוות atlas ימשיך בחלון העזרה. הצוות זמין 24/7.' };
  }
  throw new Error('הפעולה הזו לא נתמכת.');
}
