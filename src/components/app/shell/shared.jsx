/** Shell building blocks shared by both layout directions. */
import React from 'react';
import BrandWordmark from '@/components/common/BrandWordmark';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { STALE_REFERENCE_MS } from '@/lib/queryStaleTimes';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { NAV_GROUPS, PLATFORM_ITEM, NAV_PARENT } from '@/config/navigation';
import { isPlatformAdminViewer } from '@/lib/platformAdmin';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, LogOut, Settings, CreditCard, Compass } from 'lucide-react';
import { startTour } from '@/lib/tour/tourState';

export function Wordmark({ className, inverted = false, size = 22 }) {
  return <span className={cn('inline-flex items-center leading-none', className)} style={{ color: inverted ? '#fff' : '#202334' }} dir="ltr"><BrandWordmark size={size} inverted={inverted} /></span>;
}

/** Same query + cache key the header always used, so nothing new hits the backend. */
export function useShellProperties(user) {
  const orgId = user?.organization_id ?? user?.org_id ?? null;
  const { data: properties = [] } = useQuery({
    queryKey: ['properties-header', orgId],
    queryFn: () =>
      orgId
        ? base44.entities.Property.filter({ org_id: orgId }, 'name', 200, { select: 'id,name,org_id' })
        : Promise.resolve([]),
    enabled: !!orgId,
    staleTime: STALE_REFERENCE_MS,
  });
  return properties;
}

export function useNavGroups(user) {
  const showPlatform = isPlatformAdminViewer(user);
  if (!showPlatform) return NAV_GROUPS;
  const last = NAV_GROUPS[NAV_GROUPS.length - 1];
  return [...NAV_GROUPS.slice(0, -1), { ...last, items: [...last.items, PLATFORM_ITEM] }];
}

export function useIsActive() {
  const location = useLocation();
  const matches = (page) => {
    const url = createPageUrl(page);
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };
  return (page) => {
    if (matches(page)) return true;
    return Object.entries(NAV_PARENT).some(([child, parent]) => parent === page && matches(child));
  };
}

export function initialsOf(user) {
  const name = user?.full_name || user?.email || '';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'א';
}

export function UserMenu({ user, onLogout, children, align = 'end', side }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-60" dir="rtl">
        <div className="px-2.5 py-2">
          <p className="truncate text-[15px] font-bold text-navy-900">{user?.full_name || 'החשבון שלי'}</p>
          <p className="truncate text-[13px] text-ink-400" dir="ltr">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-11 gap-2.5 text-[15px]">
          <Link to={createPageUrl('Settings')}><Settings className="h-[18px] w-[18px] text-ink-600" />הגדרות</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-11 gap-2.5 text-[15px]">
          <Link to={createPageUrl('Subscription')}><CreditCard className="h-[18px] w-[18px] text-ink-600" />מנוי</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => startTour(0)} className="min-h-11 gap-2.5 text-[15px]">
          <Compass className="h-[18px] w-[18px] text-ink-600" />סיור מודרך
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} className="min-h-11 gap-2.5 text-[15px] text-danger-600 focus:text-danger-700">
          <LogOut className="h-[18px] w-[18px]" />יציאה מהחשבון
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** iOS-style grouped list of every destination — the mobile "עוד" sheet. */
export function MoreSheet({ open, onOpenChange, user, onLogout, exclude = [] }) {
  const groups = useNavGroups(user)
    .map((g) => ({ ...g, items: g.items.filter((i) => !exclude.includes(i.page)) }))
    .filter((g) => g.items.length);
  const isActive = useIsActive();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] gap-3 overflow-y-auto bg-canvas sm:max-w-md">
        <DialogTitle className="px-1 text-[20px] font-bold text-navy-900">עוד</DialogTitle>
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.id}>
              {g.label ? <p className="mb-1.5 px-3 text-[13px] font-medium text-ink-400">{g.label}</p> : null}
              <div className="overflow-hidden v7-card">
                {g.items.map((item, i) => {
                  const Icon = item.icon;
                  const active = isActive(item.page);
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        'press flex min-h-[56px] items-center gap-3.5 px-4 active:bg-neutral-100',
                        i > 0 && 'border-t border-line',
                      )}
                    >
                      <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-brand-600' : 'text-ink-600')} strokeWidth={1.5} />
                      <span className={cn('flex-1 text-[16px]', active ? 'font-bold text-brand-700' : 'font-medium text-navy-900')}>{item.label}</span>
                      <ChevronLeft className="h-4 w-4 text-ink-400" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={onLogout}
            className="press flex min-h-[52px] w-full items-center justify-center v7-card text-[16px] font-medium text-danger-600"
          >
            יציאה מהחשבון
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Tab bar slot icons are read from the nav map so labels never drift. */
export function navItem(page) {
  for (const g of NAV_GROUPS) for (const i of g.items) if (i.page === page) return i;
  return null;
}
