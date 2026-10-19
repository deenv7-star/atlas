/**
 * Home-screen shortcuts (manifest.json → shortcuts) open the app with ?action=…:
 *   /today?action=new-booking  -> the quick booking sheet
 * The parameter is removed from the address right away, so a reload or back does not open it again.
 * Also keeps this device's push subscription saved on the account (no prompt; only if already allowed).
 */
import { useEffect } from 'react';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { syncPushSubscription } from '@/lib/pwa/push';

export default function LaunchActions() {
  const quick = useQuickBooking();
  useEffect(() => {
    syncPushSubscription();
    let url;
    try { url = new URL(window.location.href); } catch { return; }
    const action = url.searchParams.get('action');
    if (!action && !url.searchParams.has('source')) return;
    url.searchParams.delete('action');
    url.searchParams.delete('source');
    window.history.replaceState(window.history.state, '', url.pathname + (url.search || '') + url.hash);
    if (action === 'new-booking') quick.open();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
