import React, { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WifiOff, RotateCw } from 'lucide-react';

const SLOW_MS = 12000;

/**
 * Shell-wide guard so a skeleton never spins forever.
 * Shows a calm retry strip when any query timed out / failed on the network,
 * or has been fetching for longer than SLOW_MS.
 */
export default function ConnectionNotice() {
  const qc = useQueryClient();
  const [state, setState] = useState(null); // null | 'slow' | 'failed'

  const evaluate = useCallback(() => {
    const now = Date.now();
    const qs = qc.getQueryCache().getAll();
    const failed = qs.some((q) => q.state.status === 'error' && isNetworkError(q.state.error));
    const slow = qs.some((q) => q.state.fetchStatus === 'fetching' && q.state.dataUpdatedAt === 0 && now - (q.state.fetchStartedAt ?? q._atlasStart ?? now) > SLOW_MS);
    setState(failed ? 'failed' : slow ? 'slow' : null);
  }, [qc]);

  useEffect(() => {
    const unsub = qc.getQueryCache().subscribe((ev) => {
      const q = ev?.query;
      if (q && q.state.fetchStatus === 'fetching' && !q._atlasStart) q._atlasStart = Date.now();
      if (q && q.state.fetchStatus !== 'fetching') q._atlasStart = undefined;
      evaluate();
    });
    const t = window.setInterval(evaluate, 2000);
    return () => { unsub(); window.clearInterval(t); };
  }, [qc, evaluate]);

  if (!state) return null;
  const retry = () => {
    qc.refetchQueries({ predicate: (q) => q.state.status === 'error' || q.state.fetchStatus === 'fetching' });
    setState(null);
  };
  return (
    <div role="status" aria-live="polite" className="mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-[1200px] items-center gap-3 rounded-[18px] border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(20,23,26,.06),0_4px_16px_rgba(20,23,26,.06)] md:w-[calc(100%-4rem)]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#FFF4E0] text-[#B26A00]"><WifiOff className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-navy-900">{state === 'failed' ? 'לא הצלחנו לטעון את הנתונים' : 'הטעינה לוקחת יותר מהרגיל'}</p>
        <p className="text-[13px] text-ink-600">ייתכן שהחיבור איטי. הנתונים שכבר נטענו נשמרים.</p>
      </div>
      <button type="button" onClick={retry} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] border border-line bg-white px-4 text-[15px] font-medium text-navy-900 transition-[background-color,transform] duration-150 hover:bg-canvas active:scale-[.98]">
        <RotateCw className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        לנסות שוב
      </button>
    </div>
  );
}

function isNetworkError(err) {
  if (!err) return false;
  if (err.isTimeout || err.name === 'TimeoutError' || err.name === 'AbortError') return true;
  const m = String(err.message || err);
  return /Failed to fetch|NetworkError|Load failed|timeout|ERR_/i.test(m);
}
