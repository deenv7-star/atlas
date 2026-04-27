import './atlasTableAugmentation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnSizingState,
  type Header,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Settings2, ArrowDown, ArrowUp, ArrowUpDown, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkeletonTableFull } from '@/components/skeletons/atlas-skeletons';
import { ErrorFallbackInline } from '@/components/ui/error-boundary-fallbacks';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  loadColumnSizing,
  loadColumnVisibility,
  saveColumnSizing,
  saveColumnVisibility,
} from './atlasTableStorage';

export type AtlasCsvColumn<TData> = { label: string; accessor: (row: TData) => unknown };

export type AtlasTableProps<TData extends object> = {
  tableId: string;
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  getRowId: (row: TData) => string;
  isLoading?: boolean;
  error?: Error | null;
  onRowClick?: (row: TData) => void;
  enableSelection?: boolean;
  enableColumnResize?: boolean;
  enableMultiSort?: boolean;
  stickyHeader?: boolean;
  /** When true, only visible rows mount (use for 500+ rows). */
  virtualScroll?: boolean;
  emptyMessage?: string;
  csvExport?: { filename: string; columns: AtlasCsvColumn<TData>[] };
  className?: string;
  onCellCommit?: (row: TData, columnId: string, value: string) => void | Promise<void>;
  bulkBar?: {
    onDeleteSelected?: (rows: TData[]) => void;
    onChangeStatus?: (rows: TData[]) => void;
    onExportCsv?: (rows: TData[]) => void;
  };
  /** Controlled sort state (e.g. URL). Provide both `sorting` and `onSortingChange`. */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Parent pre-sorts `data` (e.g. pagination); keep header UI in sync without re-sorting rows. */
  manualSorting?: boolean;
  /** When set, scrolls row into view and highlights for ~2s (e.g. deep link). */
  highlightRowId?: string | null;
};

const ROW_H = 48;
const SIZING_DEBOUNCE_MS = 280;

function buildCsv<TData extends object>(rows: TData[], columns: AtlasCsvColumn<TData>[]): string {
  const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const body = rows.map((row) =>
    columns
      .map((c) => {
        const val = c.accessor(row) ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(','),
  );
  return '\uFEFF' + [header, ...body].join('\n');
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function EditableCell<TData extends object>({
  value,
  row,
  columnId,
  meta,
  onCommit,
}: {
  value: unknown;
  row: Row<TData>;
  columnId: string;
  meta?: { atlasEditable?: boolean; atlasEditType?: 'text' | 'number' };
  onCommit?: (row: TData, columnId: string, value: string) => void | Promise<void>;
}): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(String(value ?? ''));
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, value]);

  if (!meta?.atlasEditable || !onCommit) {
    return <span className="truncate">{String(value ?? '')}</span>;
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={meta.atlasEditType === 'number' ? 'number' : 'text'}
        className="h-8 w-full min-w-0 rounded-md border border-indigo-200 bg-white px-2 text-sm"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          void onCommit(row.original, columnId, draft);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className="w-full truncate rounded px-1 py-0.5 text-start hover:bg-indigo-50/60"
      onDoubleClick={() => setEditing(true)}
    >
      {String(value ?? '')}
    </button>
  );
}

export function AtlasTable<TData extends object>(props: AtlasTableProps<TData>): React.ReactElement {
  const {
    tableId,
    columns,
    data,
    getRowId,
    isLoading,
    error,
    onRowClick,
    enableSelection = false,
    enableColumnResize = true,
    enableMultiSort = true,
    stickyHeader = true,
    virtualScroll = false,
    emptyMessage = 'אין נתונים להצגה',
    csvExport,
    className,
    onCellCommit,
    bulkBar,
    sorting: sortingControlled,
    onSortingChange: onSortingChangeControlled,
    manualSorting = false,
    highlightRowId = null,
  } = props;

  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = sortingControlled !== undefined ? sortingControlled : internalSorting;
  const setSorting: OnChangeFn<SortingState> = onSortingChangeControlled ?? setInternalSorting;
  const [flashRowId, setFlashRowId] = useState<string | null>(null);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => loadColumnSizing(tableId) ?? {});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => loadColumnVisibility(tableId) ?? {});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const lastClickedIndex = useRef<number | null>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const headerSelectRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!highlightRowId) {
      setFlashRowId(null);
      return;
    }
    setFlashRowId(highlightRowId);
    const scroll = () => {
      const root = bodyScrollRef.current;
      if (!root) return;
      const safe = highlightRowId.replace(/["\\]/g, '');
      const el = root.querySelector(`[data-row-id="${safe}"]`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    const raf = window.requestAnimationFrame(scroll);
    const t = window.setTimeout(() => setFlashRowId(null), 2000);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [highlightRowId]);

  const selectionColumn = useMemo<ColumnDef<TData, unknown>>(
    () => ({
      id: '_select',
      size: 44,
      minSize: 44,
      maxSize: 44,
      enableHiding: false,
      header: ({ table }) => (
        <div className="flex items-center justify-center pe-1">
          <input
            ref={headerSelectRef}
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            checked={table.getIsAllRowsSelected()}
            onChange={() => table.toggleAllRowsSelected(!table.getIsAllRowsSelected())}
            aria-label="בחר הכל"
          />
        </div>
      ),
      cell: ({ row, table }) => (
        <div className="flex items-center justify-center pe-1">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            checked={row.getIsSelected()}
            onChange={(e) => {
              e.stopPropagation();
              const flat = table.getRowModel().flatRows;
              const idx = flat.findIndex((r) => r.id === row.id);
              if ((e.nativeEvent as MouseEvent).shiftKey && lastClickedIndex.current !== null && idx >= 0) {
                const a = Math.min(lastClickedIndex.current, idx);
                const b = Math.max(lastClickedIndex.current, idx);
                const next: RowSelectionState = { ...table.getState().rowSelection };
                for (let i = a; i <= b; i++) next[flat[i]!.id] = true;
                table.setRowSelection(next);
              } else {
                row.toggleSelected(!row.getIsSelected());
              }
              lastClickedIndex.current = idx;
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label="בחר שורה"
          />
        </div>
      ),
      enableSorting: false,
      enableResizing: false,
    }),
    [],
  );

  const tableColumns = useMemo(() => {
    if (enableSelection) return [selectionColumn, ...columns];
    return columns;
  }, [columns, enableSelection, selectionColumn]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnSizing, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    manualSorting,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
    enableMultiSort: manualSorting ? false : enableMultiSort,
    isMultiSortEvent: (e) => (e as MouseEvent).shiftKey,
    columnResizeMode: 'onChange',
    enableColumnResizing: enableColumnResize,
    defaultColumn: { minSize: 56, maxSize: 560, size: 140 },
  });

  useEffect(() => {
    const t = window.setTimeout(() => saveColumnSizing(tableId, columnSizing), SIZING_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [tableId, columnSizing]);

  useEffect(() => {
    const t = window.setTimeout(() => saveColumnVisibility(tableId, columnVisibility), SIZING_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [tableId, columnVisibility]);

  useEffect(() => {
    const el = headerSelectRef.current;
    if (!el) return;
    el.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
  }, [rowSelection, table]);

  const flatRows = table.getRowModel().flatRows;
  const rowVirtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => bodyScrollRef.current,
    estimateSize: () => ROW_H,
    overscan: 14,
  });

  const leafHeaders = table.getHeaderGroups().at(-1)?.headers ?? [];
  const totalSize = leafHeaders.reduce((s, h) => s + h.getSize(), 0) || 1;
  const gridTemplate = leafHeaders.map((h) => `minmax(0,${((h.getSize() / totalSize) * 100).toFixed(4)}fr)`).join(' ');

  const selectedRows = useMemo(() => {
    return flatRows.filter((r) => r.getIsSelected()).map((r) => r.original);
  }, [flatRows, rowSelection]);

  const handleExportView = useCallback(() => {
    if (!csvExport) return;
    const rows = flatRows.map((r) => r.original);
    downloadCsv(buildCsv(rows, csvExport.columns), csvExport.filename);
  }, [csvExport, flatRows]);

  const clearSelection = useCallback(() => setRowSelection({}), []);

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border border-gray-100 bg-white p-4', className)}>
        <SkeletonTableFull />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-xl border border-gray-100 bg-white p-4', className)}>
        <ErrorFallbackInline error={error} reset={() => window.location.reload()} section={tableId} />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={cn('rounded-xl border border-gray-100 bg-white py-16 text-center text-sm text-gray-500', className)}>
        {emptyMessage}
      </div>
    );
  }

  const renderHeaderSortIcon = (header: Header<TData, unknown>) => {
    const sorted = header.column.getIsSorted();
    if (!header.column.getCanSort()) return null;
    const sortIdx = sorting.findIndex((s) => s.id === header.column.id);
    const multi = sorting.length > 1 && sortIdx >= 0;
    if (sorted === 'asc')
      return (
        <span className="ms-1 inline-flex items-center gap-0.5 text-indigo-600">
          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
          {multi ? <span className="text-[10px] font-bold">{sortIdx + 1}</span> : null}
        </span>
      );
    if (sorted === 'desc')
      return (
        <span className="ms-1 inline-flex items-center gap-0.5 text-indigo-600">
          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          {multi ? <span className="text-[10px] font-bold">{sortIdx + 1}</span> : null}
        </span>
      );
    return <ArrowUpDown className="ms-1 inline h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100" aria-hidden />;
  };

  const renderCell = (row: Row<TData>, cell: ReturnType<Row<TData>['getVisibleCells']>[number]) => {
    const meta = cell.column.columnDef.meta;
    if (cell.column.id === '_select') {
      return flexRender(cell.column.columnDef.cell, cell.getContext());
    }
    if (meta?.atlasEditable && onCellCommit) {
      return (
        <EditableCell
          value={cell.getValue()}
          row={row}
          columnId={cell.column.id}
          meta={meta}
          onCommit={onCellCommit}
        />
      );
    }
    return flexRender(cell.column.columnDef.cell, cell.getContext());
  };

  const renderRow = (row: Row<TData>, style?: React.CSSProperties) => (
    <div
      role="row"
      key={row.id}
      data-row-id={row.id}
      className={cn(
        'grid items-center border-b border-gray-100/90 text-sm text-gray-800 transition-colors',
        row.getIsSelected() && 'bg-indigo-50/50',
        flashRowId && row.id === flashRowId && 'bg-amber-50 ring-2 ring-amber-300/90 ring-inset',
        onRowClick && 'cursor-pointer hover:bg-gray-50/80',
      )}
      style={{ ...style, gridTemplateColumns: gridTemplate, minHeight: ROW_H }}
      onClick={() => onRowClick?.(row.original)}
    >
      {row.getVisibleCells().map((cell) => (
        <div
          role="cell"
          key={cell.id}
          className="min-w-0 px-2 py-2 text-start align-middle"
          onClick={(e) => {
            if (cell.column.id === '_select') e.stopPropagation();
          }}
        >
          {renderCell(row, cell)}
        </div>
      ))}
    </div>
  );

  const showBulk = enableSelection && selectedRows.length > 0 && bulkBar;

  return (
    <div className={cn('rounded-xl border border-gray-100 bg-white shadow-sm', className)} dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/80 px-3 py-2">
        <div className="flex min-h-8 flex-1 flex-wrap items-center gap-2">
          {showBulk ? (
            <>
              <span className="text-xs font-semibold text-gray-600">{selectedRows.length} נבחרו</span>
              {bulkBar?.onDeleteSelected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 border-red-200 text-xs text-red-700"
                  onClick={() => bulkBar.onDeleteSelected?.(selectedRows)}
                >
                  מחק נבחרים
                </Button>
              ) : null}
              {bulkBar?.onChangeStatus ? (
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => bulkBar.onChangeStatus?.(selectedRows)}>
                  שנה סטטוס
                </Button>
              ) : null}
              {bulkBar?.onExportCsv ? (
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => bulkBar.onExportCsv?.(selectedRows)}>
                  ייצא
                </Button>
              ) : null}
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={clearSelection}>
                נקה בחירה
              </Button>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {csvExport ? (
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={handleExportView}>
              ייצא CSV
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" aria-label="עמודות">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">הצגת עמודות</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllLeafColumns().map((col) => {
                if (col.id === '_select' || !col.getCanHide()) return null;
                return (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="text-xs"
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        ref={bodyScrollRef}
        className={cn(virtualScroll && 'max-h-[min(70vh,640px)] overflow-y-auto', 'overflow-x-auto lg:overflow-x-hidden')}
      >
        <div role="table" className="w-full min-w-0">
          <div
            role="rowgroup"
            className={cn(
              'border-b border-gray-200 bg-gray-50/95 text-xs font-semibold uppercase tracking-wide text-gray-500',
              stickyHeader && 'sticky top-0 z-20',
            )}
          >
            {table.getHeaderGroups().map((hg) => (
              <div key={hg.id} role="row" className="grid" style={{ gridTemplateColumns: gridTemplate }}>
                {hg.headers.map((header) => (
                  <div
                    key={header.id}
                    role="columnheader"
                    className="group relative flex min-w-0 items-center px-2 py-2.5 text-start"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={cn(
                          'flex min-w-0 flex-1 items-center truncate text-start font-semibold text-gray-700',
                          header.column.getCanSort() && 'cursor-pointer select-none hover:text-gray-900',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {renderHeaderSortIcon(header)}
                      </button>
                    )}
                    {enableColumnResize && header.column.getCanResize() ? (
                      <button
                        type="button"
                        aria-label="שינוי רוחב עמודה"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          'absolute end-0 top-0 z-10 flex h-full w-3 cursor-col-resize touch-none select-none items-center justify-center pe-1 opacity-0 hover:opacity-100',
                          header.column.getIsResizing() && 'opacity-100',
                        )}
                      >
                        <GripVertical className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div role="rowgroup" className="relative bg-white" style={virtualScroll ? { height: rowVirtualizer.getTotalSize() } : undefined}>
            {virtualScroll
              ? rowVirtualizer.getVirtualItems().map((v) => {
                  const row = flatRows[v.index];
                  if (!row) return null;
                  return (
                    <div key={row.id} className="absolute start-0 w-full" style={{ transform: `translateY(${v.start}px)`, height: `${v.size}px` }}>
                      {renderRow(row)}
                    </div>
                  );
                })
              : flatRows.map((row) => renderRow(row))}
          </div>
        </div>
      </div>
    </div>
  );
}
