import { create } from 'zustand';

export type PersistentToastItem = {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

const STORAGE_KEY = 'atlas_persistent_toast_dismissed';

function parseDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function appendDismissedId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const set = parseDismissedIds();
    set.add(id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore quota */
  }
}

type PersistentToastState = {
  items: PersistentToastItem[];
  show: (item: PersistentToastItem) => void;
  dismiss: (id: string) => void;
};

export const usePersistentToastStore = create<PersistentToastState>((set, get) => ({
  items: [],
  show: (item) => {
    if (parseDismissedIds().has(item.id)) return;
    const { items } = get();
    if (items.some((i) => i.id === item.id)) return;
    set({ items: [...items, item] });
  },
  dismiss: (id) => {
    appendDismissedId(id);
    set({ items: get().items.filter((i) => i.id !== id) });
  },
}));
