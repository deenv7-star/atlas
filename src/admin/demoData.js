/**
 * Sample data for local demo mode only (no Supabase). Fictional businesses, owners and numbers,
 * generated deterministically relative to the day it is first created, then kept in localStorage so
 * demo actions (extend trial, mark paid…) persist in this browser.
 */
import { DEFAULT_PLANS } from './config';

const KEY = 'atlas_admin_demo_v4'; // v4: neutral demo staff / test emails (no real addresses)
const DAY = 864e5;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PREFIX = ['בקתות', 'צימרי', 'אחוזת', 'סוויטות', 'נחלת', 'בית', 'חוות', 'וילות', 'מתחם'];
const PLACE = ['האלון', 'הגפן', 'הדולב', 'השקד', 'הכרמל', 'הגליל', 'נוף הים', 'התבור', 'הזית', 'הרימון', 'עין כרם', 'הגולן', 'הערבה', 'הירדן', 'החורש', 'השיטה', 'הענבים', 'הצפצפה'];
const FIRST = ['יוסי', 'מיכל', 'אבי', 'רונית', 'דוד', 'שירה', 'עומר', 'נועה', 'אלי', 'טל', 'רחל', 'משה', 'ליאת', 'גיל', 'ענבל', 'אורי', 'חן', 'יעל', 'ניר', 'הדס'];
const LAST = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'אברהם', 'פרידמן', 'שגיא', 'גולן', 'אוחיון', 'דהן', 'בן דוד', 'רוזן', 'אלון', 'שפירא'];
const UNIT = ['צימר', 'סוויטה', 'בקתה', 'וילה'];
const UNIT_NAME = ['הגפן', 'הזית', 'התאנה', 'הרימון', 'השקד', 'האלה', 'הדקל', 'הברוש', 'הלבנה', 'הארז'];
const FAIL = ['כרטיס נדחה', 'אין כיסוי מספיק', 'פג תוקף הכרטיס'];
const NOTES = [
  'שיחה טלפונית: מרוצים, מבקשים חיבור ל-Booking.com',
  'ביקשו הדרכה קצרה על לוח השנה',
  'מתעניינים במעבר לחבילה שנתית',
  'שאלו על חשבונית מס מרוכזת',
];

const iso = (t) => new Date(t).toISOString();
const ymd = (t) => new Date(t).toISOString().slice(0, 10);
const uid = (r) => 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(r() * 16).toString(16));
const pick = (r, a) => a[Math.floor(r() * a.length)];

function makeNamer() {
  const used = new Set();
  return (i) => {
    for (let k = 0; k < PREFIX.length * PLACE.length; k++) {
      const n = `${PREFIX[(i + k) % PREFIX.length]} ${PLACE[(i * 7 + k * 5) % PLACE.length]}`;
      if (!used.has(n)) { used.add(n); return n; }
    }
    return `עסק ${i + 1}`;
  };
}

export function generateDemo(now = Date.now()) {
  const uniqueName = makeNamer();
  const r = rng(20261017);
  const plans = DEFAULT_PLANS.map((p) => ({ ...p, updated_at: iso(now - 40 * DAY) }));
  const priceOf = (key, cycle) => {
    const p = plans.find((x) => x.key === key) || plans[0];
    return cycle === 'yearly' ? p.price_yearly : p.price_monthly;
  };
  const customers = [];
  const units = {};
  const charges = [];
  const notes = [];
  const bookings = {};
  let inv = 1;
  const N = 46;
  for (let i = 0; i < N; i++) {
    // growth curve: more signups in recent months
    const ageDays = Math.floor(Math.pow(r(), 1.6) * 410) + 2;
    const created = now - ageDays * DAY;
    const trialEnd = created + 14 * DAY;
    const plan = r() < 0.5 ? 'starter' : r() < 0.75 ? 'pro' : 'business';
    const cycle = r() < 0.22 ? 'yearly' : 'monthly';
    let status;
    if (trialEnd > now) status = 'trialing';
    else {
      const x = r();
      status = x < 0.62 ? 'active' : x < 0.72 ? 'past_due' : x < 0.86 ? 'expired' : 'churned';
    }
    if (i === 7) status = 'suspended';
    const first = pick(r, FIRST);
    const last = pick(r, LAST);
    const orgId = uid(r);
    const nUnits = plan === 'starter' ? 1 + Math.floor(r() * 3) : plan === 'pro' ? 3 + Math.floor(r() * 7) : 8 + Math.floor(r() * 14);
    const active = ['active', 'past_due', 'suspended', 'trialing'].includes(status);
    const nBookings = Math.floor(nUnits * (active ? 4 + r() * 16 : r() * 4) * Math.min(1, ageDays / 60 + 0.2));
    const lastActive = active ? now - Math.floor(r() * (status === 'trialing' ? 3 : 9)) * DAY - Math.floor(r() * 8) * 3600e3 : now - (20 + Math.floor(r() * 90)) * DAY;
    const name = uniqueName(i);
    const phone = `05000001${String(10 + i).padStart(2, '0')}`;
    const paidSince = trialEnd;
    const churnAt = status === 'churned' ? Math.min(now - 10 * DAY, paidSince + (30 + Math.floor(r() * 120)) * DAY) : null;
    const customPrice = i === 3 ? 590 : null;
    customers.push({
      org_id: orgId,
      org_name: name,
      org_email: null,
      org_phone: null,
      created_at: iso(created),
      owner_id: uid(r),
      owner_name: `${first} ${last}`,
      owner_email: `owner${i + 1}@demo-atlas.co.il`,
      owner_phone: phone,
      properties_count: Math.max(1, Math.round(nUnits / 3)),
      units_count: nUnits,
      bookings_count: nBookings,
      bookings_30d: active ? Math.floor(nBookings * (0.08 + r() * 0.15)) : 0,
      last_active_at: iso(Math.max(created + DAY, lastActive)),
      plan_key: plan,
      status,
      billing_cycle: cycle,
      price_ils: customPrice,
      trial_ends_at: iso(trialEnd),
      current_period_end: ['active', 'past_due'].includes(status) ? iso(now + Math.floor(r() * 28) * DAY) : null,
      provider: 'manual',
      suspended_at: status === 'suspended' ? iso(now - 3 * DAY) : null,
      suspended_reason: status === 'suspended' ? 'שלושה חיובים שנכשלו' : null,
      canceled_at: churnAt ? iso(churnAt) : null,
      onboarding_completed: nBookings > 0 || r() > 0.3,
    });
    units[orgId] = Array.from({ length: nUnits }, (_, k) => ({
      id: uid(r),
      name: `${pick(r, UNIT)} ${UNIT_NAME[k % UNIT_NAME.length]}${k >= UNIT_NAME.length ? ` ${Math.floor(k / UNIT_NAME.length) + 1}` : ''}`,
      property: name,
      status: 'available',
      base_price: 600 + Math.round(r() * 14) * 50,
      max_guests: 2 + Math.floor(r() * 5),
    }));
    bookings[orgId] = Array.from({ length: Math.min(8, nBookings) }, (_, k) => {
      const ci = now + (6 - k * 5 - Math.floor(r() * 4)) * DAY;
      return {
        id: uid(r),
        check_in_date: ymd(ci),
        check_out_date: ymd(ci + (1 + Math.floor(r() * 3)) * DAY),
        status: ci > now ? 'CONFIRMED' : 'CHECKED_OUT',
        total_price: 900 + Math.round(r() * 30) * 100,
        source: pick(r, ['direct', 'booking', 'airbnb', 'direct']),
        unit: units[orgId][k % nUnits].name,
        guest_initials: pick(r, FIRST)[0] + pick(r, LAST)[0],
      };
    });
    // charges for anyone who paid
    if (['active', 'past_due', 'churned', 'suspended'].includes(status)) {
      const stepDays = cycle === 'yearly' ? 365 : 30;
      const amount = customPrice || (cycle === 'yearly' ? priceOf(plan, 'yearly') * 12 : priceOf(plan, 'monthly'));
      const end = churnAt || now;
      for (let t = paidSince; t <= end; t += stepDays * DAY) {
        const isLast = t + stepDays * DAY > end;
        let st = 'paid';
        if (isLast && status === 'past_due') st = 'failed';
        if (isLast && status === 'suspended') st = 'failed';
        if (isLast && status === 'active' && r() < 0.12) st = 'pending';
        const method = st === 'failed' ? 'card' : pick(r, ['bank_transfer', 'bank_transfer', 'bit', 'card']);
        charges.push({
          id: uid(r),
          org_id: orgId,
          org_name: name,
          amount_ils: amount,
          status: st,
          method,
          description: cycle === 'yearly' ? `מנוי שנתי · ${plans.find((p) => p.key === plan).name}` : `מנוי חודשי · ${plans.find((p) => p.key === plan).name}`,
          period_start: ymd(t),
          period_end: ymd(t + stepDays * DAY),
          due_date: ymd(t),
          paid_at: st === 'paid' ? iso(t + Math.floor(r() * 3) * DAY) : null,
          failure_reason: st === 'failed' ? pick(r, FAIL) : null,
          provider: 'manual',
          provider_ref: null,
          invoice_number: st === 'paid' ? `ATL-${new Date(t).getFullYear()}-${String(inv++).padStart(4, '0')}` : null,
          created_at: iso(t),
        });
      }
    }
    if (r() < 0.35) {
      notes.push({ id: uid(r), org_id: orgId, body: pick(r, NOTES), author_email: 'owner@demo-atlas.co.il', author_id: null, created_at: iso(now - Math.floor(r() * 40) * DAY) });
    }
  }
  // v3 (admin v2): logins, team members, iCal health, WhatsApp, and a few obvious test accounts like the live DB has.
  const members = {};
  const syncs = {};
  const wa = {};
  const TESTS = ['qa+onb1@example.com', 'scout_a38e9b@example.com', 'scout_0f5f2b@example.com', 'qa+demo@example.com', 'scout_dfb47a@example.com'];
  TESTS.forEach((email, k) => {
    const created = now - (3 + k * 4) * DAY;
    customers.push({
      org_id: uid(r), org_name: email.startsWith('qa+demo') ? 'חשבון בדיקה' : '', org_email: null, org_phone: null, created_at: iso(created),
      owner_id: uid(r), owner_name: null, owner_email: email, owner_phone: null, properties_count: k === 3 ? 1 : 0, units_count: k === 3 ? 1 : 0,
      bookings_count: k === 3 ? 2 : 0, bookings_30d: k === 3 ? 2 : 0, last_active_at: iso(created + 3600e3), plan_key: 'starter', status: created + 14 * DAY > now ? 'trialing' : 'expired',
      billing_cycle: 'monthly', price_ils: null, trial_ends_at: iso(created + 14 * DAY), current_period_end: null, provider: 'manual',
      suspended_at: null, suspended_reason: null, canceled_at: null, onboarding_completed: k === 3,
    });
  });
  customers.forEach((c, i) => {
    const t = /qa\+|scout/.test(c.owner_email);
    const never = t ? i % 2 === 0 : i % 9 === 4;
    c.last_sign_in_at = never ? null : c.last_active_at;
    c.email_confirmed = !never;
    c.leads_count = Math.round(c.bookings_count * 0.6);
    const extra = !t && c.units_count > 4 ? 1 + (i % 2) : 0;
    members[c.org_id] = [
      { user_id: c.owner_id, email: c.owner_email, full_name: c.owner_name, is_owner: true, created_at: c.created_at, last_sign_in_at: c.last_sign_in_at, email_confirmed: c.email_confirmed, is_staff: false },
      ...Array.from({ length: extra }, (_, k) => ({ user_id: uid(r), email: `team${k + 1}.${i + 1}@demo-atlas.co.il`, full_name: `${pick(r, FIRST)} ${pick(r, LAST)}`, is_owner: false, created_at: iso(new Date(c.created_at).getTime() + (5 + k) * DAY), last_sign_in_at: k ? null : iso(now - (1 + (i % 6)) * DAY), email_confirmed: !k, is_staff: false })),
    ];
    c.members_count = members[c.org_id].length;
    const nFeeds = t ? 0 : c.units_count ? Math.min(2, (i % 3)) : 0;
    syncs[c.org_id] = Array.from({ length: nFeeds }, (_, k) => {
      const bad = (i + k) % 7 === 3;
      return { id: uid(r), provider: k ? 'BOOKING_COM' : 'AIRBNB', label: k ? 'Booking.com' : 'Airbnb', property: units[c.org_id]?.[k]?.name || c.org_name, is_active: true,
        sync_status: bad ? 'ERROR' : 'OK', last_success_at: iso(now - (bad ? 3 * DAY : (5 + i % 10) * 60e3)), last_attempt_at: iso(now - (5 + i % 10) * 60e3),
        error_message: bad ? 'http_404' : null, events_count: 4 + (i % 9), conflicts: bad ? 1 : 0 };
    });
    c.ical_feeds = nFeeds;
    c.ical_errors = syncs[c.org_id].filter((x) => x.error_message).length;
    c.ical_last_success = syncs[c.org_id].reduce((m, x) => (!m || x.last_success_at > m ? x.last_success_at : m), null);
    const ready = !t && i % 4 !== 1;
    wa[c.org_id] = { host_phone: ready ? c.owner_phone : null, setup_done: ready, queue_pending: ready ? i % 4 : 0, sent_30d: ready ? Math.round(c.bookings_30d * 2.5) : 0, failed_30d: 0 };
    c.wa_ready = ready;
  });

  const team = [
    { user_id: uid(r), email: 'owner@demo-atlas.co.il', full_name: 'בעלים (דוגמה)', role: 'owner', created_at: iso(now - 200 * DAY), last_sign_in_at: iso(now - 3600e3) },
    { user_id: uid(r), email: 'admin@demo-atlas.co.il', full_name: 'מנהל (דוגמה)', role: 'admin', created_at: iso(now - 60 * DAY), last_sign_in_at: iso(now - 2 * DAY) },
    { user_id: uid(r), email: 'support@demo-atlas.co.il', full_name: 'צוות תמיכה (דוגמה)', role: 'support', created_at: iso(now - 30 * DAY), last_sign_in_at: iso(now - 5 * DAY) },
  ];
  const audit = [];
  let aid = 1;
  const push = (a) => audit.push({ id: aid++, actor_email: 'owner@demo-atlas.co.il', target_type: 'organization', details: {}, ...a });
  const c0 = customers[2];
  const c1 = customers[7];
  push({ action: 'trial.extend', org_id: c0.org_id, org_name: c0.org_name, target_id: c0.org_id, details: { days: 7 }, created_at: iso(now - 9 * DAY) });
  push({ action: 'account.suspend', org_id: c1.org_id, org_name: c1.org_name, target_id: c1.org_id, details: { reason: 'שלושה חיובים שנכשלו' }, created_at: iso(now - 3 * DAY) });
  push({ action: 'team.add', target_type: 'admin', org_id: null, org_name: null, target_id: team[2].user_id, details: { email: team[2].email, to: 'support' }, created_at: iso(now - 30 * DAY) });
  audit.sort((a, b) => b.created_at.localeCompare(a.created_at));
  charges.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { v: 3, generated_at: iso(now), plans, customers, units, bookings, charges, notes, team, audit, members, syncs, wa, flags: {} };
}

export function loadDemo() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d?.v === 3 && Array.isArray(d.customers)) return d;
    }
  } catch {
    /* regenerate */
  }
  const d = generateDemo();
  saveDemo(d);
  return d;
}
export function saveDemo(d) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage full / private mode: keep in memory */
  }
}
export function resetDemo() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
