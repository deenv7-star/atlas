/** Monthly report for the accountant: income by channel, expenses, net, occupancy, ADR. CSV + print/PDF. */
import FinanceTabs from '@/components/app/FinanceTabs';
import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Download, Printer } from 'lucide-react';
import { useStayData } from '@/hooks/useStayData';
import { buildMonthlyReport, reportToCSV, downloadText } from '@/lib/stay/report';
import { StayPage, PageHeader, Btn } from '@/components/stay/StayUI';
import { MonthlyReportBody } from '@/components/stay/MonthlyReportBody';
import { Skeleton } from '@/components/ui/skeleton';

export function parseMonthParam(m) {
  const match = String(m || '').match(/^(\d{4})-(\d{2})$/);
  const now = new Date();
  if (!match) return { year: now.getFullYear(), monthIndex: now.getMonth() };
  return { year: Number(match[1]), monthIndex: Math.min(11, Math.max(0, Number(match[2]) - 1)) };
}

export const monthParam = (y, mi) => `${y}-${String(mi + 1).padStart(2, '0')}`;

export default function MonthlyReportPage({ user }) {
  const [params, setParams] = useSearchParams();
  const { year, monthIndex } = parseMonthParam(params.get('m'));
  const data = useStayData({ withExpenses: true, withCleaning: false });
  const [busy, setBusy] = useState(false);

  const report = useMemo(() => buildMonthlyReport({
    year, monthIndex, bookings: data.bookings, properties: data.properties, payments: data.payments, expenses: data.expenses,
  }), [year, monthIndex, data.bookings, data.properties, data.payments, data.expenses]);

  const shift = (delta) => {
    const d = new Date(year, monthIndex + delta, 1);
    setParams({ m: monthParam(d.getFullYear(), d.getMonth()) }, { replace: true });
  };

  const exportCsv = () => {
    setBusy(true);
    try {
      downloadText(reportToCSV(report, user?.organization_name || ''), `atlas-report-${monthParam(year, monthIndex)}.csv`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <StayPage wide>
      <FinanceTabs />
      <PageHeader
        eyebrow="דוח לרואה החשבון"
        title={report.label}
        subtitle="הכנסות לפי ערוץ, הוצאות, נטו, תפוסה ומחיר ממוצע ללילה."
        actions={(
          <>
            <div className="inline-flex items-center gap-1">
              <Btn size="sm" variant="secondary" aria-label="החודש הקודם" onClick={() => shift(-1)} icon={ChevronRight} />
              <Btn size="sm" variant="secondary" aria-label="החודש הבא" onClick={() => shift(1)} icon={ChevronLeft} />
            </div>
            <Btn variant="secondary" icon={Download} onClick={exportCsv} disabled={busy || data.isLoading}>ייצוא CSV</Btn>
            <a className="ab-btn ab-btn-primary" href={`/monthly-report/print?m=${monthParam(year, monthIndex)}`} target="_blank" rel="noreferrer">
              <Printer size={18} strokeWidth={1.75} aria-hidden /> הדפסה / PDF
            </a>
          </>
        )}
      />
      {data.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-[14px]" />)}</div>
      ) : (
        <MonthlyReportBody
          report={report}
          emptyExpensesAction={<Link to="/expense-tracker" className="ab-btn ab-btn-secondary ab-btn-sm">רישום הוצאה</Link>}
        />
      )}
    </StayPage>
  );
}
