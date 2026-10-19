/**
 * Business KPIs for the admin. Only real numbers: every value is computed from customer rows and the charges
 * ledger, test accounts are left out, and a rate with no denominator is null (shown as "—"), never 0%.
 */
import { isTest } from './testAccounts.js';

const DAY = 864e5;

export function monthlyValue(c, plans = []) {
  if (c.price_ils != null) return c.billing_cycle === 'yearly' ? Math.round(c.price_ils / 12) : c.price_ils;
  const p = plans.find((x) => x.key === c.plan_key) || plans[0];
  if (!p) return 0;
  return c.billing_cycle === 'yearly' ? p.price_yearly : p.price_monthly;
}

export const KPI_HELP = {
  mrr: 'סכום המנויים החודשיים של לקוחות במצב פעיל או בפיגור תשלום. מנוי שנתי מחושב לפי חודש. בלי חשבונות בדיקה.',
  paying: 'לקוחות שהמנוי שלהם פעיל או שהתשלום האחרון שלהם נכשל. בלי ניסיון ובלי חשבונות בדיקה.',
  conversion: 'מתוך הלקוחות שתקופת הניסיון שלהם הסתיימה: כמה עברו לתשלום. ריק כשאף ניסיון עוד לא הסתיים.',
  churn: 'לקוחות משלמים שביטלו ב-30 הימים האחרונים, מתוך כל מי ששילם בתחילת התקופה. ריק כשאין עדיין לקוחות משלמים.',
  active7: 'לקוחות (לא בדיקה) שהבעלים שלהם נכנסו או עבדו במערכת ב-7 הימים האחרונים.',
};

export function computeKpis(customers = [], charges = [], plans = [], now = Date.now()) {
  const real = customers.filter((c) => !isTest(c));
  const tests = customers.length - real.length;
  const paidOrgs = new Set(charges.filter((x) => x.status === 'paid').map((x) => x.org_id));
  let mrr = 0;
  let paying = 0;
  let atRisk = 0;
  for (const c of real) {
    if (c.status === 'active' || c.status === 'past_due') {
      paying += 1;
      const v = monthlyValue(c, plans);
      mrr += v;
      if (c.status === 'past_due') atRisk += v;
    }
  }
  const ended = real.filter((c) => c.trial_ends_at && new Date(c.trial_ends_at).getTime() < now);
  const converted = ended.filter((c) => ['active', 'past_due'].includes(c.status) || paidOrgs.has(c.org_id) || (c.status === 'churned' && paidOrgs.has(c.org_id)));
  const conversion = ended.length ? converted.length / ended.length : null;
  const since = now - 30 * DAY;
  const churned30 = real.filter((c) => c.status === 'churned' && c.canceled_at && new Date(c.canceled_at).getTime() >= since);
  const base = paying + churned30.length;
  const churn = base ? churned30.length / base : null;
  const active7 = real.filter((c) => {
    const t = new Date(c.last_sign_in_at || c.last_active_at || 0).getTime();
    return t && now - t < 7 * DAY;
  }).length;
  return {
    mrr, arr: mrr * 12, paying, atRisk,
    conversion, converted: converted.length, ended: ended.length,
    churn, churned30: churned30.length, churnBase: base,
    active7, total: real.length, tests,
    trialing: real.filter((c) => c.status === 'trialing').length,
  };
}
