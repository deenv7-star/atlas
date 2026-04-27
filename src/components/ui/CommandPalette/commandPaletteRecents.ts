const STORAGE_KEY = 'atlas_command_palette_recents';
const MAX = 5;

export type RecentVisitKind = 'booking' | 'guest' | 'unit';

export type RecentVisit = {
  kind: RecentVisitKind;
  id: string;
  title: string;
  subtitle?: string;
  visitedAt: number;
  /** ליחידה: מזהה נכס ללוח שנה */
  propertyId?: string | null;
};

function readAll(): RecentVisit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is RecentVisit =>
          x &&
          typeof x === 'object' &&
          (x as RecentVisit).kind &&
          typeof (x as RecentVisit).id === 'string' &&
          typeof (x as RecentVisit).title === 'string' &&
          typeof (x as RecentVisit).visitedAt === 'number',
      )
      .sort((a, b) => b.visitedAt - a.visitedAt);
  } catch {
    return [];
  }
}

export function getCommandPaletteRecents(): RecentVisit[] {
  return readAll().slice(0, MAX);
}

export function recordCommandPaletteVisit(entry: Omit<RecentVisit, 'visitedAt'>): void {
  try {
    const list = readAll().filter((x) => !(x.kind === entry.kind && x.id === entry.id));
    list.unshift({ ...entry, visitedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore quota */
  }
}
