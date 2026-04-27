import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AtlasTable, type AtlasCsvColumn, actionsColumn, bookingStatusColumn, currencyColumn } from '@/components/ui/AtlasTable';
import { formatIsoSafe } from '@/lib/formatIsoSafe';
import { PAYMENT_COLUMNS, exportToCSV } from '@/lib/csvExport';

const PAYMENT_STATUSES = [
  { value: 'PENDING', label: 'ממתין', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
  { value: 'PAID', label: 'שולם', color: 'bg-green-100 text-green-700 border border-green-200' },
  { value: 'PARTIAL', label: 'חלקי', color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  { value: 'FAILED', label: 'נכשל', color: 'bg-red-100 text-red-700 border border-red-200' },
  { value: 'REFUNDED', label: 'הוחזר', color: 'bg-gray-100 text-gray-500 border border-gray-200' },
  { value: 'OVERDUE', label: 'באיחור', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
] as const;

const STATUS_BADGE_MAP = Object.fromEntries(PAYMENT_STATUSES.map((s) => [s.value, { label: s.label, className: s.color }]));

const METHOD_LABELS: Record<string, string> = {
  credit_card: 'כרטיס',
  bank_transfer: 'העברה',
  cash: 'מזומן',
  paypal: 'PayPal',
  bit: 'ביט',
  other: 'אחר',
};

export type FinancialPaymentRow = {
  id: string;
  amount?: string | number | null;
  status?: string | null;
  method?: string | null;
  description?: string | null;
  booking_id?: string | null;
  paid_date?: string | null;
  due_date?: string | null;
  created_at?: string | null;
  created_date?: string | null;
};

export type FinancialTableProps = {
  payments: FinancialPaymentRow[];
  isLoading: boolean;
  error: Error | null;
  onEdit: (row: FinancialPaymentRow) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (rows: FinancialPaymentRow[]) => void;
};

export function FinancialTable(props: FinancialTableProps): React.ReactElement {
  const { payments, isLoading, error, onEdit, onDelete, onBulkDelete } = props;

  const columns = useMemo<ColumnDef<FinancialPaymentRow, unknown>[]>(() => {
    return [
      {
        id: 'when',
        accessorFn: (r) => r.paid_date || r.due_date || r.created_at || r.created_date,
        header: 'תאריך',
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-700">{formatIsoSafe(String(getValue() ?? ''), 'dd/MM/yy') || '—'}</span>
        ),
      },
      {
        id: 'kind',
        accessorFn: (r) => (r.booking_id ? 'הזמנה' : 'כללי'),
        header: 'סוג',
        size: 72,
        cell: ({ getValue }) => <span className="text-xs font-medium text-gray-600">{String(getValue())}</span>,
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: 'תיאור',
        size: 200,
        minSize: 120,
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-gray-800">
            {row.original.description || `תשלום${row.original.booking_id ? ' #' + String(row.original.booking_id).slice(-4) : ''}`}
          </span>
        ),
      },
      currencyColumn<FinancialPaymentRow>('amount', 'סכום'),
      {
        id: 'method',
        accessorKey: 'method',
        header: 'שיטה',
        size: 88,
        cell: ({ getValue }) => {
          const m = String(getValue() ?? '');
          return <span className="text-sm text-gray-700">{METHOD_LABELS[m] || m || '—'}</span>;
        },
      },
      bookingStatusColumn<FinancialPaymentRow>(STATUS_BADGE_MAP, 'status'),
      actionsColumn<FinancialPaymentRow>('actions', 'פעולות', (row) => [
        { label: 'עריכה', onClick: () => onEdit(row) },
        { label: 'מחיקה', destructive: true, onClick: () => onDelete(row.id) },
      ]),
    ];
  }, [onDelete, onEdit]);

  const csvColumns: AtlasCsvColumn<FinancialPaymentRow>[] = useMemo(
    () =>
      PAYMENT_COLUMNS.map((c) => ({
        label: c.label,
        accessor: (r) => c.accessor(r),
      })),
    [],
  );

  return (
    <AtlasTable<FinancialPaymentRow>
      tableId="financial_payments"
      columns={columns}
      data={payments}
      getRowId={(r) => r.id}
      isLoading={isLoading}
      error={error}
      onRowClick={onEdit}
      enableSelection
      enableColumnResize
      enableMultiSort
      stickyHeader
      virtualScroll={payments.length >= 400}
      emptyMessage="אין תנועות כספיות"
      csvExport={{ filename: 'financial', columns: csvColumns }}
      bulkBar={{
        onDeleteSelected: (rows) => {
          if (!confirm(`למחוק ${rows.length} תשלומים?`)) return;
          onBulkDelete(rows);
        },
        onExportCsv: (rows) => exportToCSV(rows, 'financial_selected', PAYMENT_COLUMNS),
      }}
    />
  );
}
