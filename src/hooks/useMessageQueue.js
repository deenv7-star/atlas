/**
 * The real "to send" queue (014 message_queue), filled by the automation-runner edge function.
 * On mount the board asks the runner to refresh this org's queue (cheap, own org only), then reads it.
 */
import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { DB_FEATURES } from '@/config/dbFeatures';
import { callEdge } from '@/lib/real/edge';

export const QUEUE_KEY = ['message_queue'];
let lastRun = 0;
/** The runner refresh is throttled per device (not per page load), and waits until the board has its data. */
const LAST_RUN_KEY = 'atlas.queue.lastRun';
function readLastRun() {
  try { return Math.max(lastRun, Number(localStorage.getItem(LAST_RUN_KEY)) || 0); } catch { return lastRun; }
}
function writeLastRun(t) {
  lastRun = t;
  try { localStorage.setItem(LAST_RUN_KEY, String(t)); } catch { /* ignore */ }
}

export function useMessageQueue({ orgId } = {}) {
  const qc = useQueryClient();
  const enabled = DB_FEATURES.realCore && !!supabase;
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || started.current || Date.now() - readLastRun() < 4 * 60_000) return undefined;
    started.current = true;
    // Let the screen's own reads go first; the server also runs this every 15 minutes on its own.
    const t = setTimeout(() => {
      writeLastRun(Date.now());
      callEdge('automation-runner', {})
        .catch(() => null)
        .finally(() => qc.invalidateQueries({ queryKey: QUEUE_KEY }));
    }, 2500);
    return () => { clearTimeout(t); started.current = false; };
  }, [enabled, qc]);

  const q = useQuery({
    queryKey: [...QUEUE_KEY, orgId || 'me'],
    enabled,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 3 * 86_400_000).toISOString();
      const until = new Date(Date.now() + 36 * 3600_000).toISOString();
      const { data, error } = await supabase
        .from('message_queue')
        .select('id, booking_id, rule_id, template_key, recipient, due_at, original_due_at, deferred_reason, status, sent_at')
        .eq('status', 'pending').gte('due_at', since).lte('due_at', until)
        .order('due_at', { ascending: true }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const syncHealth = useQuery({
    queryKey: ['calendar-syncs', 'health', orgId || 'me'],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('calendar_syncs').select('id, property_id, provider, sync_status, conflicts, error_message, last_success_at');
      if (error) throw error;
      return data || [];
    },
  });

  const markSent = async (id) => {
    await supabase.from('message_queue').update({ status: 'sent', sent_at: new Date().toISOString(), sent_via: 'wa_link', updated_at: new Date().toISOString() }).eq('id', id);
    qc.invalidateQueries({ queryKey: QUEUE_KEY });
  };
  const skip = async (id) => {
    await supabase.from('message_queue').update({ status: 'skipped', error: 'owner_skipped', updated_at: new Date().toISOString() }).eq('id', id);
    qc.invalidateQueries({ queryKey: QUEUE_KEY });
  };

  const items = q.data || [];
  const now = Date.now();
  return {
    enabled,
    isLoading: q.isLoading,
    due: items.filter((x) => Date.parse(x.due_at) <= now),
    upcoming: items.filter((x) => Date.parse(x.due_at) > now),
    syncProblems: (syncHealth.data || []).filter((s) => s.sync_status === 'ERROR' || (Array.isArray(s.conflicts) && s.conflicts.length)),
    markSent,
    skip,
  };
}
