/** "כספים" is one place in the nav; its screens are these pill tabs (v7: one white track, active pill white + shadow). */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { FINANCE_TABS } from '@/config/navigation';

export default function FinanceTabs({ className }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="כספים" className={cn('v7-strip -mx-5 mb-6 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0', className)}>
      <ul className="inline-flex gap-1 rounded-full bg-white p-1 shadow-[0_1px_2px_rgba(27,38,86,0.05)] ring-1 ring-inset ring-[#E8EAF2]">
        {FINANCE_TABS.map((t) => {
          const url = createPageUrl(t.page);
          const active = pathname === url || pathname.startsWith(url + '/');
          return (
            <li key={t.page}>
              <Link
                to={url}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'press inline-flex h-11 items-center whitespace-nowrap rounded-full px-4 text-[14px] transition-colors duration-150',
                  active ? 'bg-brand-600 font-bold text-white shadow-[0_6px_14px_-6px_rgba(62,43,241,0.6)]' : 'font-semibold text-ink-600 hover:bg-[#F2F3F8] hover:text-navy-900',
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
