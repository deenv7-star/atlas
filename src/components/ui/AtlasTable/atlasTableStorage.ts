const sizingKey = (tableId: string) => `atlas_table_sizing_${tableId}`;
const visibilityKey = (tableId: string) => `atlas_table_visibility_${tableId}`;

export function loadColumnSizing(tableId: string): Record<string, number> | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(sizingKey(tableId));
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return undefined;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    }
    return Object.keys(out).length ? out : undefined;
  } catch {
    return undefined;
  }
}

export function saveColumnSizing(tableId: string, sizing: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(sizingKey(tableId), JSON.stringify(sizing));
  } catch {
    /* quota */
  }
}

export function loadColumnVisibility(tableId: string): Record<string, boolean> | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(visibilityKey(tableId));
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return undefined;
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'boolean') out[k] = v;
    }
    return Object.keys(out).length ? out : undefined;
  } catch {
    return undefined;
  }
}

export function saveColumnVisibility(tableId: string, visibility: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(visibilityKey(tableId), JSON.stringify(visibility));
  } catch {
    /* quota */
  }
}
