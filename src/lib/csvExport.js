/**
 * csvExport.js — Atlas CSV export utility
 * Usage: exportToCSV(rows, 'bookings', columns)
 */

export function exportToCSV(data, filename, columns) {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const val = c.accessor(row) ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const BOM = '\uFEFF'; // UTF-8 BOM — ensures Hebrew shows correctly in Excel
  const csv = BOM + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Pre-built column sets ────────────────────────────────────────────────────

export const BOOKING_COLUMNS = [
  { label: 'שם אורח',       accessor: r => r.guest_name },
  { label: 'אימייל',        accessor: r => r.guest_email },
  { label: 'טלפון',         accessor: r => r.guest_phone },
  { label: 'נכס',           accessor: r => r.property_name || r.property_id },
  { label: 'כניסה',         accessor: r => r.check_in_date },
  { label: 'יציאה',         accessor: r => r.check_out_date },
  { label: 'לילות',         accessor: r => r.nights },
  { label: 'סטטוס',         accessor: r => r.status },
  { label: 'מחיר כולל (₪)', accessor: r => r.total_price },
  { label: 'מקור הזמנה',    accessor: r => r.booking_source },
  { label: 'הערות',         accessor: r => r.notes },
];

export const LEAD_COLUMNS = [
  { label: 'שם',             accessor: r => r.full_name || r.name },
  { label: 'אימייל',         accessor: r => r.email },
  { label: 'טלפון',          accessor: r => r.phone },
  { label: 'נכס',            accessor: r => r.property_name || r.property_id },
  { label: 'כניסה',          accessor: r => r.check_in_date },
  { label: 'יציאה',          accessor: r => r.check_out_date },
  { label: 'סטטוס',          accessor: r => r.status },
  { label: 'תקציב (₪)',      accessor: r => r.budget },
  { label: 'מקור',           accessor: r => r.source },
  { label: 'הערות',          accessor: r => r.notes },
];

export const PAYMENT_COLUMNS = [
  { label: 'הזמנה ID',       accessor: r => r.booking_id },
  { label: 'סכום (₪)',       accessor: r => r.amount },
  { label: 'מטבע',           accessor: r => r.currency || 'ILS' },
  { label: 'סטטוס',          accessor: r => r.status },
  { label: 'אמצעי תשלום',    accessor: r => r.method },
  { label: 'תאריך תשלום',    accessor: r => r.paid_date },
  { label: 'תאריך יעד',      accessor: r => r.due_date },
  { label: 'תיאור',          accessor: r => r.description },
];
