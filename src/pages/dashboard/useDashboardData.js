/**
 * Dashboard data: the same queries the dashboard always ran (keys, filters, limits),
 * plus a read-only "today" model both layout directions render from.
 * Select lists gained a few display-only columns (channel, price, due date).
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCleaningTasks } from '@/data/entities';
import { STALE_LIVE_MS, STALE_REFERENCE_MS } from '@/lib/queryStaleTimes';
import {
  addDays, differenceInCalendarDays, endOfMonth, format, isSameDay, parseISO, startOfDay,
  startOfMonth, subMonths, max as maxDate, min as minDate,
} from 'date-fns';
import { he } from 'date-fns/locale';

const DASH_BOOKING_SELECT =
  'id,guest_name,nights,property_name,check_in_date,check_out_date,status,property_id,created_at,created_date,booking_source,total_price';
const DASH_LEAD_SELECT =
  'id,full_name,check_in_date,nights,status,created_at,created_date,source';
const DASH_PAYMENT_SELECT =
  'id,amount,status,paid_date,created_at,created_date,currency,due_date,booking_id,description';
const DASH_REVIEW_SELECT =
  'id,rating,status,property_id,created_at,created_date,guest_name';

const ACTIVE = ['APPROVED', 'CONFIRMED', 'CHECKED_IN', 'PENDING'];
const safe = (v) => {
  if (!v) return null;
  try {
    const d = parseISO(String(v));
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};
export function checkOutOf(b) {
  const co = safe(b.check_out_date);
  if (co) return co;
  const ci = safe(b.check_in_date);
  return ci ? addDays(ci, b.nights || 1) : null;
}

export function useDashboardData({ user, selectedPropertyId }) {
  const orgId = user?.organization_id ?? null;
  const filters = useMemo(() => (selectedPropertyId ? { property_id: selectedPropertyId } : {}), [selectedPropertyId]);

  const bookingsQ = useQuery({
    queryKey: ['dashboard-bookings', selectedPropertyId],
    queryFn: () => base44.entities.Booking.filter(filters, '-created_at', 100, { select: DASH_BOOKING_SELECT }),
    staleTime: STALE_LIVE_MS,
    retry: 1,
  });
  const leadsQ = useQuery({
    queryKey: ['dashboard-leads', selectedPropertyId],
    queryFn: () => base44.entities.Lead.filter(filters, '-created_at', 100, { select: DASH_LEAD_SELECT }),
    staleTime: STALE_LIVE_MS,
    retry: 1,
  });
  const paymentsQ = useQuery({
    queryKey: ['dashboard-payments', orgId],
    queryFn: () =>
      orgId
        ? base44.entities.Payment.filter({ org_id: orgId }, '-created_at', 200, { select: DASH_PAYMENT_SELECT })
        : Promise.resolve([]),
    enabled: !!orgId,
    staleTime: STALE_LIVE_MS,
    retry: 1,
  });
  const reviewsQ = useQuery({
    queryKey: ['dashboard-reviews', selectedPropertyId],
    queryFn: () => base44.entities.ReviewRequest.filter(filters, '-created_at', 50, { select: DASH_REVIEW_SELECT }),
    staleTime: STALE_REFERENCE_MS,
    retry: 1,
  });
  const propertiesQ = useQuery({
    queryKey: ['dashboard-properties'],
    queryFn: () => base44.entities.Property.list({}, { select: 'id,name', limit: 500 }),
    staleTime: STALE_REFERENCE_MS,
    retry: 1,
  });
  const cleaningQ = useCleaningTasks(orgId ? { org_id: orgId } : {}, '-created_at', 100);

  const bookings = bookingsQ.data || [];
  const leads = leadsQ.data || [];
  const payments = paymentsQ.data || [];
  const reviews = reviewsQ.data || [];
  const allProperties = propertiesQ.data || [];
  const properties = selectedPropertyId ? allProperties.filter((p) => p.id === selectedPropertyId) : allProperties;
  const cleaning = cleaningQ.data || [];

  const model = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const live = bookings.filter((b) => b.status !== 'CANCELLED');
    const propName = (id, fallback) => allProperties.find((p) => p.id === id)?.name || fallback || '';

    const checkIns = live.filter((b) => { const d = safe(b.check_in_date); return d && isSameDay(d, today); });
    const checkOuts = live.filter((b) => { const d = checkOutOf(b); return d && isSameDay(d, today); });
    const inHouse = live.filter((b) => {
      const ci = safe(b.check_in_date); const co = checkOutOf(b);
      return ci && co && ci <= today && co > today;
    });
    const upcoming = live
      .filter((b) => { const d = safe(b.check_in_date); return d && d > today && ACTIVE.includes(b.status); })
      .sort((a, b) => safe(a.check_in_date) - safe(b.check_in_date));
    const pendingBookings = live.filter((b) => b.status === 'PENDING');

    const cleaningsToday = cleaning.filter((t) => {
      const d = safe(t.scheduled_date || t.scheduled_for);
      return d && isSameDay(d, today) && t.status !== 'COMPLETED' && (!selectedPropertyId || t.property_id === selectedPropertyId);
    });

    const bookingIds = new Set(bookings.map((b) => b.id));
    const scopedPayments = selectedPropertyId ? payments.filter((p) => !p.booking_id || bookingIds.has(p.booking_id)) : payments;
    const openPayments = scopedPayments.filter((p) => ['PENDING', 'OVERDUE'].includes(p.status));
    const dueSoon = openPayments
      .filter((p) => { const d = safe(p.due_date); return d && differenceInCalendarDays(d, today) <= 7; })
      .sort((a, b) => safe(a.due_date) - safe(b.due_date));
    const outstanding = openPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

    const newLeads = leads.filter((l) => l.status === 'NEW');
    const openLeads = leads.filter((l) => ['NEW', 'CONTACTED', 'OFFER_SENT'].includes(l.status));

    const mStart = startOfMonth(now);
    const mEnd = addDays(endOfMonth(now), 1);
    const daysInMonth = differenceInCalendarDays(mEnd, mStart);
    const bookedNights = live
      .filter((b) => ['APPROVED', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(b.status))
      .reduce((sum, b) => {
        const ci = safe(b.check_in_date); const co = checkOutOf(b);
        if (!ci || !co) return sum;
        const s = maxDate([ci, mStart]); const e = minDate([co, mEnd]);
        return sum + Math.max(0, differenceInCalendarDays(e, s));
      }, 0);
    const occupancy = properties.length ? Math.min(100, Math.round((bookedNights / (properties.length * daysInMonth)) * 100)) : 0;

    const paidIn = (from, to) => scopedPayments
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => { const d = safe(p.paid_date || p.created_date || p.created_at); return d && d >= from && d < to ? s + (parseFloat(p.amount) || 0) : s; }, 0);
    const revenueMonth = paidIn(mStart, mEnd);
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      const from = startOfMonth(d); const to = addDays(endOfMonth(d), 1);
      return { key: format(d, 'yyyy-MM'), label: format(d, 'LLL', { locale: he }), total: paidIn(from, to), current: i === 5 };
    });
    const withRating = reviews.filter((r) => r.rating);
    const avgRating = withRating.length ? withRating.reduce((s, r) => s + r.rating, 0) / withRating.length : null;

    // Per-unit "right now" picture with a 14-day strip
    const units = properties.map((p) => {
      const pb = live.filter((b) => b.property_id === p.id);
      const current = pb.find((b) => inHouse.includes(b));
      const arriving = pb.find((b) => checkIns.includes(b));
      const leaving = pb.find((b) => checkOuts.includes(b));
      const next = pb.filter((b) => upcoming.includes(b))[0] || null;
      const strip = Array.from({ length: 14 }, (_, i) => {
        const day = addDays(today, i);
        const b = pb.find((x) => { const ci = safe(x.check_in_date); const co = checkOutOf(x); return ci && co && ci <= day && co > day; });
        return { day, booking: b || null };
      });
      const cleaningTask = cleaningsToday.find((t) => t.property_id === p.id) || null;
      let state = 'free';
      if (arriving && leaving) state = 'turnover';
      else if (arriving) state = 'arriving';
      else if (leaving) state = 'leaving';
      else if (current) state = 'occupied';
      return { property: p, current, arriving, leaving, next, strip, cleaning: cleaningTask, state };
    });

    return {
      now, today, checkIns, checkOuts, inHouse, upcoming, pendingBookings, cleaningsToday, dueSoon, outstanding,
      newLeads, openLeads, occupancy, revenueMonth, months, avgRating, reviewsCount: reviews.length, units, propName,
      leads, bookings: live,
    };
  }, [bookings, leads, payments, reviews, allProperties, properties, cleaning, selectedPropertyId]);

  const isLoading = bookingsQ.isLoading || propertiesQ.isLoading;
  const isError = bookingsQ.isError || leadsQ.isError || paymentsQ.isError || reviewsQ.isError || propertiesQ.isError;
  const refetchAll = () => {
    bookingsQ.refetch(); leadsQ.refetch(); paymentsQ.refetch(); reviewsQ.refetch(); propertiesQ.refetch(); cleaningQ.refetch?.();
  };
  return {
    ...model,
    properties,
    allProperties,
    isLoading,
    loading: { bookings: bookingsQ.isLoading, leads: leadsQ.isLoading, payments: paymentsQ.isLoading, properties: propertiesQ.isLoading },
    isError,
    refetchAll,
    user,
  };
}
