/**
 * Feeds the pure insights engine with the account's real rows and keeps the per-device
 * dismiss / snooze state. Both Today variants (feed / morning brief) read from here.
 */
import { useCallback, useMemo, useState } from 'react';
import { useLeads, useReviewRequests } from '@/data/entities';
import { readOrgSettings } from '@/lib/onboarding/orgSettings';
import { todayISO } from '@/lib/stay/format';
import {
  buildInsights, visibleInsights, readInsightState, writeInsightState, dismissInsight, snoozeInsight,
} from '@/lib/insights/engine';

export function useTodayInsights({ data, user, orgId, syncProblems, syncs }) {
  const today = todayISO();
  const leadsQ = useLeads();
  const reviewsQ = useReviewRequests({}, '-created_at', 500);
  const key = orgId || user?.organization_id || 'local';

  const setup = readOrgSettings(user?.organization_id).setup;
  const setupInProgress = !!setup?.started_at && !setup?.complete;

  const all = useMemo(() => {
    if (data.isLoading || data.isError) return [];
    return buildInsights({
      today,
      now: new Date(),
      bookings: data.bookings,
      properties: data.properties,
      propertyById: data.propertyById,
      paymentsByBooking: data.paymentsByBooking,
      sentByBooking: data.sentByBooking,
      cleaningTasks: data.cleaningTasks,
      expenses: data.expensesLoaded ? data.expenses : null,
      leads: leadsQ.data || [],
      syncProblems,
      syncs,
      reviewRequests: reviewsQ.isSuccess ? (reviewsQ.data || []) : undefined,
      setupInProgress,
    });
  }, [today, data.isLoading, data.isError, data.bookings, data.properties, data.propertyById, data.paymentsByBooking,
    data.sentByBooking, data.cleaningTasks, data.expensesLoaded, data.expenses, leadsQ.data, syncProblems, syncs,
    reviewsQ.isSuccess, reviewsQ.data, setupInProgress]);

  const [state, setState] = useState(() => readInsightState(key));
  const update = useCallback((fn) => setState((s) => { const next = fn(s); writeInsightState(key, next); return next; }), [key]);
  const dismiss = useCallback((id) => update((s) => dismissInsight(s, id, today)), [update, today]);
  const snooze = useCallback((id) => update((s) => snoozeInsight(s, id, today, 1)), [update, today]);
  const restore = useCallback((id) => update((s) => {
    const { [id]: _d, ...dismissed } = s.dismissed;
    const { [id]: _s, ...snoozed } = s.snoozed;
    return { dismissed, snoozed };
  }), [update]);

  const items = useMemo(() => visibleInsights(all, state, today), [all, state, today]);
  const ready = !data.isLoading && !leadsQ.isLoading && !reviewsQ.isLoading;
  return { items, all, hidden: all.length - items.length, ready, dismiss, snooze, restore };
}
