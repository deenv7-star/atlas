/**
 * Warm frame for login, register and onboarding (v4): a real zimmer photo beside the form on desktop,
 * a photo header with the form rising over it like a sheet on phones. Light only.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '@/components/app/shell/shared';
import { WELCOME_PHOTO } from '@/lib/stay/unitPhoto';
import { cn } from '@/lib/utils';

export default function AuthShell({ children, photo = WELCOME_PHOTO, caption = 'הזמנות, ניקיון ותשלומים. במקום אחד.', wide = false, onKeyDown }) {
  return (
    <div className="min-h-[100dvh] bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]" dir="rtl" onKeyDown={onKeyDown}>
      {/* form side (right in RTL) */}
      <div className="relative flex min-h-[100dvh] flex-col lg:min-h-0">
        {/* phone photo header */}
        <div className="relative h-[240px] shrink-0 overflow-hidden lg:hidden">
          <img src={photo} alt="" className="h-full w-full object-cover" />
          <Link to="/" aria-label="ATLAS, לדף הבית" className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] inline-flex h-11 items-center rounded-full bg-white/90 px-4 shadow-[0_2px_10px_rgba(27,38,86,0.12)] backdrop-blur">
            <Wordmark size={18} />
          </Link>
        </div>
        <div className="relative -mt-7 flex flex-1 flex-col rounded-t-[28px] bg-white px-5 pb-10 pt-8 lg:mt-0 lg:rounded-none lg:px-16 lg:pt-10">
          <div className="hidden lg:block">
            <Link to="/" aria-label="ATLAS, לדף הבית" className="inline-flex rounded-lg"><Wordmark size={24} /></Link>
          </div>
          <div className={cn('v4-rise mx-auto flex w-full flex-1 flex-col justify-start lg:justify-center lg:py-10', wide ? 'max-w-[520px]' : 'max-w-[420px]')}>
            {children}
          </div>
        </div>
      </div>

      {/* photo side (left in RTL), desktop only */}
      <div className="relative hidden p-4 lg:block">
        <div className="sticky top-4 h-[calc(100dvh-32px)] overflow-hidden rounded-[28px]">
          <img src={photo} alt="" className="h-full w-full object-cover" />
          <div className="absolute bottom-6 right-6 max-w-[360px] rounded-[20px] bg-white/90 px-5 py-4 shadow-[0_8px_30px_rgba(27,38,86,0.16)] backdrop-blur">
            <p className="text-[17px] font-bold leading-snug text-navy-900">{caption}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
