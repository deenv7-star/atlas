/** "כספים" is one place in the nav; its screens are these quiet tabs. */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { FINANCE_TABS } from '@/config/navigation';

export default function FinanceTabs({ className }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="כספים" className={cn('-mx-5 mb-8 overflow-x-auto px-5 md:mx-0 md:px-0 [scrollbar-width:none]', className)}>
      <ul className="flex gap-1 border-b border-line">
        {FINANCE_TABS.map((t) => {
          const url = createPageUrl(t.page);
          const active = pathname === url || pathname.startsWith(url + '/');
          return (
            <li key={t.page}>
              <Link
                to={url}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  '-mb-px inline-flex h-12 items-center whitespace-nowrap border-b-2 px-3.5 text-[16px] transition-colors duration-150',
                  active ? 'border-brand-600 font-bold text-navy-900' : 'border-transparent font-medium text-ink-600 hover:text-navy-900',
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
