/**
 * Local demo backend for support (no Supabase): one localStorage document shared by the customer
 * widget and the /admin demo inbox in the same browser, so the whole handoff can be tried end to end.
 * Same row shapes as migration 020.
 */
const KEY = 'atlas_support_demo_v1';
const EVT = 'atlas-support-demo';

function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d?.conversations && d?.messages) return d; } catch { /* ignore */ }
  return seed();
}
function save(d) {
  localStorage.setItem(KEY, JSON.stringify(d));
  window.dispatchEvent(new Event(EVT));
}
const now = () => new Date().toISOString();
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();

/** Two finished sample threads from other demo customers so the admin inbox is not empty. */
function seed() {
  const c1 = { id: 'demo-c1', org_id: 'org_shira', org_name: 'בקתות שירה', user_id: 'user_shira', user_email: 'shira@baktot.co.il', user_name: 'שירה כהן', user_phone: '0527771234', status: 'open', mode: 'human', subject: 'איך מחזירים כסף לאורח שביטל?', handoff_at: ago(38), handoff_reason: 'keyword', unhelpful_count: 0, unread_admin: 1, unread_user: 0, last_message_at: ago(36), last_message_preview: 'הוא ביטל אתמול ושילם מקדמה של 600', last_sender: 'user', context: { plan: 'pro', units: 4, channels: ['BOOKING_COM', 'AIRBNB'], org_name: 'בקתות שירה' }, page_path: '/payments', created_at: ago(40) };
  const c2 = { id: 'demo-c2', org_id: 'org_avi', org_name: 'וילה בכרם', user_id: 'user_avi', user_email: 'avi@villa.co.il', user_name: 'אבי מזרחי', user_phone: '0549876543', status: 'closed', mode: 'bot', subject: 'איך שולחים הוראות הגעה?', handoff_at: null, handoff_reason: null, unhelpful_count: 0, unread_admin: 0, unread_user: 0, last_message_at: ago(60 * 26), last_message_preview: 'פותחים את ההזמנה ולוחצים שליחה בוואטסאפ', last_sender: 'bot', context: { plan: 'starter', units: 1, channels: [], org_name: 'וילה בכרם' }, page_path: '/bookings', created_at: ago(60 * 26 + 3) };
  const m = (conv, sender, body, min, extra = {}) => ({ id: crypto.randomUUID(), conversation_id: conv.id, user_id: conv.user_id, org_id: conv.org_id, sender, body, links: [], meta: {}, feedback: null, created_at: ago(min), ...extra });
  return {
    conversations: [c1, c2],
    messages: [
      m(c1, 'user', 'איך מחזירים כסף לאורח שביטל?', 40),
      m(c1, 'bot', 'ATLAS רושמת תשלומים אבל לא מעבירה כסף, אז את ההחזר עצמו עושים כמו שקיבלתם אותו (ביט, העברה). אחרי ההחזר, פותחים את ההזמנה ← **עריכה** ← סטטוס **בוטלה**.\n\nרוצים שנציג יעבור על זה איתכם?', 39, { meta: { confidence: 'medium', offer_handoff: true }, model: 'gpt-6-luna' }),
      m(c1, 'system', 'העברנו את השיחה לנציג מצוות ATLAS. הוא רואה את כל מה שכתבתם, ויענה כאן באותו חלון. אפשר להמשיך לכתוב בינתיים.', 38),
      m(c1, 'user', 'הוא ביטל אתמול ושילם מקדמה של 600', 36),
      m(c2, 'user', 'איך שולחים הוראות הגעה?', 60 * 26 + 3),
      m(c2, 'bot', '1. פותחים את ההזמנה.\n2. לוחצים **שליחה בוואטסאפ** ובוחרים **הוראות הגעה**.\n3. בודקים את ההודעה ושולחים מוואטסאפ.', 60 * 26 + 2, { links: [{ label: 'הזמנות', path: '/bookings' }], meta: { confidence: 'high' }, model: 'gpt-6-luna' }),
    ],
  };
}

export const demoStore = {
  read: load,
  write(fn) { const d = load(); const r = fn(d); save(d); return r; },
  subscribe(cb) {
    const on = () => cb();
    const onStorage = (e) => { if (e.key === KEY) cb(); };
    window.addEventListener(EVT, on);
    window.addEventListener('storage', onStorage);
    const t = setInterval(on, 4000); // safety net for tabs that miss storage events
    return () => { window.removeEventListener(EVT, on); window.removeEventListener('storage', onStorage); clearInterval(t); };
  },
  now,
};
