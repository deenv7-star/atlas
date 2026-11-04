// The brain's tools: ONE list for the text assistant (ai-chat) and the voice agent (voice-session).
//
// Read tools query Postgres with the OWNER'S JWT, so Row Level Security decides what they see:
// a tool can never read another business, even with a crafted id. Results are small and private:
// guests by first name only, never phone / email / notes / payment details.
//
// Write tools never write. They validate and return a PROPOSAL; the app shows it as a card and only
// the owner's tap on "אישור" performs it, with the app's normal code path (src/assistant/actions.js).
//
// Plain JS on purpose (Deno + node --test). `db` is a supabase-js client created with the user's JWT.
import { todayIL, isDay, addDays, nights, monthRange, clampRange, heDay } from './dates.js';
import { searchHelp } from './knowledge.js';

const ACTIVE_BOOKING = (s) => !['CANCELLED', 'CANCELED', 'WAITLIST', 'cancelled', 'canceled', 'waitlist'].includes(String(s || ''));
const PAID = new Set(['PAID', 'paid', 'COMPLETED', 'completed', 'SUCCEEDED', 'succeeded']);
const REFUNDED = new Set(['REFUNDED', 'refunded']);
const OPEN_LEAD = new Set(['NEW', 'CONTACTED', 'OFFER_SENT']);
const STATUS_HE = {
  PENDING: 'ממתינה לאישור', APPROVED: 'מאושרת', CONFIRMED: 'מאושרת', CHECKED_IN: 'האורחים במתחם', CHECKED_OUT: 'יצאו',
  CANCELLED: 'בוטלה', WAITLIST: 'רשימת המתנה', NEW: 'חדשה', CONTACTED: 'יצרתם קשר', OFFER_SENT: 'נשלחה הצעה', WON: 'נסגרה להזמנה', LOST: 'לא נסגרה',
};
const he = (s) => STATUS_HE[String(s || '').toUpperCase()] || String(s || '');
const first = (full) => {
  const s = String(full || '').trim();
  if (!s) return 'אורח';
  if (/^משפחת\s+/.test(s)) return s.split(/\s+/).slice(0, 2).join(' ');
  return s.split(/\s+/)[0];
};
const num = (v) => Math.round(Number(v) || 0);
const clip = (s, n) => String(s ?? '').slice(0, n);
const lim = (v, d, max) => Math.max(1, Math.min(max, Number.parseInt(v, 10) || d));

/* ── schemas (OpenAI function-calling JSON schema; the realtime session uses the same) ─────────── */
const day = (description) => ({ type: 'string', description: `${description} (YYYY-MM-DD)` });
export const TOOL_DEFS = [
  {
    name: 'get_day_overview',
    description: 'מה קורה ביום מסוים: מי מגיע, מי עוזב, מי נמצא במתחם, ומשימות ניקיון. ברירת מחדל: היום.',
    parameters: { type: 'object', additionalProperties: false, properties: { date: day('התאריך') } },
  },
  {
    name: 'find_bookings',
    description: 'חיפוש הזמנות לפי טווח תאריכי שהייה, שם אורח, יחידה או סטטוס. מחזיר רשימה קצרה עם מזהים.',
    parameters: {
      type: 'object', additionalProperties: false,
      properties: {
        from: day('תחילת הטווח'), to: day('סוף הטווח, לא כולל'),
        guest: { type: 'string', description: 'שם או חלק משם האורח' },
        unit: { type: 'string', description: 'שם היחידה, כמו שהבעלים קוראים לה' },
        status: { type: 'string', enum: ['active', 'pending', 'confirmed', 'cancelled', 'all'] },
        limit: { type: 'integer', minimum: 1, maximum: 25 },
      },
    },
  },
  {
    name: 'get_booking',
    description: 'פרטי הזמנה אחת לפי מזהה: תאריכים, יחידה, מספר אורחים, מחיר, כמה שולם ומה היתרה.',
    parameters: { type: 'object', additionalProperties: false, required: ['booking_id'], properties: { booking_id: { type: 'string' } } },
  },
  {
    name: 'check_availability',
    description: 'אילו יחידות פנויות בכל הלילות בין from ל-to (to = יום היציאה).',
    parameters: { type: 'object', additionalProperties: false, required: ['from', 'to'], properties: { from: day('יום ההגעה'), to: day('יום היציאה'), unit: { type: 'string' } } },
  },
  {
    name: 'get_leads',
    description: 'פניות של אורחים (לידים). ברירת מחדל: פניות שעוד מחכות לתשובה, הישנה ראשונה.',
    parameters: { type: 'object', additionalProperties: false, properties: { status: { type: 'string', enum: ['open', 'all'] }, limit: { type: 'integer', minimum: 1, maximum: 25 } } },
  },
  {
    name: 'get_money',
    description: 'כסף בטווח תאריכים: הכנסות מהזמנות (לפי לילות בטווח), תשלומים שהתקבלו, הוצאות לפי קטגוריה, ויתרות פתוחות. ברירת מחדל: החודש.',
    parameters: { type: 'object', additionalProperties: false, properties: { from: day('תחילת הטווח'), to: day('סוף הטווח, לא כולל') } },
  },
  {
    name: 'get_business_settings',
    description: 'הגדרות העסק: שם, מסלול וימי ניסיון, היחידות ומחיר הבסיס, ערוצי היומן שחוברו ומצב הסנכרון, הודעות האורחים שהופעלו.',
    parameters: { type: 'object', additionalProperties: false, properties: {} },
  },
  {
    name: 'search_help',
    description: 'חיפוש במדריך של atlas: איך עושים משהו באפליקציה, איפה מסך, מה המחיר, מה עוד לא עובד. השתמשו בזה לפני כל תשובה על יכולת של atlas.',
    parameters: { type: 'object', additionalProperties: false, required: ['query'], properties: { query: { type: 'string' } } },
  },
  {
    name: 'propose_booking',
    description: 'מכין הזמנה חדשה לאישור הבעלים. לא שומר כלום: הבעלים רואים כרטיס ולוחצים אישור. בודק שהיחידה פנויה.',
    parameters: {
      type: 'object', additionalProperties: false, required: ['unit', 'check_in', 'check_out', 'guest_name'],
      properties: {
        unit: { type: 'string', description: 'שם היחידה' }, check_in: day('הגעה'), check_out: day('יציאה'),
        guest_name: { type: 'string' }, adults: { type: 'integer', minimum: 1, maximum: 40 }, children: { type: 'integer', minimum: 0, maximum: 30 },
        total_price: { type: 'number', minimum: 0 }, notes: { type: 'string' },
      },
    },
  },
  {
    name: 'propose_guest_message',
    description: 'מכין הודעת וואטסאפ לאורח של הזמנה קיימת, לאישור הבעלים. לא שולח: אחרי אישור נפתח הוואטסאפ של הבעלים עם הנוסח.',
    parameters: { type: 'object', additionalProperties: false, required: ['booking_id', 'text'], properties: { booking_id: { type: 'string' }, text: { type: 'string', description: 'נוסח ההודעה בעברית, בלשון רבים, עד 600 תווים' } } },
  },
  {
    name: 'propose_support_handoff',
    description: 'מציע לבעלים להעביר את השאלה לנציג אנושי מצוות atlas (זמין 24/7). אחרי אישור נפתחת שיחה עם נציג.',
    parameters: { type: 'object', additionalProperties: false, required: ['summary'], properties: { summary: { type: 'string', description: 'תקציר קצר של הבקשה, בעברית' } } },
  },
];
export const TOOL_NAMES = TOOL_DEFS.map((t) => t.name);
export const WRITE_TOOLS = new Set(['propose_booking', 'propose_guest_message', 'propose_support_handoff']);

/** Chat Completions shape. */
export const chatTools = () => TOOL_DEFS.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }));
/** Realtime session shape (OpenAI-Realtime compatible, used by ElevenLabs Realtime). */
export const realtimeTools = () => TOOL_DEFS.map((t) => ({ type: 'function', name: t.name, description: t.description, parameters: t.parameters }));

/* ── data helpers (all with the user's JWT) ─────────────────────────────────────────────────────── */
async function rows(q, label) {
  const { data, error } = await q;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data || [];
}
async function unitsOf(db) {
  const props = await rows(db.from('properties').select('id, name, base_price, max_guests').order('name').limit(60), 'properties');
  return props.map((p) => ({ id: p.id, name: p.name || 'יחידה', base_price: p.base_price ?? null, max_guests: p.max_guests ?? null }));
}
function matchUnit(units, q) {
  const s = String(q || '').trim().replace(/^ה(?=\S{2,})/, '');
  if (!s) return null;
  const norm = (x) => String(x || '').trim().toLowerCase().replace(/^ה(?=\S{2,})/, '');
  return units.find((u) => norm(u.name) === norm(s)) || units.find((u) => norm(u.name).includes(norm(s)) || norm(s).includes(norm(u.name))) || null;
}
const BOOKING_COLS = 'id, guest_name, property_id, unit_id, property_name, check_in_date, check_out_date, nights, adults, children, total_price, status, source, is_block';
const shortBooking = (b, names) => ({
  id: b.id, guest: first(b.guest_name), unit: names.get(b.property_id) || names.get(b.unit_id) || b.property_name || '',
  check_in: b.check_in_date, check_out: b.check_out_date, nights: nights(b.check_in_date, b.check_out_date) || b.nights || null,
  status: he(b.status), source: b.source || null, link: `/booking/${b.id}`,
});
async function overlapping(db, from, to) { // stays touching [from, to)
  return rows(db.from('bookings').select(BOOKING_COLS).lt('check_in_date', to).gt('check_out_date', from).order('check_in_date').limit(500), 'bookings');
}

/* ── executors ───────────────────────────────────────────────────────────────────────────────────── */
const EXEC = {
  async get_day_overview(db, a, ctx) {
    const d = isDay(a.date) ? a.date : ctx.today;
    const [units, stays, cleaning] = await Promise.all([
      unitsOf(db), overlapping(db, addDays(d, -1), addDays(d, 1)),
      rows(db.from('cleaning_tasks').select('id, property_id, status, scheduled_date, title').eq('scheduled_date', d).limit(50), 'cleaning_tasks'),
    ]);
    const names = new Map(units.map((u) => [u.id, u.name]));
    const live = stays.filter((b) => ACTIVE_BOOKING(b.status) && !b.is_block);
    return {
      date: d, day_label: heDay(d),
      arrivals: live.filter((b) => b.check_in_date === d).map((b) => shortBooking(b, names)),
      departures: live.filter((b) => b.check_out_date === d).map((b) => shortBooking(b, names)),
      staying: live.filter((b) => b.check_in_date < d && b.check_out_date > d).map((b) => shortBooking(b, names)),
      cleaning: cleaning.map((c) => ({ unit: names.get(c.property_id) || '', status: c.status, title: clip(c.title, 60) })),
      units_total: units.length,
    };
  },

  async find_bookings(db, a, ctx) {
    const units = await unitsOf(db);
    const names = new Map(units.map((u) => [u.id, u.name]));
    const r = clampRange(a.from || ctx.today, a.to || addDays(a.from && isDay(a.from) ? a.from : ctx.today, 60), ctx.today);
    let q = db.from('bookings').select(BOOKING_COLS).lt('check_in_date', r.to).gt('check_out_date', r.from).order('check_in_date').limit(lim(a.limit, 15, 25) * 3);
    if (a.unit) { const u = matchUnit(units, a.unit); if (!u) return { error: 'unit_not_found', units: units.map((x) => x.name) }; q = q.eq('property_id', u.id); }
    let list = (await rows(q, 'bookings')).filter((b) => !b.is_block);
    const st = a.status || 'active';
    if (st === 'active') list = list.filter((b) => ACTIVE_BOOKING(b.status));
    if (st === 'pending') list = list.filter((b) => b.status === 'PENDING');
    if (st === 'confirmed') list = list.filter((b) => ['APPROVED', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(b.status));
    if (st === 'cancelled') list = list.filter((b) => !ACTIVE_BOOKING(b.status));
    if (a.guest) { const g = String(a.guest).trim(); list = list.filter((b) => String(b.guest_name || '').includes(g)); }
    const out = list.slice(0, lim(a.limit, 15, 25)).map((b) => shortBooking(b, names));
    return { from: r.from, to: r.to, count: out.length, more: list.length > out.length, bookings: out };
  },

  async get_booking(db, a) {
    const id = clip(a.booking_id, 64);
    const b = (await rows(db.from('bookings').select(BOOKING_COLS).eq('id', id).limit(1), 'bookings'))[0];
    if (!b) return { error: 'not_found' };
    const [units, pays] = await Promise.all([unitsOf(db), rows(db.from('payments').select('amount, status, due_date, paid_date').eq('booking_id', id).limit(50), 'payments')]);
    const names = new Map(units.map((u) => [u.id, u.name]));
    const paid = pays.filter((p) => PAID.has(p.status)).reduce((s, p) => s + num(p.amount), 0) - pays.filter((p) => REFUNDED.has(p.status)).reduce((s, p) => s + num(p.amount), 0);
    const total = num(b.total_price);
    return { ...shortBooking(b, names), adults: b.adults ?? null, children: b.children ?? null, total_price: total, paid: Math.max(0, paid), balance: Math.max(0, total - Math.max(0, paid)),
      next_due: pays.filter((p) => !PAID.has(p.status) && !REFUNDED.has(p.status) && p.due_date).map((p) => p.due_date).sort()[0] || null };
  },

  async check_availability(db, a, ctx) {
    if (!isDay(a.from) || !isDay(a.to) || a.to <= a.from) return { error: 'bad_dates', hint: 'from ו-to בפורמט YYYY-MM-DD, to אחרי from' };
    if (a.from < ctx.today) return { error: 'past_dates' };
    const r = clampRange(a.from, a.to, ctx.today, 60);
    const [units, stays] = await Promise.all([unitsOf(db), overlapping(db, r.from, r.to)]);
    const busy = new Set(stays.filter((b) => ACTIVE_BOOKING(b.status)).map((b) => b.property_id || b.unit_id));
    let list = units;
    if (a.unit) { const u = matchUnit(units, a.unit); if (!u) return { error: 'unit_not_found', units: units.map((x) => x.name) }; list = [u]; }
    return { from: r.from, to: r.to, nights: nights(r.from, r.to),
      free: list.filter((u) => !busy.has(u.id)).map((u) => ({ unit: u.name, base_price: u.base_price, max_guests: u.max_guests })),
      taken: list.filter((u) => busy.has(u.id)).map((u) => u.name) };
  },

  async get_leads(db, a) {
    const list = await rows(db.from('leads').select('id, full_name, status, source, check_in_date, check_out_date, adults, children, created_at').order('created_at', { ascending: true }).limit(200), 'leads');
    const open = a.status === 'all' ? list : list.filter((l) => OPEN_LEAD.has(String(l.status || '').toUpperCase()));
    const out = open.slice(0, lim(a.limit, 10, 25)).map((l) => ({ id: l.id, name: first(l.full_name), status: he(l.status), source: l.source || null,
      dates: l.check_in_date ? `${l.check_in_date} עד ${l.check_out_date || '?'}` : null, guests: (l.adults || 0) + (l.children || 0) || null,
      since: String(l.created_at || '').slice(0, 10), link: `/lead/${l.id}` }));
    return { count_open: list.filter((l) => OPEN_LEAD.has(String(l.status || '').toUpperCase())).length, leads: out };
  },

  async get_money(db, a, ctx) {
    const m = monthRange(ctx.today);
    const r = clampRange(a.from || m.from, a.to || m.to, ctx.today, 400);
    const [stays, payments, expenses] = await Promise.all([
      overlapping(db, r.from, r.to),
      rows(db.from('payments').select('booking_id, amount, status, paid_date, paid_at, due_date, created_at').limit(2000), 'payments'),
      rows(db.from('expenses').select('category, amount, expense_date').gte('expense_date', r.from).lt('expense_date', r.to).limit(2000), 'expenses'),
    ]);
    let revenue = 0; let bookedNights = 0;
    for (const b of stays) {
      if (!ACTIVE_BOOKING(b.status) || b.is_block) continue;
      const all = nights(b.check_in_date, b.check_out_date) || 1;
      const s = b.check_in_date > r.from ? b.check_in_date : r.from;
      const e = b.check_out_date < r.to ? b.check_out_date : r.to;
      const n = s < e ? nights(s, e) : 0;
      revenue += num(b.total_price) * (n / all); bookedNights += n;
    }
    const inRange = (p) => { const d = String(p.paid_date || p.paid_at || '').slice(0, 10); return d >= r.from && d < r.to; };
    const received = payments.filter((p) => PAID.has(p.status) && inRange(p)).reduce((s, p) => s + num(p.amount), 0);
    const byCat = {};
    for (const x of expenses) byCat[x.category || 'אחר'] = (byCat[x.category || 'אחר'] || 0) + num(x.amount);
    const expTotal = Object.values(byCat).reduce((s, v) => s + v, 0);
    // open balances on active bookings that already started or start within 30 days
    const horizon = addDays(ctx.today, 30);
    const active = (await rows(db.from('bookings').select('id, guest_name, total_price, status, check_in_date, is_block').lte('check_in_date', horizon).gte('check_out_date', addDays(ctx.today, -120)).limit(500), 'bookings'))
      .filter((b) => ACTIVE_BOOKING(b.status) && !b.is_block && num(b.total_price) > 0);
    const paidBy = new Map();
    for (const p of payments) { if (!p.booking_id) continue; const v = PAID.has(p.status) ? num(p.amount) : REFUNDED.has(p.status) ? -num(p.amount) : 0; paidBy.set(p.booking_id, (paidBy.get(p.booking_id) || 0) + v); }
    const balances = active.map((b) => ({ id: b.id, guest: first(b.guest_name), check_in: b.check_in_date, balance: Math.max(0, num(b.total_price) - Math.max(0, paidBy.get(b.id) || 0)) }))
      .filter((x) => x.balance > 0).sort((x, y) => y.balance - x.balance);
    return { from: r.from, to: r.to, revenue_from_stays: Math.round(revenue), nights_booked: bookedNights, payments_received: received,
      expenses_total: expTotal, expenses_by_category: byCat, profit_estimate: Math.round(revenue) - expTotal,
      open_balances_total: balances.reduce((s, x) => s + x.balance, 0), open_balances: balances.slice(0, 8), currency: 'ILS',
      note: 'הכנסות לפי הלילות שבטווח (הזמנה שחוצה חודש מתחלקת). תשלומים לפי תאריך התשלום.' };
  },

  async get_business_settings(db, _a, ctx) {
    const [prof, units, syncs, rules] = await Promise.all([
      rows(db.from('profiles').select('full_name, selected_plan, trial_ends_at, subscription_status, onboarding_completed, organizations(name, subscription_plan, settings)').eq('id', ctx.userId).limit(1), 'profiles'),
      unitsOf(db),
      rows(db.from('calendar_syncs').select('property_id, provider, is_active, sync_status, last_success_at, error_message').limit(60), 'calendar_syncs'),
      rows(db.from('automation_rules').select('name, trigger, is_active').limit(40), 'automation_rules'),
    ]);
    const p = prof[0] || {};
    const org = p.organizations || {};
    const names = new Map(units.map((u) => [u.id, u.name]));
    const trialLeft = p.trial_ends_at ? Math.max(0, Math.ceil((Date.parse(p.trial_ends_at) - Date.now()) / 86400000)) : null;
    const s = org.settings && typeof org.settings === 'object' ? org.settings : {};
    return {
      business: org.name || null, owner_first_name: first(p.full_name), plan: org.subscription_plan || p.selected_plan || null,
      subscription_status: p.subscription_status || null, trial_days_left: trialLeft, setup_done: p.onboarding_completed !== false,
      units: units.map((u) => ({ name: u.name, base_price: u.base_price, max_guests: u.max_guests })),
      calendar_channels: syncs.map((c) => ({ unit: names.get(c.property_id) || '', provider: c.provider, active: !!c.is_active, status: c.sync_status || null, last_ok: c.last_success_at || null, error: c.error_message ? clip(c.error_message, 80) : null })),
      guest_messages_on: rules.filter((r) => r.is_active).map((r) => clip(r.name || r.trigger, 50)),
      check_in_time: s.check_in_time || s.checkin_time || null, check_out_time: s.check_out_time || s.checkout_time || null,
    };
  },

  async search_help(_db, a, ctx) {
    const hits = searchHelp(a.query, 4, 3200, { native: !!ctx?.native });
    return hits.length ? { results: hits } : { results: [], note: 'לא נמצא במדריך. ענו ממה שבתקציר אם יש שם תשובה. אם אין, אמרו בכנות שאין לכם תשובה בטוחה, אל תמציאו, והציעו להעביר לנציג.' };
  },

  /* proposals: validated, never executed here */
  async propose_booking(db, a, ctx) {
    if (!isDay(a.check_in) || !isDay(a.check_out) || a.check_out <= a.check_in) return { error: 'bad_dates' };
    if (a.check_in < ctx.today) return { error: 'past_dates' };
    const guest = clip(String(a.guest_name || '').trim(), 80);
    if (!guest) return { error: 'missing_guest_name' };
    const units = await unitsOf(db);
    const u = matchUnit(units, a.unit);
    if (!u) return { error: 'unit_not_found', units: units.map((x) => x.name) };
    const clash = (await overlapping(db, a.check_in, a.check_out)).filter((b) => ACTIVE_BOOKING(b.status) && (b.property_id === u.id || b.unit_id === u.id));
    if (clash.length) return { error: 'unit_taken', unit: u.name, clashes: clash.slice(0, 3).map((b) => ({ check_in: b.check_in_date, check_out: b.check_out_date, guest: first(b.guest_name) })) };
    const n = nights(a.check_in, a.check_out);
    const price = a.total_price != null && Number.isFinite(Number(a.total_price)) ? Math.max(0, Number(a.total_price)) : null;
    return {
      proposal: {
        kind: 'create_booking',
        summary: `הזמנה ל${guest}, ${u.name}, ${heDay(a.check_in)} עד ${heDay(a.check_out)} (${n} ${n === 1 ? 'לילה' : 'לילות'})${price != null ? `, ‏₪${Math.round(price).toLocaleString('en-US')}` : ''}`,
        payload: { guest_name: guest, property_id: u.id, check_in_date: a.check_in, check_out_date: a.check_out, nights: n,
          adults: lim(a.adults, 2, 40), children: Math.max(0, Number.parseInt(a.children, 10) || 0), total_price: price, status: 'PENDING', notes: clip(a.notes, 500), source: 'direct' },
        display: { guest, unit: u.name, check_in: a.check_in, check_out: a.check_out, nights: n, total_price: price, adults: lim(a.adults, 2, 40), children: Math.max(0, Number.parseInt(a.children, 10) || 0) },
      },
    };
  },

  async propose_guest_message(db, a) {
    const id = clip(a.booking_id, 64);
    const b = (await rows(db.from('bookings').select('id, guest_name, guest_phone, check_in_date, property_id').eq('id', id).limit(1), 'bookings'))[0];
    if (!b) return { error: 'not_found' };
    const text = clip(String(a.text || '').trim(), 600);
    if (!text) return { error: 'empty_text' };
    const digits = String(b.guest_phone || '').replace(/\D/g, '');
    const intl = digits.startsWith('972') ? digits : digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
    return {
      proposal: { kind: 'guest_message', summary: `הודעת וואטסאפ ל${first(b.guest_name)}`, has_phone: intl.length >= 11,
        display: { guest: first(b.guest_name), text, booking_link: `/booking/${b.id}` },
        // the client gets the wa.me link; the model never sees the phone number (see forModel below)
        client: { wa_link: intl.length >= 11 ? `https://wa.me/${intl}?text=${encodeURIComponent(text)}` : null, booking_id: b.id } },
    };
  },

  async propose_support_handoff(_db, a) {
    const summary = clip(String(a.summary || '').trim(), 400) || 'בקשה לנציג';
    return { proposal: { kind: 'support_handoff', summary: 'העברה לנציג מצוות atlas', display: { text: summary } } };
  },
};

/** Model-facing copy of a result: proposals lose their private client part (phone links). */
export function forModel(result) {
  if (!result?.proposal) return result;
  const { client, payload, ...rest } = result.proposal;
  void client; void payload;
  return { proposal: { ...rest, status: 'shown_to_owner_waiting_for_confirmation' }, instruction: 'אמרו בקצרה מה הכנתם ושהפעולה תקרה רק אחרי שילחצו אישור. אל תאמרו שזה בוצע.' };
}

/**
 * runTool(name, args, { db, userId, today }) → { result, proposal? }. Never throws: errors come back as
 * { error } so the model can say so plainly. Unknown tools are refused.
 */
export async function runTool(name, rawArgs, ctx) {
  if (!TOOL_NAMES.includes(name)) return { result: { error: 'unknown_tool' } };
  let args = rawArgs;
  if (typeof args === 'string') { try { args = JSON.parse(args || '{}'); } catch { return { result: { error: 'bad_arguments' } }; } }
  if (!args || typeof args !== 'object') args = {};
  const c = { ...ctx, today: ctx.today || todayIL() };
  try {
    const result = await EXEC[name](c.db, args, c);
    return { result, proposal: result?.proposal || null };
  } catch (e) {
    return { result: { error: 'lookup_failed', detail: clip(e?.message, 120), say: 'אמרו שלא הצלחתם לבדוק את זה כרגע, והציעו לפתוח את המסך המתאים באפליקציה או לנסות שוב.' } };
  }
}
