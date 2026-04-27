import type { RowData } from '@tanstack/table-core';

declare module '@tanstack/table-core' {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** When true, double-click cell opens inline editor (requires `onCellCommit`). */
    atlasEditable?: boolean;
    atlasEditType?: 'text' | 'number';
  }
}

export {};
