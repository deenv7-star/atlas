import React, { useCallback, useMemo, useState } from 'react';
import type { ColumnDef, OnChangeFn, SortingState } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { AtlasTable, type AtlasCsvColumn, actionsColumn, bookingStatusColumn, guestLeadNameColumn } from '@/components/ui/AtlasTable';
import { exportToCSV, LEAD_COLUMNS } from '@/lib/csvExport';

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'חדש', color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  { value: 'CONTACTED', label: 'נוצר קשר', color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  { value: 'OFFER_SENT', label: 'הצעה נשלחה', color: 'bg-purple-100 text-purple-700 border border-purple-200' },
  { value: 'CONFIRMED', label: 'מאושר', color: 'bg-green-100 text-green-700 border border-green-200' },
  { value: 'REJECTED', label: 'נדחה', color: 'bg-red-100 text-red-700 border border-red-200' },
  { value: 'LOST', label: 'לא רלוונטי', color: 'bg-gray-100 text-gray-500 border border-gray-200' },
] as const;

const STATUS_BADGE_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, { label: s.label, className: s.color }]));

export type GuestLeadRow = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  created_at?: string | null;
  property_id?: string | null;
};

export type GuestsTableProps = {
  leads: GuestLeadRow[];
  properties: { id: string; name?: string }[];
  isLoading: boolean;
  error: Error | null;
  onEdit: (row: GuestLeadRow) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (rows: GuestLeadRow[]) => void;
  onBulkSetStatus: (rows: GuestLeadRow[], status: string) => void | Promise<void>;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  manualSorting?: boolean;
  highlightRowId?: string | null;
};

function formatJoined(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd MMM yyyy', { locale: he });
  } catch {
    return iso;
  }
}

export function GuestsTable(props: GuestsTableProps): React.ReactElement {
  const {
    leads,
    properties,
    isLoading,
    error,
    onEdit,
    onDelete,
    onBulkDelete,
    onBulkSetStatus,
    sorting,
    onSortingChange,
    manualSorting,
    highlightRowId,
  } = props;
  const [statusMenuRows, setStatusMenuRows] = useState<GuestLeadRow[] | null>(null);

  const propertyName = useCallback(
    (pid: string | null | undefined) => properties.find((p) => p.id === pid)?.name || '',
    [properties],
  );

  const columns = useMemo<ColumnDef<GuestLeadRow, unknown>[]>(() => {
    return [
      guestLeadNameColumn<GuestLeadRow>(),
      {
        id: 'email',
        accessorKey: 'email',
        header: 'אימייל',
        size: 180,
        minSize: 120,
        cell: ({ getValue }) => <span className="truncate text-sm text-gray-600">{String(getValue() ?? '')}</span>,
      },
      {
        id: 'phone',
        accessorKey: 'phone',
        header: 'טלפון',
        size: 120,
        minSize: 96,
        cell: ({ getValue }) => <span className="font-mono text-xs text-gray-700" dir="ltr">{String(getValue() ?? '')}</span>,
      },
      {
        id: 'bookings',
        accessorFn: () => '',
        header: 'הזמנות',
        size: 72,
        enableSorting: false,
        cell: () => <span className="text-xs text-gray-400">—</span>,
      },
      bookingStatusColumn<GuestLeadRow>(STATUS_BADGE_MAP, 'status'),
      {
        id: 'joined',
        accessorKey: 'created_at',
        header: 'תאריך הצטרפות',
        size: 130,
        cell: ({ getValue }) => <span className="text-sm text-gray-700">{formatJoined(String(getValue() ?? '') || undefined)}</span>,
      },
      actionsColumn<GuestLeadRow>('actions', 'פעולות', (row) => [
        { label: 'עריכה', onClick: () => onEdit(row) },
        { label: 'מחיקה', destructive: true, onClick: () => onDelete(row.id) },
      ]),
    ];
  }, [onDelete, onEdit]);

  const csvColumns: AtlasCsvColumn<GuestLeadRow>[] = useMemo(
    () =>
      LEAD_COLUMNS.map((c) => ({
        label: c.label,
        accessor: (r) => c.accessor({ ...r, property_name: propertyName(r.property_id) }),
      })),
    [propertyName],
  );

  return (
    <>
      <AtlasTable<GuestLeadRow>
        tableId="guests_leads"
        columns={columns}
        data={leads}
        getRowId={(r) => r.id}
        isLoading={isLoading}
        error={error}
        onRowClick={onEdit}
        sorting={sorting}
        onSortingChange={onSortingChange}
        manualSorting={manualSorting}
        highlightRowId={highlightRowId}
        enableSelection
        enableColumnResize
        enableMultiSort={!(sorting !== undefined && onSortingChange !== undefined)}
        stickyHeader
        virtualScroll={leads.length >= 400}
        emptyMessage="אין אורחים/לידים להצגה"
        csvExport={{ filename: 'guests', columns: csvColumns }}
        bulkBar={{
          onDeleteSelected: (rows) => {
            if (!confirm(`למחוק ${rows.length} רשומות?`)) return;
            onBulkDelete(rows);
          },
          onChangeStatus: (rows) => setStatusMenuRows(rows),
          onExportCsv: (rows) => {
            const data = rows.map((l) => ({ ...l, property_name: propertyName(l.property_id) }));
            exportToCSV(data, 'guests_selected', LEAD_COLUMNS);
          },
        }}
      />
      {statusMenuRows && statusMenuRows.length > 0 ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal>
          <div className="max-h-[70vh] w-full max-w-sm overflow-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-xl" dir="rtl">
            <p className="mb-2 text-sm font-semibold text-gray-800">בחר סטטוס ל-{statusMenuRows.length} רשומות</p>
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
