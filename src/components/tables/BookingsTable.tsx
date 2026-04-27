import React, { useCallback, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { AtlasTable, type AtlasCsvColumn, actionsColumn, bookingStatusColumn, currencyColumn, dateColumn, guestNameColumn } from '@/components/ui/AtlasTable';
import { exportToCSV, BOOKING_COLUMNS } from '@/lib/csvExport';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'ממתין', color: 'bg-amber-100 text-amber-700' },
  { value: 'APPROVED', label: 'מאושר', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'CONFIRMED', label: 'מאושר סופית', color: 'bg-green-100 text-green-700' },
  { value: 'CHECKED_IN', label: 'נכנס', color: 'bg-blue-100 text-blue-700' },
  { value: 'CHECKED_OUT', label: 'יצא', color: 'bg-gray-100 text-gray-600' },
  { value: 'CANCELLED', label: 'בוטל', color: 'bg-red-100 text-red-600' },
  { value: 'WAITLIST', label: 'המתנה', color: 'bg-purple-100 text-purple-700' },
] as const;

const STATUS_BADGE_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, { label: s.label, className: s.color }]));

export type BookingRow = {
  id: string;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  property_id?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  total_price?: string | number | null;
  status?: string | null;
  notes?: string | null;
};

export type BookingsTableProps = {
  bookings: BookingRow[];
  properties: { id: string; name?: string }[];
  isLoading: boolean;
  error: Error | null;
  onEdit: (row: BookingRow) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (rows: BookingRow[]) => void;
  onBulkSetStatus: (rows: BookingRow[], status: string) => void | Promise<void>;
};

function formatHeDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd MMM yyyy', { locale: he });
  } catch {
    return iso;
  }
}

export function BookingsTable(props: BookingsTableProps): React.ReactElement {
  const { bookings, properties, isLoading, error, onEdit, onDelete, onBulkDelete, onBulkSetStatus } = props;
  const [statusMenuRows, setStatusMenuRows] = useState<BookingRow[] | null>(null);

  const propertyName = useCallback(
    (pid: string | null | undefined) => properties.find((p) => p.id === pid)?.name || '—',
    [properties],
  );

  const columns = useMemo<ColumnDef<BookingRow, unknown>[]>(() => {
    return [
      {
        id: 'shortId',
        accessorKey: 'id',
        header: 'מס׳',
        size: 72,
        minSize: 64,
        cell: ({ getValue }) => {
          const id = String(getValue() ?? '');
          return <span className="font-mono text-[11px] text-gray-500">{id.slice(0, 8)}</span>;
        },
      },
      guestNameColumn<BookingRow>(),
      {
        id: 'property',
        accessorFn: (r) => propertyName(r.property_id),
        header: 'יחידה',
        size: 120,
        minSize: 88,
        cell: ({ getValue }) => <span className="truncate text-sm text-gray-700">{String(getValue())}</span>,
      },
      dateColumn<BookingRow>('check_in_date', 'צ׳ק-אין', formatHeDate),
      dateColumn<BookingRow>('check_out_date', 'צ׳ק-אאוט', formatHeDate),
      currencyColumn<BookingRow>('total_price', 'סכום'),
      bookingStatusColumn<BookingRow>(STATUS_BADGE_MAP, 'status'),
      actionsColumn<BookingRow>('actions', 'פעולות', (row) => {
        const actions: { label: string; onClick: () => void; destructive?: boolean }[] = [];
        if (row.guest_phone) {
          actions.push({
            label: 'חיוג',
            onClick: () => {
              window.location.href = `tel:${row.guest_phone}`;
            },
          });
          actions.push({
            label: 'וואטסאפ',
            onClick: () => {
              window.open(`https://wa.me/${String(row.guest_phone).replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer');
            },
          });
        }
        actions.push({ label: 'עריכה', onClick: () => onEdit(row) });
        actions.push({ label: 'מחיקה', destructive: true, onClick: () => onDelete(row.id) });
        return actions;
      }),
    ];
  }, [onDelete, onEdit, propertyName]);

  const csvColumns: AtlasCsvColumn<BookingRow>[] = useMemo(
    () =>
      BOOKING_COLUMNS.map((c) => ({
        label: c.label,
        accessor: (r) => c.accessor({ ...r, property_name: propertyName(r.property_id) }),
      })),
    [propertyName],
  );

  return (
    <>
      <AtlasTable<BookingRow>
        tableId="bookings"
        columns={columns}
        data={bookings}
        getRowId={(r) => r.id}
        isLoading={isLoading}
        error={error}
        onRowClick={onEdit}
        enableSelection
        enableColumnResize
        enableMultiSort
        stickyHeader
        virtualScroll={bookings.length >= 400}
        emptyMessage="אין הזמנות להצגה"
        csvExport={{ filename: 'bookings', columns: csvColumns }}
        bulkBar={{
          onDeleteSelected: (rows) => {
            if (!confirm(`למחוק ${rows.length} הזמנות?`)) return;
            onBulkDelete(rows);
          },
          onChangeStatus: (rows) => setStatusMenuRows(rows),
          onExportCsv: (rows) => {
            const data = rows.map((b) => ({ ...b, property_name: propertyName(b.property_id) }));
            exportToCSV(data, 'bookings_selected', BOOKING_COLUMNS);
          },
        }}
      />
      {statusMenuRows && statusMenuRows.length > 0 ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal>
          <div className="max-h-[70vh] w-full max-w-sm overflow-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-xl" dir="rtl">
            <p className="mb-2 text-sm font-semibold text-gray-800">בחר סטטוס ל-{statusMenuRows.length} הזמנות</p>
            <div className="flex flex-col gap-1">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`rounded-xl px-3 py-2 text-start text-sm font-medium ${s.color}`}
                  onClick={() => {
                    void onBulkSetStatus(statusMenuRows, s.value);
                    setStatusMenuRows(null);
                  }}
                >
                  {s.label}
                </button>
              ))}
              <button type="button" className="mt-2 rounded-xl border border-gray-200 py-2 text-sm text-gray-600" onClick={() => setStatusMenuRows(null)}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
