/**
 * Which offer (if any) a surface shows right now:
 *   'install'  not installed yet, and this browser can install (Chrome/Edge prompt, or the iPhone guide)
 *   'push'     installed (or a desktop / Android browser that can do push as is) and notifications are off
 *   null       nothing to offer, setup still in progress, or the owner closed it before
 * Never during setup: the "המשך הגדרה" card owns /today until every setup step is done or skipped.
 */
import { useCallback, useEffect, useState } from 'react';
import { useInstall, readDismissed, markDismissed } from '@/lib/pwa/install';
import { readOrgSettings } from '@/lib/onboarding/orgSettings';
import { loadSetupFacts } from '@/lib/onboarding/v2/actions';
import { setupStatus, setupProgress } from '@/lib/onboarding/v2/model';
import { usePushFlow } from './parts';

/**
 * Setup is finished when the guided journey was never started (older accounts) or when every real step is done
 * or skipped. Same rule as the "המשך הגדרה" card (SetupResumeCard), read from the account, so the two never show
 * together. While the account is read for a started journey the answer is "not yet".
 */
export function useSetupFinished(user) {
  const orgId = user?.organization_id ?? user?.org_id;
  const s0 = orgId ? readOrgSettings(orgId).setup : null;
  const started = !!s0?.started_at;
  const [done, setDone] = useState(() => !!user && user.onboarding_completed !== false && !started);
  useEffect(() => {
    let alive = true;
    if (!user?.id || user.onboarding_completed === false) { setDone(false); return undefined; }
    if (!started) { setDone(true); return undefined; }
    loadSetupFacts(user)
      .then((f) => { if (alive) setDone(!f.setup?.started_at || setupProgress(setupStatus(f)).complete); })
      .catch(() => { if (alive) setDone(false); });
    return () => { alive = false; };
  }, [user?.id, started]); // eslint-disable-line react-hooks/exhaustive-deps
  return done;
}

export function useOffer(surface, user) {
  const install = useInstall(surface);
  const push = usePushFlow();
  const [pushDismissed, setPushDismissed] = useState(() => !!readDismissed()[`${surface}-push`]);
  const dismissPush = useCallback(() => { markDismissed(`${surface}-push`); setPushDismissed(true); }, [surface]);

  const finished = useSetupFinished(user);
  let kind = null;
  if (finished && install.state !== 'native') {
    const canInstall = install.state === 'prompt' || install.state === 'ios-guide';
    if (canInstall && !install.dismissed) kind = 'install';
    else if (!pushDismissed && (push.phase === 'off' || push.phase === 'busy' || (push.phase === 'on' && push.justEnabled) || (push.phase === 'blocked' && push.note))) kind = 'push';
  }
  return { kind, install, push, dismissPush };
}
