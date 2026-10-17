/**
 * v7 direction B (Dei / Activity style): a slim floating icon rail (pill, 32px radius) with tooltips,
 * the active icon in a filled indigo circle, and wider content. Header and tab bar are shared with A.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { useNavGroups, useIsActive, MoreSheet } from '@/components/app/shell/shared';
import { Header as V7Header, TabBar, PlanCard } from '@/components/app/shell/v7';

export const shellClass = 'bg-canvas';
export { TabBar };
export function Header(props) { return <V7Header {...props} />; }

function Mark() {
  return (
    <span aria-hidden className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-[17px] font-extrabold text-white" dir="ltr">
      A<span className="ms-px inline-block h-1.5 w-1.5 rounded-full bg-[#8F84FF]" />
    </span>
  );
}

export function Sidebar({ onLogout, user }) {
  const groups = useNavGroups(user);
  const primary = groups[0].items;
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = groups.slice(1).some((g) => g.items.some((i) => isActive(i.page)));
  const btn = (active) => cn(
    'v7-tt press relative inline-flex h-12 w-12 items-center justify-center rounded-full',
    active
      ? 'bg-brand-600 text-white shadow-[0_1px_2px_rgba(42,26,201,0.3),0_10px_20px_-8px_rgba(62,43,241,0.7)]'
      : 'text-ink-400 hover:bg-[#F2F3F8] hover:text-navy-900',
  );
  return (
    <div className="relative z-30 h-full py-3 ps-3">
      <aside className="flex h-full w-[76px] flex-col items-center rounded-[32px] bg-white py-4 shadow-[0_1px_2px_rgba(27,38,86,0.04),0_12px_40px_-12px_rgba(27,38,86,0.14)] ring-1 ring-[#E8EAF2]/70" aria-label="ניווט ראשי">
        <Link to={createPageUrl('Dashboard')} aria-label="ATLAS, מסך היום" className="press rounded-full">
          <Mark />
        </Link>
        <span aria-hidden className="my-4 h-px w-8 bg-[#EEF0F5]" />
        <nav className="flex flex-1 flex-col items-center">
          <ul className="flex flex-col items-center gap-2">
            {primary.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.page);
              return (
                <li key={item.page}>
                  <Link to={createPageUrl(item.page)} aria-label={item.label} aria-current={active ? 'page' : undefined} className={btn(active)}>
                    <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2 : 1.6} aria-hidden />
                    <span className="v7-tt-label" aria-hidden>{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button type="button" onClick={() => setMoreOpen(true)} aria-label="עוד" className={btn(moreActive)}>
                <MoreHorizontal className="h-[21px] w-[21px]" strokeWidth={1.6} aria-hidden />
                <span className="v7-tt-label" aria-hidden>עוד</span>
              </button>
            </li>
          </ul>
        </nav>
        <PlanCard compact />
        <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={onLogout} exclude={primary.map((i) => i.page)} />
      </aside>
    </div>
  );
}
