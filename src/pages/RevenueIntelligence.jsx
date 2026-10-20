import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, EmptyState } from '@/components/ds';
import { ArrowUpRight, ArrowDownRight, TrendingUp, BarChart3 } from 'lucide-react';
import { useStayData } from '@/hooks/useStayData';
import { buildMonthlyReport } from '@/lib/stay/report';
import { formatMoney } from '@/lib/stay/format';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Revenue overview, computed from the organization's own bookings (no sample numbers).
 * Income is attributed by nights stayed inside each month, same as the monthly accountant report.
 * Cancelled bookings are excluded; still-pending bookings are counted by their booked price and
 * labelled as such in the footnote.
 */
const MONTHS_SHORT = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

function lastMonths(count, now = new Date()) {
  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), monthIndex: d.getMonth() });
  }
  return out;
}

function sumReports(reports) {
  const income = reports.reduce((s, r) => s + r.income, 0);
  const nights = reports.reduce((s, r) => s + r.nights, 0);
  const capacity = reports.reduce((s, r) => s + r.capacity, 0);
  return {
    income,
    nights,
    capacity,
    adr: nights ? income / nights : 0,
    occupancy: capacity ? nights / capacity : 0,
    revpar: capacity ? income / capacity : 0,
  };
}

const changePct = (now, before) => (before > 0 ? ((now - before) / before) * 100 : null);

function Delta({ value }) {
  if (value == null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span className={cn('inline-flex h-6 items-center gap-0.5 rounded-full px-2 text-[12px] font-semibold', up ? 'bg-[var(--st-mint-bg)] text-[var(--st-mint-fg)]' : 'bg-[#FDEEEE] text-danger-600')}>
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      <span dir="ltr">{`${up ? '+' : ''}${Math.round(value)}%`}</span>
    </span>
  );
}

function Kpi({ label, value, delta, hint }) {
  return (
    <div className="v7-card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[14px] font-medium text-ink-600">{label}</p>
        <Delta value={delta} />
      </div>
      <p className="v5-num mt-3 text-[26px] font-extrabold leading-none text-navy-900">{value}</p>
      {hint ? <p className="mt-2 text-[12px] text-ink-400">{hint}</p> : null}
    </div>
  );
}

export default function RevenueIntelligence() {
  const { bookings, properties, payments, isLoading, isError, refetch } = useStayData({ withCleaning: false });

  const model = useMemo(() => {
    const months = lastMonths(24);
    const reports = months.map(({ year, monthIndex }) => ({
      year, monthIndex,
      ...buildMonthlyReport({ year, monthIndex, bookings, properties, payments, expenses: [] }),
    }));
    const prev12 = reports.slice(0, 12);
    const last12 = reports.slice(12);
    const now = sumReports(last12);
    const before = sumReports(prev12);
    const hasPrev = before.income > 0;

    const units = new Map();
    for (const r of last12) {
      for (const u of r.unitRows) {
        if (!units.has(u.id)) units.set(u.id, { id: u.id, name: u.name, income: 0, nights: 0, days: 0 });
        const row = units.get(u.id);
        row.income += u.income;
        row.nights += u.nights;
      }
    }
    const days = last12.reduce((s, r) => s + r.days, 0);
    const unitRows = [...units.values()]
      .map((u) => ({ ...u, adr: u.nights ? u.income / u.nights : 0, occupancy: days ? u.nights / days : 0 }))
      .sort((a, b) => b.income - a.income);

    const bars = last12.map((r, i) => ({
      key: `${r.year}-${r.monthIndex}`,
      label: MONTHS_SHORT[r.monthIndex],
      long: r.label,
      value: r.income,
      prev: prev12[i]?.income || 0,
    }));
    const best = bars.reduce((m, b) => (b.value > (m?.value || 0) ? b : m), null);
    const pendingCount = (bookings || []).filter((b) => String(b.status || '').toUpperCase() === 'PENDING').length;

    return { now, before, hasPrev, unitRows, bars, best, pendingCount };
  }, [bookings, properties, payments]);

  const hasData = model.now.income > 0 || model.now.nights > 0;
  const maxBar = Math.max(1, ...model.bars.map((b) => Math.max(b.value, b.prev)));

  return (
    <div dir="rtl">
      <div className="mx-auto w-full max-w-[1200px] space-y-8 px-5 pb-16 pt-6 md:px-10 md:pt-10">
        <PageHeader title="הכנסות" subtitle="12 החודשים האחרונים, מתוך ההזמנות שלכם." className="!mb-0" />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-busy="true" aria-label="טוען">
            {[0, 1, 2, 3].map((i) => <div key={i} className="v7-card h-[118px] animate-pulse bg-white" />)}
          </div>
        ) : isError ? (
          <div className="v7-card">
            <EmptyState
              icon={BarChart3}
              title="לא הצלחנו לטעון את הנתונים"
              description="בדקו את החיבור ונסו שוב."
              actionLabel="נסו שוב"
              onAction={() => refetch()}
            />
          </div>
        ) : !hasData ? (
          <div className="v7-card">
            <EmptyState
              icon={TrendingUp}
              title="עוד אין מספיק הזמנות"
              description="כאן יופיעו ההכנסות, התפוסה והמחיר הממוצע ללילה, מחושבים מההזמנות שלכם. הוסיפו הזמנות או חברו את Booking.com ו-Airbnb, והמספרים יתמלאו לבד."
              action={<Button asChild><Link to="/bookings">להזמנות</Link></Button>}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi label="הכנסות" value={formatMoney(model.now.income)} delta={model.hasPrev ? changePct(model.now.income, model.before.income) : null} hint={model.hasPrev ? 'מול 12 החודשים שלפני' : null} />
              <Kpi label="ממוצע ללילה" value={formatMoney(model.now.adr)} delta={model.hasPrev ? changePct(model.now.adr, model.before.adr) : null} />
              <Kpi label="תפוסה" value={`${Math.round(model.now.occupancy * 100)}%`} delta={model.hasPrev ? changePct(model.now.occupancy, model.before.occupancy) : null} hint={`${model.now.nights.toLocaleString('he-IL')} לילות שנמכרו`} />
              <Kpi label="הכנסה ללילה זמין" value={formatMoney(model.now.revpar)} delta={model.hasPrev ? changePct(model.now.revpar, model.before.revpar) : null} hint="כולל לילות ריקים" />
            </div>

            <section className="v7-card overflow-hidden" aria-label="הכנסות לפי חודש">
              <div className="flex flex-col gap-1 px-6 pb-3 pt-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-[17px] font-bold text-navy-900">הכנסות לפי חודש</h2>
                  <p className="mt-0.5 text-[13px] text-ink-400">
                    {model.best ? <>החודש החזק: <b className="font-semibold text-navy-900">{model.best.long}</b> ({formatMoney(model.best.value)})</> : null}
                  </p>
                </div>
                {model.hasPrev ? (
                  <p className="flex items-center gap-4 text-[12px] text-ink-400">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-brand-600" />השנה</span>
                    <span className="flex items-center gap-1.5"><span className="h-0 w-3 border-t-2 border-dashed border-ink-300" />שנה קודמת</span>
                  </p>
                ) : null}
              </div>
              <div className="px-4 pb-6 sm:px-6">
                <div className="flex h-56 items-end gap-1.5 sm:gap-2" role="list">
                  {model.bars.map((b) => (
                    <div key={b.key} role="listitem" aria-label={`${b.long}: ${formatMoney(b.value)}`} className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                      <div className="relative flex w-full flex-1 items-end justify-center">
                        {model.hasPrev && b.prev > 0 ? (
                          <div className="absolute left-1/2 w-[80%] -translate-x-1/2 border-t-2 border-dashed border-ink-300" style={{ bottom: `${(b.prev / maxBar) * 100}%` }} />
                        ) : null}
                        <div className="w-[62%] rounded-t-[6px] bg-brand-600" style={{ height: `${Math.max(b.value > 0 ? 2 : 0, (b.value / maxBar) * 100)}%` }} />
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-ink-400 sm:text-[12px]">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="v7-card overflow-hidden" aria-label="לפי יחידה">
              <div className="border-b border-line px-6 py-4">
                <h2 className="text-[17px] font-bold text-navy-900">לפי יחידה</h2>
                <p className="mt-0.5 text-[13px] text-ink-400">12 החודשים האחרונים</p>
              </div>
              <div tabIndex={0} role="region" aria-label="טבלת יחידות" className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-right">
                  <thead>
                    <tr className="bg-canvas text-[12px] font-semibold text-ink-400">
                      <th className="px-5 py-3 font-semibold">יחידה</th>
                      <th className="px-5 py-3 font-semibold">הכנסות</th>
                      <th className="px-5 py-3 font-semibold">לילות</th>
                      <th className="px-5 py-3 font-semibold">ממוצע ללילה</th>
                      <th className="px-5 py-3 font-semibold">תפוסה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.unitRows.map((u) => (
                      <tr key={u.id} className="border-t border-line text-[14px] text-navy-900">
                        <td className="px-5 py-3 font-semibold">{u.name}</td>
                        <td className="v5-num px-5 py-3">{formatMoney(u.income)}</td>
                        <td className="v5-num px-5 py-3">{u.nights.toLocaleString('he-IL')}</td>
                        <td className="v5-num px-5 py-3">{u.nights ? formatMoney(u.adr) : '—'}</td>
                        <td className="v5-num px-5 py-3">{Math.round(u.occupancy * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="text-[13px] leading-relaxed text-ink-400">
              ההכנסה נספרת לפי הלילות שבכל חודש, בלי הזמנות שבוטלו.
              {model.pendingCount > 0 ? ` כולל ${model.pendingCount === 1 ? 'הזמנה אחת שעדיין ממתינה' : `${model.pendingCount} הזמנות שעדיין ממתינות`} לאישור או לתשלום.` : ''}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
