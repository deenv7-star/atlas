/**
 * Calendar v2 data: real bookings + units through the shared entity hooks (same cache keys the
 * quick-booking sheet and booking detail invalidate), plus Israeli holidays (server il_calendar when the
 * real core is live, the bundled Hebcal list otherwise).
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBookings, useProperties } from '@/data/entities';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { DB_FEATURES } from '@/config/dbFeatures';
import { toStays, occupancyByUnit, gapWindows, gapNightSet, buildHolidayMap } from '@/lib/calendar/calendarModel';

function useIlHolidays() {
  return useQuery({
    queryKey: ['il_calendar', 'calendar-v2'],
    enabled: isSupabaseConfigured && DB_FEATURES.realCore,
    staleTime: 6 * 3600_000,
    retry: false,
    queryFn: async () => {
      const y = new Date().getFullYear();
      const { data, error } = await supabase.from('il_calendar')
        .select('day, kind, title_he, title_en, yomtov')
        .eq('kind', 'holiday').gte('day', `${y - 1}-01-01`).lte('day', `${y + 1}-12-31`).order('day');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCalendarData({ propertyId = null } = {}) {
  const bookingsQ = useBookings({}, '-check_in_date', 2000);
  const propertiesQ = useProperties();
  const { isLoading: bLoading, isError: bError, refetch } = bookingsQ;
  const { isLoading: pLoading, isError: pError } = propertiesQ;
  const rawBookings = useMemo(() => bookingsQ.data || [], [bookingsQ.data]);
  const rawProperties = useMemo(() => propertiesQ.data || [], [propertiesQ.data]);
  const hol = useIlHolidays();

  const allUnits = useMemo(() => rawProperties
    .filter((p) => p && p.id && p.is_active !== false)
    .map((p, i) => ({ id: p.id, name: p.name || `יחידה ${i + 1}`, raw: p })), [rawProperties]);
  const units = useMemo(() => (propertyId ? allUnits.filter((u) => u.id === propertyId) : allUnits), [allUnits, propertyId]);
  const unitIds = useMemo(() => new Set(units.map((u) => u.id)), [units]);

  const allStays = useMemo(() => toStays(rawBookings), [rawBookings]);
  const stays = useMemo(() => allStays.filter((s) => unitIds.has(s.propertyId)), [allStays, unitIds]);
  const occ = useMemo(() => occupancyByUnit(stays), [stays]);
  const gaps = useMemo(() => gapWindows(stays), [stays]);
  const gapSet = useMemo(() => gapNightSet(gaps), [gaps]);
  const holidays = useMemo(() => buildHolidayMap(hol.data), [hol.data]);

  return {
    allUnits, units, stays, occ, gaps, gapSet, holidays,
    isLoading: bLoading || pLoading,
    isError: bError || pError,
    // Audit 04.11 #5: a failed refresh with the grid already loaded keeps the grid (retry in the shell strip).
    loadFailed: (bError && bookingsQ.data === undefined) || (pError && propertiesQ.data === undefined),
    queries: [bookingsQ, propertiesQ],
    refetch: () => Promise.all([refetch(), propertiesQ.refetch()]),
  };
}
