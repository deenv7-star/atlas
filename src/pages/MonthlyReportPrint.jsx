/** Print-friendly (A4) view of the monthly report. Opens the browser print dialog so it can be saved as PDF. */
import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useStayData } from '@/hooks/useStayData';
import { buildMonthlyReport } from '@/lib/stay/report';
import { formatDayHe, todayISO } from '@/lib/stay/format';
import { MonthlyReportBody } from '@/components/stay/MonthlyReportBody';
import { Wordmark, Btn } from '@/components/stay/StayUI';
import { parseMonthParam } from '@/pages/MonthlyReport';

export default function MonthlyReportPrint() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { year, monthIndex } = parseMonthParam(params.get('m'));
  const data = useStayData({ withExpenses: true, withCleaning: false });
  const report = useMemo(() => buildMonthlyReport({
    year, monthIndex, bookings: data.bookings, properties: data.properties, payments: data.payments, expenses: data.expenses,
  }), [year, monthIndex, data.bookings, data.properties, data.payments, data.expenses]);

  const ready = !data.isLoading;
  useEffect(() => {
    document.title = `דוח חודשי ${report.label}`;
    if (!ready || params.get('noprint')) return undefined;
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, [ready, report.label, params]);

  return (
    <div dir="rtl" className="ab-root min-h-screen" style={{ background: 'var(--canvas)' }}>
      <style>{'@page { size: A4; margin: 14mm; } @media print { html, body { background: #fff !important; } .ab-sheet { box-shadow: none !important; padding: 0 !important; max-width: none !important; } }'}</style>
      <div className="ab-sheet mx-auto max-w-[900px] bg-white px-5 sm:px-10 py-8 sm:my-6 sm:rounded-[18px]" style={{ boxShadow: 'var(--ab-shadow)' }}>
        <header className="flex items-start justify-between gap-4 pb-5 mb-5" style={{ borderBottom: '2px solid var(--navy-900)' }}>
          <div className="min-w-0">
            <p className="ab-meta font-bold">דוח חודשי לרואה החשבון</p>
            <h1 className="ab-h1 mt-1">{report.label}</h1>
            <p className="ab-meta mt-1">{user?.organization_name || ''}{user?.organization_name ? ' · ' : ''}{report.units} יחידות · הופק ב{formatDayHe(todayISO())}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Wordmark size={20} />
            <Btn size="sm" variant="secondary" icon={Printer} className="ab-no-print" onClick={() => window.print()}>הדפסה</Btn>
          </div>
        </header>
        {ready ? <MonthlyReportBody report={report} /> : <p className="ab-meta">טוען…</p>}
        <footer className="mt-6 pt-4 ab-faint" style={{ borderTop: '1px solid var(--line)' }}>
          סכומים בשקלים כפי שנרשמו בהזמנות ובהוצאות. הכנסה משויכת לפי לילות בחודש.
        </footer>
      </div>
    </div>
  );
}
