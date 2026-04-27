import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export type StatusBadgeConfig = Record<string, { label: string; className: string }>;

export function bookingStatusColumn<T extends { status?: string | null }>(
  statusMap: StatusBadgeConfig,
  accessorKey: keyof T & string = 'status',
): ColumnDef<T, unknown> {
  return {
    id: String(accessorKey),
    accessorKey: accessorKey as string,
    header: 'סטטוס',
    size: 120,
    minSize: 96,
    cell: ({ getValue }) => {
      const v = String(getValue() ?? '');
      const cfg = statusMap[v] ?? statusMap.PENDING ?? { label: v || '—', className: 'bg-gray-100 text-gray-600' };
      return (
        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold', cfg.className)}>{cfg.label}</span>
      );
    },
  };
}

export function guestNameColumn<
  T extends { guest_name?: string | null; guest_email?: string | null },
>(): ColumnDef<T, unknown> {
  return {
    id: 'guest',
    accessorFn: (row) => `${row.guest_name ?? ''} ${row.guest_email ?? ''}`,
    header: 'אורח',
    size: 220,
    minSize: 160,
    cell: ({ row }) => {
      const name = row.original.guest_name || 'אורח';
      const email = row.original.guest_email || '';
      const initial = name.trim().charAt(0) || 'א';
      return (
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-bold text-indigo-800">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
            {email ? <p className="truncate text-[11px] text-gray-500">{email}</p> : null}
          </div>
        </div>
      );
    },
  };
}

export function guestLeadNameColumn<
  T extends { full_name?: string | null; name?: string | null; email?: string | null },
>(): ColumnDef<T, unknown> {
  return {
    id: 'guest',
    accessorFn: (row) => `${row.full_name ?? row.name ?? ''} ${row.email ?? ''}`,
    header: 'שם',
    size: 200,
    minSize: 140,
    cell: ({ row }) => {
      const name = row.original.full_name || row.original.name || '—';
      const email = row.original.email || '';
      const initial = String(name).trim().charAt(0) || '?';
      return (
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 text-xs font-bold text-purple-800">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
            {email ? <p className="truncate text-[11px] text-gray-500">{email}</p> : null}
          </div>
        </div>
      );
    },
  };
}

export function currencyColumn<T extends object>(field: keyof T & string, header: string): ColumnDef<T, unknown> {
  return {
    id: field,
    accessorKey: field as string,
    header,
    size: 100,
    minSize: 80,
    cell: ({ getValue }) => {
      const raw = getValue();
      const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''));
      const formatted = Number.isFinite(n) ? n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—';
      return <span className="block text-start font-mono text-sm font-semibold tabular-nums text-gray-900">₪{formatted}</span>;
    },
  };
}

export function dateColumn<T extends object>(
  field: keyof T & string,
  header: string,
  formatCell: (iso: string | null | undefined) => string,
): ColumnDef<T, unknown> {
  return {
    id: field,
    accessorKey: field as string,
    header,
    size: 110,
    minSize: 88,
    cell: ({ getValue }) => <span className="text-sm text-gray-700">{formatCell(String(getValue() ?? '') || undefined)}</span>,
  };
}

export type AtlasRowAction<T> = { label: string; onClick: (row: T) => void; destructive?: boolean };

export function actionsColumn<T extends object>(id: string, header: string, getActions: (row: T) => AtlasRowAction<T>[]): ColumnDef<T, unknown> {
  return {
    id,
    header,
    size: 56,
    minSize: 52,
    maxSize: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const actions = getActions(row.original);
      if (!actions.length) return null;
      return (
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="פעולות">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              {actions.map((a) => (
                <DropdownMenuItem
                  key={a.label}
                  className={cn('text-xs', a.destructive && 'text-red-600 focus:text-red-600')}
                  onClick={() => a.onClick(row.original)}
                >
                  {a.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  };
}
