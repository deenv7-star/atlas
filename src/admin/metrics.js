/** Business numbers for the overview, computed from the customer list + charges ledger. */
const DAY = 864e5;

export function monthlyValue(c, plans) {
  if (c.price_ils != null) return c.billing_cycle === 'yearly' ? Math.round(c.price_ils / 12) : c.price_ils;
  const p = plans.find((x) => x.key === c.plan_key) || plans[0];
  if (!p) return 0;
  return c.billing_cycle === 'yearly' ? p.price_yearly : p.price_monthly;
}

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const HE_MONTHS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
export const monthLabel = (key) => HE_MONTHS[Number(key.slice(5, 7)) - 1] || key;

export function computeOverview(customers = [], charges = [], plans = [], now = Date.now()) {
  const counts = { total: customers.length, active: 0, trialing: 0, past_due: 0, expired: 0, churned: 0, suspended: 0 };
  let mrr = 0;
  let atRisk = 0;
  for (const c of customers) {
    counts[c.status] = (counts[c.status] || 0) + 1;
    if (c.status === 'active') mrr += monthlyValue(c, plans);
    if (c.status === 'past_due') { mrr += monthlyValue(c, plans); atRisk += monthlyValue(c, plans); }
  }
  const paidOrgs = new Set(charges.filter((x) => x.status === 'paid').map((x) => x.org_id));
  const trialEnded = customers.filter((c) => c.trial_ends_at && new Date(c.trial_ends_at).getTime() < now);
  const converted = trialEnded.filter((c) => ['active', 'past_due'].includes(c.status) || paidOrgs.has(c.org_id));
  const conversion = trialEnded.length ? converted.length / trialEnded.length : null;

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now);
    d.setDate(1);
    d.setMonth(d.getMonth() - 11 + i);
    return monthKey(d);
  });
  const signups = Object.fromEntries(months.map((m) => [m, 0]));
  for (const c of customers) {
    const k = monthKey(new Date(c.created_at));
    if (k in signups) signups[k] += 1;
  }
  const collected = Object.fromEntries(months.map((m) => [m, 0]));
  for (const x of charges) {
    if (x.status !== 'paid') continue;
    const k = monthKey(new Date(x.paid_at || x.created_at));
    if (k in collected) collected[k] += Number(x.amount_ils) || 0;
  }
  const series = months.map((m) => ({ month: m, label: monthLabel(m), signups: signups[m], collected: collected[m] }));
  const thisMonth = series[series.length - 1];
  const prevMonth = series[series.length - 2];

  const failed = charges.filter((x) => x.status === 'failed');
  const pending = charges.filter((x) => x.status === 'pending');
  const trialsEndingSoon = customers
    .filter((c) => c.status === 'trialing' && new Date(c.trial_ends_at).getTime() - now < 4 * DAY)
    .sort((a, b) => a.trial_ends_at.localeCompare(b.trial_ends_at));
  const newest = [...customers].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const byPlan = plans.map((p) => ({
    key: p.key,
    name: p.name,
    customers: customers.filter((c) => c.plan_key === p.key && ['active', 'past_due'].includes(c.status)).length,
    mrr: customers.filter((c) => c.plan_key === p.key && ['active', 'past_due'].includes(c.status)).reduce((s, c) => s + monthlyValue(c, plans), 0),
  }));

  return {
    counts, mrr, arr: mrr * 12, atRisk, conversion, convertedCount: converted.length, trialEndedCount: trialEnded.length,
    series, thisMonth, prevMonth, failed, pending, trialsEndingSoon, newest, byPlan,
    paying: counts.active + counts.past_due,
  };
}

export function daysUntil(iso, now = Date.now()) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - now) / DAY);
}

export function relTime(iso, now = Date.now()) {
  if (!iso) return '—';
  const diff = now - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 2) return 'עכשיו';
  if (min < 60) return `לפני ${min} דק׳`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  if (d === 1) return 'אתמול';
  if (d < 30) return `לפני ${d} ימים`;
  const mo = Math.round(d / 30);
  return mo === 1 ? 'לפני חודש' : `לפני ${mo} חודשים`;
}

/** 0501234567 / +972-50-123-4567 → 972501234567 for wa.me */
export function waNumber(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('972')) return d;
  if (d.startsWith('0')) return `972${d.slice(1)}`;
  return d;
}
export function fmtPhone(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('0')) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return phone || '';
}
