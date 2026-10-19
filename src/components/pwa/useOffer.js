/**
 * Which offer (if any) a surface shows right now:
 *   'install'  not installed yet, and this browser can install (Chrome/Edge prompt, or the iPhone guide)
 *   'push'     installed (or a desktop / Android browser that can do push as is) and notifications are off
 *   null       nothing to offer, setup still in progress, or the owner closed it before
 * Never during setup: the "המשך הגדרה" card owns /today until every setup step is done or skipped.
 */
import { useInstall, readDismissed, markDismissed } from '@/lib/pwa/install';
import { readOrgSettings } from '@/lib/onboarding/orgSettings';
import { usePushFlow } from './parts';
import { useCallback, useState } from 'react';

export function setupFinished(user) {
  if (!user) return false;
  if (user.onboarding_completed === false) return false;
  const s = readOrgSettings(user.organization_id ?? user.org_id).setup;
  return !(s?.started_at && !s?.complete);
}

export function useOffer(surface, user) {
  const install = useInstall(surface);
  const push = usePushFlow();
  const [pushDismissed, setPushDismissed] = useState(() => !!readDismissed()[`${surface}-push`]);
  const dismissPush = useCallback(() => { markDismissed(`${surface}-push`); setPushDismissed(true); }, [surface]);

  let kind = null;
  if (setupFinished(user) && install.state !== 'native') {
    const canInstall = install.state === 'prompt' || install.state === 'ios-guide';
    if (canInstall && !install.dismissed) kind = 'install';
    else if (!pushDismissed && (push.phase === 'off' || push.phase === 'busy' || (push.phase === 'on' && push.justEnabled) || (push.phase === 'blocked' && push.note))) kind = 'push';
  }
  return { kind, install, push, dismissPush };
}
