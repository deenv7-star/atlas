/**
 * "המשך הגדרה" on /today: shown to accounts that started the v2 setup journey, until every step is
 * done or skipped. Progress is real (units, calendar links, WhatsApp number), read from the account.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { loadSetupFacts } from '@/lib/onboarding/v2/actions';
import { setupStatus, setupProgress } from '@/lib/onboarding/v2/model';
import { Ring } from '@/components/onboarding/v2/ui';
import { readOrgSettings, writeOrgSettings } from '@/lib/onboarding/orgSettings';

export default function SetupResumeCard({ user }) {
  // started is known synchronously (settings on this device), so the card's space is held while the
  // account is read: no layout shift on /today.
  const s0 = readOrgSettings(user?.organization_id).setup;
  const started = !!s0?.started_at && !s0?.complete;
  const [prog, setProg] = useState(started ? 'loading' : null);
  useEffect(() => {
    let alive = true;
    if (!user?.id) return undefined;
    loadSetupFacts(user).then((f) => {
      if (!alive) return;
      if (!f.setup?.started_at) { setProg(null); return; }
      const p = setupProgress(setupStatus(f));
      if (p.complete && !f.setup.complete) writeOrgSettings(f.orgId, { setup: { ...f.setup, complete: true } }).catch(() => {});
      setProg(p.complete ? null : p);
    }).catch(() => { if (alive) setProg(null); });
    return () => { alive = false; };
  }, [user?.id]);
  if (!prog) return null;
  if (prog === 'loading') return <div className="mb-3 h-[88px] rounded-[24px] bg-white/60 md:mb-4 md:h-[96px]" aria-hidden />;
  return (
    <section aria-label="המשך הגדרה" className="mb-3 md:mb-4">
      <Link to={prog.next ? `/setup?step=${prog.next.id}` : '/setup'}
        className="group flex min-h-[84px] items-center gap-4 rounded-[24px] bg-white p-4 max-[359px]:gap-3 max-[359px]:p-3.5 shadow-[0_1px_2px_rgba(27,38,86,0.05),0_10px_28px_-16px_rgba(27,38,86,0.25)] ring-1 ring-[#E4E1FD] transition-shadow hover:shadow-[0_2px_4px_rgba(27,38,86,0.06),0_16px_36px_-16px_rgba(62,43,241,0.35)] md:p-5">
        <Ring value={prog.handled} total={prog.total} size={56} stroke={6}>
          <span className="text-[13px] font-extrabold tabular-nums text-navy-900" dir="ltr">{prog.handled}/{prog.total}</span>
        </Ring>
        <span className="min-w-0 flex-1">
          <span className="block whitespace-nowrap text-[17px] font-extrabold text-navy-900">המשך הגדרה</span>
          <span className="block truncate text-[15px] text-ink-600">{prog.next ? `הבא: ${prog.next.title}` : 'כמעט סיימנו'}</span>
        </span>
        <span className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand-600 px-5 text-[16px] font-bold text-white max-[359px]:w-12 max-[359px]:px-0">
          <span className="max-[359px]:sr-only">המשך</span><ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden />
        </span>
      </Link>
    </section>
  );
}
