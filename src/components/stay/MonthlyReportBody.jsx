/** The report itself, shared by the in-app screen and the print / PDF view. */
import React from 'react';
import { formatMoney, pct, formatDayHe } from '@/lib/stay/format';
import { Money, StatTile } from './StayUI';

function Table({ head, rows, foot, align }) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-[14px] ab-num min-w-[480px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} className="text-right font-bold px-4 sm:px-3 py-2 ab-meta" style={{ borderBottom: '1px solid var(--line)', textAlign: align?.[i] || 'right' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, i) => (
                <td key={i} className="px-4 sm:px-3 py-2.5" style={{ borderBottom: '1px solid var(--line)', textAlign: align?.[i] || 'right', fontWeight: i === 0 ? 700 : 400 }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot ? (
          <tfoot>
            <tr>{foot.map((c, i) => <td key={i} className="px-4 sm:px-3 py-2.5 font-extrabold" style={{ textAlign: align?.[i] || 'right' }}>{c}</td>)}</tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

function Block({ title, children, note }) {
  return (
    <section className="ab-card ab-print-page p-4 sm:p-5 break-inside-avoid">
      <h2 className="ab-h3 mb-3">{title}</h2>
      {children}
      {note ? <p className="ab-faint mt-3">{note}</p> : null}
    </section>
  );
}

export function MonthlyReportBody({ report: r, emptyExpensesAction }) {
  const maxChannel = Math.max(1, ...r.channels.map((c) => c.income));
  return (
    <div className="space-y-4">
      <div className="stat-row">
        <StatTile label="הכנסות" value={formatMoney(r.income)} hint={`${r.lines.length} הזמנות`} />
        <StatTile label="הוצאות" value={formatMoney(r.expenseTotal)} hint={`${r.expenseRows.length} רשומות`} />
        <StatTile label="נטו" value={formatMoney(r.net)} tone={r.net < 0 ? 'danger' : 'brand'} />
      </div>
      <p className="ab-meta px-1">תפוסה {pct(r.occupancy)} · {r.nights} מתוך {r.capacity} לילות · ממוצע ללילה {formatMoney(r.adr)}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Block title="הכנסות לפי ערוץ" note="הכנסה משויכת לחודש לפי הלילות שבו. שהייה שחוצה חודשים מתחלקת באופן יחסי.">
          {r.channels.length === 0 ? <p className="ab-meta">אין הכנסות בחודש הזה.</p> : (
            <ul className="space-y-3">
              {r.channels.map((c) => (
                <li key={c.key}>
                  <div className="flex items-center justify-between gap-3 text-[14px]">
                    <span className="flex items-center gap-2 font-bold min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} aria-hidden />
                      <span className="truncate">{c.label}</span>
                      <span className="ab-faint font-normal ab-num whitespace-nowrap">{c.nights} לילות</span>
                    </span>
                    <Money value={c.income} className="font-bold" />
                  </div>
                  <div className="mt-1.5 h-2 rounded-full" style={{ background: 'var(--line)' }} aria-hidden>
                    <div className="h-2 rounded-full" style={{ width: `${(c.income / maxChannel) * 100}%`, background: c.color }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="ab-meta mt-4">תשלומים שהתקבלו בפועל בחודש: <Money value={r.received} className="font-bold" style={{ color: 'var(--ink-900)' }} /></p>
        </Block>

        <Block title="הוצאות לפי קטגוריה">
          {r.expenseByCategory.length === 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="ab-meta flex-1 min-w-[12rem]">לא נרשמו הוצאות בחודש הזה.</p>
              {emptyExpensesAction}
            </div>
          ) : (
            <ul>
              {r.expenseByCategory.map((x) => (
                <li key={x.category} className="flex items-center justify-between py-2 text-[14px]" style={{ borderBottom: '1px solid var(--line)' }}>
                  <span className="font-bold">{x.category}</span>
                  <Money value={x.amount} />
                </li>
              ))}
              <li className="flex items-center justify-between pt-2.5 text-[14px] font-extrabold">
                <span>סה״כ הוצאות</span>
                <Money value={r.expenseTotal} />
              </li>
            </ul>
          )}
        </Block>
      </div>

      <Block title="לפי יחידה">
        <Table
          head={['יחידה', 'לילות', 'תפוסה', 'ADR', 'הכנסות']}
          align={['right', 'left', 'left', 'left', 'left']}
          rows={r.unitRows.map((u) => [u.name, u.nights, pct(u.occupancy), formatMoney(u.adr), formatMoney(u.income)])}
          foot={['סה״כ', r.nights, pct(r.occupancy), formatMoney(r.adr), formatMoney(r.income)]}
        />
      </Block>

      <Block title="הזמנות בחודש">
        {r.lines.length === 0 ? <p className="ab-meta">אין הזמנות בחודש הזה.</p> : (
          <Table
            head={['אורח', 'יחידה', 'ערוץ', 'תאריכים', 'לילות בחודש', 'הכנסה בחודש']}
            align={['right', 'right', 'right', 'right', 'left', 'left']}
            rows={r.lines.map((l) => [l.guest, l.unit, l.channel, `${formatDayHe(l.check_in, { weekday: false })} - ${formatDayHe(l.check_out, { weekday: false })}`, l.nightsInMonth, formatMoney(l.income)])}
          />
        )}
      </Block>

      {r.expenseRows.length > 0 ? (
        <Block title="פירוט הוצאות">
          <Table
            head={['תאריך', 'תיאור', 'קטגוריה', 'יחידה', 'סכום']}
            align={['right', 'right', 'right', 'right', 'left']}
            rows={r.expenseRows.map((x) => [formatDayHe(x.date, { weekday: false }), x.description || '-', x.category, x.unit || '-', formatMoney(x.amount)])}
          />
        </Block>
      ) : null}
    </div>
  );
}
