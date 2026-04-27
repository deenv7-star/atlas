import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  useCommandState,
} from 'cmdk';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Wrench,
  Wallet,
  Settings,
  PlusCircle,
  UserPlus,
  ClipboardList,
  Banknote,
  Search,
  Building2,
  Home,
  Clock,
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { searchCommandPaletteEntities, type SearchHit } from './commandPaletteSearch';
import { getCommandPaletteRecents, recordCommandPaletteVisit, type RecentVisit } from './commandPaletteRecents';
import type { CommandPaletteNavigateState } from '@/lib/commandPaletteNavigationState';

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string | null;
};

function useIsApplePlatform(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || '');
}

function modLabel(isApple: boolean): string {
  return isApple ? '⌘' : 'Ctrl';
}

function ChordHint({ keys, isApple }: { keys: string[]; isApple: boolean }): React.ReactElement {
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-medium text-gray-400 tabular-nums" dir="ltr">
      <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-mono text-[10px] text-gray-600">G</kbd>
      <span className="text-gray-300">←</span>
      {keys.map((k) => (
        <kbd
          key={k}
          className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-mono text-[10px] uppercase text-gray-600"
        >
          {k}
        </kbd>
      ))}
      <span className="mr-1 text-[9px] text-gray-300">{isApple ? 'Mac' : 'Win'}</span>
    </span>
  );
}

function OpenHint({ isApple }: { isApple: boolean }): React.ReactElement {
  return (
    <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-600" dir="ltr">
      {isApple ? '⌘' : 'Ctrl'}+K
    </kbd>
  );
}

const CHORD_MAP: Record<string, string> = {
  d: createPageUrl('Dashboard'),
  b: createPageUrl('Bookings'),
  g: createPageUrl('Leads'),
  c: createPageUrl('MultiCalendar'),
  m: createPageUrl('ServiceRequests'),
  f: createPageUrl('Payments'),
  s: createPageUrl('Settings'),
};

function CommandPaletteAnnouncer(): React.ReactElement {
  const value = useCommandState((s) => s.value);
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    if (!value) {
      setText('');
      return;
    }
    const el = [...document.querySelectorAll('[cmdk-item]')].find((n) => n.getAttribute('data-value') === value);
    const ann = el?.getAttribute('data-announce');
    setText(ann || '');
  }, [value]);

  return (
    <div className="sr-only" aria-live="polite" aria-atomic>
      {text}
    </div>
  );
}

export function CommandPalette(props: CommandPaletteProps): React.ReactElement {
  const { open, onOpenChange, orgId } = props;
  const navigate = useNavigate();
  const isApple = useIsApplePlatform();

  const [remote, setRemote] = React.useState<{ bookings: SearchHit[]; guests: SearchHit[]; units: SearchHit[] }>({
    bookings: [],
    guests: [],
    units: [],
  });
  const [remoteLoading, setRemoteLoading] = React.useState(false);
  const [recents, setRecents] = React.useState<RecentVisit[]>([]);

  const search = useCommandState((s) => s.search);

  React.useEffect(() => {
    if (open) setRecents(getCommandPaletteRecents());
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const q = search.trim();
    if (q.length < 2) {
      setRemote({ bookings: [], guests: [], units: [] });
      setRemoteLoading(false);
      return;
    }
    setRemoteLoading(true);
    const t = window.setTimeout(() => {
      void searchCommandPaletteEntities(orgId, q)
        .then(setRemote)
        .finally(() => setRemoteLoading(false));
    }, 200);
    return () => window.clearTimeout(t);
  }, [search, open, orgId]);

  /** G-chord: listen only when palette closed */
  React.useEffect(() => {
    if (open) return;

    let armed = false;
    let timer: number | undefined;

    const disarm = () => {
      armed = false;
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (armed) {
        disarm();
        const path = CHORD_MAP[k];
        if (path) {
          e.preventDefault();
          navigate(path);
        }
        return;
      }

      if (k === 'g') {
        e.preventDefault();
        armed = true;
        timer = window.setTimeout(disarm, 1000);
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      disarm();
    };
  }, [open, navigate]);

  /** Cmd/Ctrl+K — toggle */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'k' && e.key !== 'K') return;
      if (!(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      onOpenChange(!open);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenChange, open]);

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  const go = React.useCallback(
    (path: string, routerState?: CommandPaletteNavigateState) => {
      navigate(path, routerState !== undefined ? { state: routerState } : undefined);
      close();
    },
    [navigate, close],
  );

  const calendarUrlForUnit = (unitId: string, propertyId?: string | null) => {
    const qs = new URLSearchParams();
    if (propertyId) qs.set('propertyId', propertyId);
    qs.set('unitId', unitId);
    return `${createPageUrl('MultiCalendar')}?${qs.toString()}`;
  };

  const announce = (title: string, subtitle?: string) => [title, subtitle].filter(Boolean).join(', ');

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      overlayClassName="fixed inset-0 z-[200] bg-white/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      contentClassName={cn(
        'fixed left-[50%] top-[16%] z-[201] grid w-[calc(100vw-1.5rem)] max-w-[580px] translate-x-[-50%] translate-y-0',
        'overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 p-0 shadow-2xl shadow-gray-900/10 backdrop-blur-xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      )}
    >
      <CommandPaletteAnnouncer />
      <div dir="rtl" className="flex flex-col">
        <div className="border-b border-gray-100/90 px-3 py-2">
          <CommandInput
            placeholder="חפש, נווט, פעל..."
            className={cn(
              'flex h-12 w-full rounded-none border-0 bg-transparent py-3 text-base text-gray-900 outline-none',
              'placeholder:text-gray-400 focus:ring-0',
            )}
          />
        </div>
        <CommandList
          className="max-h-[320px] overflow-y-auto overflow-x-hidden scroll-py-1 py-2 outline-none"
          aria-label="תוצאות"
        >
          <CommandEmpty className="px-4 py-6 text-center text-sm text-gray-500">
            <p className="font-medium text-gray-700">
              לא נמצאו תוצאות עבור &quot;{search.trim() || '…'}&quot;
            </p>
            <p className="mt-2 text-xs text-gray-400">נסה מילת חיפוש אחרת, או צור רשומה חדשה מפעולות מהירות.</p>
          </CommandEmpty>

          {!search.trim() && recents.length > 0 ? (
            <CommandGroup heading="פעולות אחרונות" className="px-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500">
              {recents.map((r) => (
                <CommandItem
                  key={`${r.kind}-${r.id}`}
                  value={`recent-${r.kind}-${r.id}-${r.title}`}
                  data-announce={announce(r.title, r.subtitle)}
                  onSelect={() => {
                    recordCommandPaletteVisit(r);
                    if (r.kind === 'booking') go(`${createPageUrl('Bookings')}?openBookingId=${encodeURIComponent(r.id)}`);
                    else if (r.kind === 'guest') go(`${createPageUrl('Leads')}?openGuestId=${encodeURIComponent(r.id)}`);
                    else go(calendarUrlForUnit(r.id, r.propertyId ?? null));
                  }}
                  className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm text-gray-900 data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    {r.kind === 'booking' ? <CalendarDays className="h-4 w-4" /> : null}
                    {r.kind === 'guest' ? <Users className="h-4 w-4" /> : null}
                    {r.kind === 'unit' ? <Home className="h-4 w-4" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 text-start">
                    <span className="block truncate font-medium">{r.title}</span>
                    {r.subtitle ? <span className="block truncate text-xs text-gray-500">{r.subtitle}</span> : null}
                  </span>
                  <Clock className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {!search.trim() && recents.length > 0 ? <CommandSeparator className="my-2 bg-gray-100" /> : null}

          <CommandGroup
            heading="ניווט מהיר"
            className="px-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500"
          >
            <CommandItem
              value="nav-dashboard"
              data-announce={announce('לוח בקרה')}
              onSelect={() => go(createPageUrl('Dashboard'))}
              className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
              <span className="flex-1 text-start font-medium">לוח בקרה</span>
              <ChordHint keys={['D']} isApple={isApple} />
            </CommandItem>
            <CommandItem
              value="nav-bookings"
              data-announce={announce('הזמנות')}
              onSelect={() => go(createPageUrl('Bookings'))}
              className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
            >
              <CalendarDays className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
              <span className="flex-1 text-start font-medium">הזמנות</span>
              <ChordHint keys={['B']} isApple={isApple} />
            </CommandItem>
            <CommandItem
              value="nav-guests"
              data-announce={announce('אורחים')}
              onSelect={() => go(createPageUrl('Leads'))}
              className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
            >
              <Users className="h-4 w-4 shrink-0 text-purple-500" aria-hidden />
              <span className="flex-1 text-start font-medium">אורחים</span>
              <ChordHint keys={['G']} isApple={isApple} />
            </CommandItem>
            <CommandItem
              value="nav-calendar"
              data-announce={announce('לוח שנה')}
              onSelect={() => go(createPageUrl('MultiCalendar'))}
              className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
            >
              <CalendarDays className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
              <span className="flex-1 text-start font-medium">לוח שנה</span>
              <ChordHint keys={['C']} isApple={isApple} />
            </CommandItem>
            <CommandItem
              value="nav-maintenance"
              data-announce={announce('תחזוקה')}
              onSelect={() => go(createPageUrl('ServiceRequests'))}
              className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
            >
              <Wrench className="h-4 w-4 shrink-0 text-orange-600" aria-hidden />
              <span className="flex-1 text-start font-medium">תחזוקה</span>
              <ChordHint keys={['M']} isApple={isApple} />
            </CommandItem>
            <CommandItem
              value="nav-financials"
              data-announce={announce('דוחות כספיים')}
              onSelect={() => go(createPageUrl('Payments'))}
              className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
            >
              <Wallet className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span className="flex-1 text-start font-medium">דוחות כספיים</span>
              <ChordHint keys={['F']} isApple={isApple} />
            </CommandItem>
            <CommandItem
              value="nav-settings"
              data-announce={announce('הגדרות')}
              onSelect={() => go(createPageUrl('Settings'))}
              className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
            >
              <Settings className="h-4 w-4 shrink-0 text-gray-600" aria-hidden />
              <span className="flex-1 text-start font-medium">הגדרות</span>
              <ChordHint keys={['S']} isApple={isApple} />
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="my-2 bg-gray-100" />

          <CommandGroup
            heading="פעולות מהירות"
            className="px-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500"
          >
            <CommandItem
              value="act-new-booking"
              data-announce={announce('הזמנה חדשה')}
              onSelect={() => go(createPageUrl('Bookings'), { commandPalette: { newBooking: true } })}
              className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
            >
              <PlusCircle className="h-4 w-4 shrink-0 text-[#00D1C1]" aria-hidden />
              <span className="flex-1 text-start font-medium">הזמנה חדשה</span>
            </CommandItem>
            <CommandItem
              value="act-new-guest"
              data-announce={announce('אורח חדש')}
              onSelect={() => go(createPageUrl('Leads'), { commandPalette: { newGuest: true } })}
              className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
            >
              <UserPlus className="h-4 w-4 shrink-0 text-purple-500" aria-hidden />
              <span className="flex-1 text-start font-medium">אורח חדש</span>
            </CommandItem>
            <CommandItem
              value="act-new-maintenance"
              data-announce={announce('משימת תחזוקה חדשה')}
              onSelect={() => go(createPageUrl('ServiceRequests'), { commandPalette: { newMaintenance: true } })}
              className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
            >
              <ClipboardList className="h-4 w-4 shrink-0 text-orange-600" aria-hidden />
              <span className="flex-1 text-start font-medium">משימת תחזוקה חדשה</span>
            </CommandItem>
            <CommandItem
              value="act-new-payment"
              data-announce={announce('רישום תשלום')}
              onSelect={() => go(createPageUrl('Payments'), { commandPalette: { newPayment: true } })}
              className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
            >
              <Banknote className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span className="flex-1 text-start font-medium">רישום תשלום</span>
            </CommandItem>
          </CommandGroup>

          {search.trim().length >= 2 ? (
            <>
              <CommandSeparator className="my-2 bg-gray-100" />
              <CommandGroup
                heading="חיפוש חי"
                className="px-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500"
              >
                {remoteLoading ? (
                  <div className="px-3 py-2 text-xs text-gray-400">טוען…</div>
                ) : null}
                {remote.bookings.map((h) => (
                  <CommandItem
                    key={`sb-${h.id}`}
                    value={`search-booking-${h.id}-${h.title}`}
                    keywords={[h.title, h.subtitle, 'הזמנה']}
                    data-announce={announce(h.title, h.subtitle)}
                    onSelect={() => {
                      recordCommandPaletteVisit({ kind: 'booking', id: h.id, title: h.title, subtitle: h.subtitle });
                      go(`${createPageUrl('Bookings')}?openBookingId=${encodeURIComponent(h.id)}`);
                    }}
                    className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
                  >
                    <CalendarDays className="h-4 w-4 shrink-0 text-blue-500" />
                    <span className="min-w-0 flex-1 text-start">
                      <span className="block truncate font-medium">{h.title}</span>
                      <span className="block truncate text-xs text-gray-500">{h.subtitle}</span>
                    </span>
                    <Search className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />
                  </CommandItem>
                ))}
                {remote.guests.map((h) => (
                  <CommandItem
                    key={`sg-${h.id}`}
                    value={`search-guest-${h.id}-${h.title}`}
                    keywords={[h.title, h.subtitle, 'אורח']}
                    data-announce={announce(h.title, h.subtitle)}
                    onSelect={() => {
                      recordCommandPaletteVisit({ kind: 'guest', id: h.id, title: h.title, subtitle: h.subtitle });
                      go(`${createPageUrl('Leads')}?openGuestId=${encodeURIComponent(h.id)}`);
                    }}
                    className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
                  >
                    <Users className="h-4 w-4 shrink-0 text-purple-500" />
                    <span className="min-w-0 flex-1 text-start">
                      <span className="block truncate font-medium">{h.title}</span>
                      <span className="block truncate text-xs text-gray-500">{h.subtitle}</span>
                    </span>
                    <Search className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />
                  </CommandItem>
                ))}
                {remote.units.map((h) => (
                  <CommandItem
                    key={`su-${h.id}`}
                    value={`search-unit-${h.id}-${h.title}`}
                    keywords={[h.title, h.subtitle, 'יחידה']}
                    data-announce={announce(h.title, h.subtitle)}
                    onSelect={() => {
                      recordCommandPaletteVisit({
                        kind: 'unit',
                        id: h.id,
                        title: h.title,
                        subtitle: h.subtitle,
                        propertyId: h.propertyId ?? undefined,
                      });
                      go(calendarUrlForUnit(h.id, h.propertyId ?? null));
                    }}
                    className="mx-1 flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-sm data-[selected=true]:bg-[var(--color-background-secondary)] data-[selected=true]:outline-none"
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-gray-600" />
                    <span className="min-w-0 flex-1 text-start">
                      <span className="block truncate font-medium">{h.title}</span>
                      <span className="block truncate text-xs text-gray-500">{h.subtitle}</span>
                    </span>
                    <Search className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />
                  </CommandItem>
                ))}
                {!remoteLoading &&
                remote.bookings.length + remote.guests.length + remote.units.length === 0 &&
                search.trim().length >= 2 ? (
                  <div className="px-3 py-2 text-xs text-gray-400">אין תוצאות חיפוש בשרת עבור מחרוזת זו.</div>
                ) : null}
              </CommandGroup>
            </>
          ) : null}
        </CommandList>
        <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-[10px] text-gray-400">
          <span>
            {modLabel(isApple)}+K לפתיחה · Esc לסגירה
          </span>
          <OpenHint isApple={isApple} />
        </div>
      </div>
    </CommandDialog>
  );
}
