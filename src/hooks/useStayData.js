/**
 * Shared data for the operational feature screens (Today, balances, monthly report).
 * Reads through the unified entity client; RLS / local storage scope it to the org.
 */
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { STALE_LIVE_MS, STALE_REFERENCE_MS } from '@/lib/queryStaleTimes';
import { groupPaymentsByBooking } from '@/lib/stay/bookings';
import { DB_FEATURES, isMissingSchemaError } from '@/config/dbFeatures';

export const STAY_KEYS = {
  bookings: ['stay', 'bookings'],
  properties: ['stay', 'properties'],
  payments: ['stay', 'payments'],
  messageLogs: ['stay', 'message_logs'],
  cleaning: ['stay', 'cleaning_tasks'],
  expenses: ['stay', 'expenses'],
};

const safe = (p) => p.catch((e) => {
  // Missing optional tables should never break a screen.
  if (isMissingSchemaError(e)) return [];
  throw e;
});

export function useStayData({ withExpenses = false, withCleaning = true } = {}) {
  const bookingsQ = useQuery({
    queryKey: STAY_KEYS.bookings,
    queryFn: () => base44.entities.Booking.filter({}, '-check_in_date', 2000),
    staleTime: STALE_LIVE_MS,
  });
  const propertiesQ = useQuery({
    queryKey: STAY_KEYS.properties,
    queryFn: () => base44.entities.Property.list({}, { limit: 500 }),
    staleTime: STALE_REFERENCE_MS,
  });
  const paymentsQ = useQuery({
    queryKey: STAY_KEYS.payments,
    queryFn: () => base44.entities.Payment.filter({}, '-created_date', 3000),
    staleTime: STALE_LIVE_MS,
  });
  const logsQ = useQuery({
    queryKey: STAY_KEYS.messageLogs,
    queryFn: () => safe(base44.entities.MessageLog.filter({}, '-created_date', 1000)),
    staleTime: STALE_LIVE_MS,
  });
  const cleaningQ = useQuery({
    queryKey: STAY_KEYS.cleaning,
    queryFn: () => safe(base44.entities.CleaningTask.filter({}, '-scheduled_date', 500)),
    staleTime: STALE_LIVE_MS,
    enabled: withCleaning,
  });
  const expensesQ = useQuery({
    queryKey: STAY_KEYS.expenses,
    queryFn: () => safe(base44.entities.Expense.filter({}, '-expense_date', 3000)),
    staleTime: STALE_REFERENCE_MS,
    enabled: withExpenses && DB_FEATURES.expenses,
  });

  const bookings = bookingsQ.data || [];
  const properties = propertiesQ.data || [];
  const payments = paymentsQ.data || [];
  const messageLogs = logsQ.data || [];

  const propertyById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);
  const paymentsByBooking = useMemo(() => groupPaymentsByBooking(payments), [payments]);
  const sentByBooking = useMemo(() => {
    const m = new Map();
    for (const l of messageLogs) {
      if (!l.booking_id) continue;
      if (!m.has(l.booking_id)) m.set(l.booking_id, new Set());
      if (l.subject) m.get(l.booking_id).add(l.subject);
    }
    return m;
  }, [messageLogs]);

  return {
    bookings,
    properties,
    payments,
    messageLogs,
    cleaningTasks: cleaningQ.data || [],
    expenses: expensesQ.data || [],
    /** true once the expenses list is really loaded (feature on + query succeeded). */
    expensesLoaded: expensesQ.isSuccess,
    propertyById,
    paymentsByBooking,
    sentByBooking,
    isLoading: bookingsQ.isLoading || propertiesQ.isLoading || paymentsQ.isLoading,
    isError: bookingsQ.isError || propertiesQ.isError || paymentsQ.isError,
    error: bookingsQ.error || propertiesQ.error || paymentsQ.error,
    refetch: () => Promise.all([bookingsQ.refetch(), propertiesQ.refetch(), paymentsQ.refetch(), logsQ.refetch(), cleaningQ.refetch()]),
  };
}

export function useStayMutations() {
  const qc = useQueryClient();
  const invalidate = (key) => qc.invalidateQueries({ queryKey: key });
  const invalidateGlobal = (k) => qc.invalidateQueries({ queryKey: [k] });

  const updateBooking = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => { invalidate(STAY_KEYS.bookings); invalidateGlobal('bookings'); },
  });
  const createPayment = useMutation({
    mutationFn: (data) => base44.entities.Payment.create(data),
    onSuccess: () => { invalidate(STAY_KEYS.payments); invalidateGlobal('payments'); },
  });
  const updatePayment = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Payment.update(id, data),
    onSuccess: () => { invalidate(STAY_KEYS.payments); invalidateGlobal('payments'); },
  });
  const createCleaning = useMutation({
    mutationFn: (data) => base44.entities.CleaningTask.create(data),
    onSuccess: () => { invalidate(STAY_KEYS.cleaning); invalidateGlobal('cleaning_tasks'); },
  });
  const updateCleaning = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CleaningTask.update(id, data),
    onSuccess: () => { invalidate(STAY_KEYS.cleaning); invalidateGlobal('cleaning_tasks'); },
  });
  const updateProperty = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Property.update(id, data),
    onSuccess: () => { invalidate(STAY_KEYS.properties); invalidateGlobal('properties'); },
  });
  return { updateBooking, createPayment, updatePayment, createCleaning, updateCleaning, updateProperty };
}
