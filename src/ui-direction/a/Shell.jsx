/**
 * v7 direction A: a floating, detached white sidebar (24px radius, soft shadow) with labels,
 * the active item filled indigo, and a small indigo plan card at the bottom. Header and tab bar are shared.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { Wordmark, useNavGroups, useIsActive, MoreSheet } from '@/components/app/shell/shared';
import { Header as V7Header, TabBar, PlanCard } from '@/components/app/shell/v7';

export const shellClass = 'bg-canvas';
export { TabBar };
export function Header(props) { return <V7Header {...props} />; }

export function Sidebar({ onLogout, user }) {
  const groups = useNavGroups(user);
  const primary = groups[0].items;
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = groups.slice(1).some((g) => g.items.some((i) => isActive(i.page)));
  const linkCls = (active) => cn(
    'press flex h-12 items-center gap-3 rounded-full px-4 text-[15px]',
    active
      ? 'bg-brand-600 font-semibold text-white shadow-[0_1px_2px_rgba(42,26,201,0.3),0_10px_20px_-10px_rgba(62,43,241,0.7)]'
      : 'font-medium text-ink-600 hover:bg-[#F2F3F8] hover:text-navy-900',
  );
  return (
    <div className="h-full py-3 ps-3">
      <aside className="flex h-full w-[248px] flex-col rounded-[28px] bg-white shadow-[0_1px_2px_rgba(27,38,86,0.04),0_12px_40px_-12px_rgba(27,38,86,0.12)] ring-1 ring-[#E8EAF2]/70" aria-label="ניווט ראשי">
        <div className="flex h-[76px] shrink-0 items-center px-6">
          <Link to={createPageUrl('Dashboard')} aria-label="ATLAS, מסך היום" className="-mx-2 inline-flex h-11 items-center rounded-full px-2">
            <Wordmark size={22} />
          </Link>
        </div>
        <p className="px-7 pb-2 text-[12px] font-semibold text-ink-400">תפריט</p>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-1">
            {primary.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.page);
              return (
                <li key={item.page}>
                  <Link to={createPageUrl(item.page)} aria-current={active ? 'page' : undefined} className={linkCls(active)}>
                    <Icon className={cn('h-[19px] w-[19px] shrink-0', active ? 'text-white' : 'text-ink-400')} strokeWidth={active ? 2 : 1.6} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button type="button" onClick={() => setMoreOpen(true)} className={cn(linkCls(moreActive), 'w-full')}>
                <MoreHorizontal className={cn('h-[19px] w-[19px] shrink-0', moreActive ? 'text-white' : 'text-ink-400')} strokeWidth={1.6} />
                <span className="truncate">עוד</span>
              </button>
            </li>
          </ul>
        </nav>
        <div className="p-3">
          <PlanCard />
        </div>
        <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primary.map((i) => i.page)} />
      </aside>
    </div>
  );
}
