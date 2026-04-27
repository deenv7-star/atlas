import React, { useCallback, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AtlasTable, type AtlasCsvColumn, actionsColumn, bookingStatusColumn } from '@/components/ui/AtlasTable';

const TYPE_LABELS: Record<string, string> = {
  MAINTENANCE: 'תחזוקה',
  AMENITY: 'שירותים',
  CLEANING: 'ניקיון',
  COMPLAINT: 'תלונה',
  QUESTION: 'שאלה',
  OTHER: 'אחר',
};

const URGENCY_MAP: Record<string, { label: string; className: string }> = {
  LOW: { label: 'נמוך', className: 'bg-blue-100 text-blue-800' },
  MEDIUM: { label: 'בינוני', className: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'גבוה', className: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'דחוף', className: 'bg-red-100 text-red-800' },
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  NEW: { label: 'חדש', className: 'bg-purple-100 text-purple-800' },
  IN_PROGRESS: { label: 'בטיפול', className: 'bg-blue-100 text-blue-800' },
  RESOLVED: { label: 'טופל', className: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'סגור', className: 'bg-gray-100 text-gray-800' },
};

export type MaintenanceRequestRow = {
  id: string;
  property_id?: string | null;
  request_type?: string | null;
  urgency?: string | null;
  assigned_to?: string | null;
  status?: string | null;
  created_date?: string | null;
  created_at?: string | null;
  title?: string | null;
};

export type MaintenanceTableProps = {
  requests: MaintenanceRequestRow[];
  properties: { id: string; name?: string }[];
  isLoading: boolean;
  error: Error | null;
  onOpen: (row: MaintenanceRequestRow) => void;
  highlightRowId?: string | null;
};

function formatOpened(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('he-IL');
  } catch {
    return iso;
  }
}

export function MaintenanceTable(props: MaintenanceTableProps): React.ReactElement {
  const { requests, properties, isLoading, error, onOpen, highlightRowId } = props;

  const propertyName = useCallback(
    (pid: string | null | undefined) => properties.find((p) => p.id === pid)?.name || '—',
    [properties],
  );

  const columns = useMemo<ColumnDef<MaintenanceRequestRow, unknown>[]>(() => {
    return [
      {
        id: 'unit',
        accessorFn: (r) => propertyName(r.property_id),
        header: 'יחידה',
        size: 140,
        minSize: 100,
        cell: ({ getValue }) => <span className="truncate text-sm font-medium text-gray-800">{String(getValue())}</span>,
      },
      {
        id: 'type',
        accessorFn: (r) => TYPE_LABELS[String(r.request_type)] || r.request_type || '—',
        header: 'סוג',
        size: 100,
        cell: ({ getValue }) => <span className="text-sm text-gray-700">{String(getValue())}</span>,
      },
      {
        id: 'urgency',
        accessorKey: 'urgency',
        header: 'דחיפות',
        size: 96,
        cell: ({ getValue }) => {
          const v = String(getValue() ?? '');
          const u = URGENCY_MAP[v] ?? { label: v || '—', className: 'bg-gray-100 text-gray-600' };
          return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${u.className}`}>{u.label}</span>;
        },
      },
      {
        id: 'assigned',
        accessorKey: 'assigned_to',
        header: 'מוקצה ל',
        size: 110,
        cell: ({ getValue }) => <span className="truncate text-sm text-gray-600">{String(getValue() ?? '—')}</span>,
      },
      bookingStatusColumn<MaintenanceRequestRow>(STATUS_MAP, 'status'),
      {
        id: 'opened',
        accessorFn: (r) => r.created_date || r.created_at || '',
        header: 'תאריך פתיחה',
        size: 120,
        minSize: 96,
        cell: ({ getValue }) => <span className="text-sm text-gray-700">{formatOpened(String(getValue() || '') || undefined)}</span>,
      },
      actionsColumn<MaintenanceRequestRow>('actions', 'פעולות', (row) => [{ label: 'פתיחה', onClick: () => onOpen(row) }]),
    ];
  }, [onOpen, propertyName]);

  const csvColumns: AtlasCsvColumn<MaintenanceRequestRow>[] = useMemo(
    () => [
      { label: 'יחידה', accessor: (r) => propertyName(r.property_id) },
      { label: 'סוג', accessor: (r) => TYPE_LABELS[String(r.request_type)] || r.request_type },
      { label: 'דחיפות', accessor: (r) => r.urgency },
      { label: 'מוקצה ל', accessor: (r) => r.assigned_to },
      { label: 'סטטוס', accessor: (r) => r.status },
      { label: 'נוצר', accessor: (r) => r.created_date || r.created_at },
      { label: 'כותרת', accessor: (r) => r.title },
    ],
    [propertyName],
  );

  return (
    <AtlasTable<MaintenanceRequestRow>
      tableId="maintenance_requests"
      columns={columns}
      data={requests}
      getRowId={(r) => r.id}
      isLoading={isLoading}
      error={error}
      onRowClick={onOpen}
      highlightRowId={highlightRowId}
      enableSelection={false}
      enableColumnResize
      enableMultiSort
      stickyHeader
      virtualScroll={requests.length >= 400}
      emptyMessage="אין בקשות תחזוקה"
      csvExport={{ filename: 'maintenance', columns: csvColumns }}
    />
  );
}
