/**
 * UNIFIED DATA LAYER — Single source of truth for all entities
 * All modules MUST use these hooks/services. No direct supabase.from() calls.
 */
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { STALE_LIVE_MS, STALE_REFERENCE_MS } from '@/lib/queryStaleTimes';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import {
  patchBookingInAllBookingQueries,
  removeBookingFromAllBookingQueries,
  restoreBookingQueriesSnapshot,
  snapshotBookingQueries,
  findBookingInSnapshot,
} from '@/lib/optimistic/bookingCache';
import {
  patchLeadDetail,
  patchLeadInListQueries,
  restoreLeadQueriesSnapshot,
  snapshotLeadQueries,
} from '@/lib/optimistic/leadCache';
import {
  patchCleaningTaskEverywhere,
  restoreCleaningTaskQueriesSnapshot,
  snapshotCleaningTaskQueries,
} from '@/lib/optimistic/cleaningTaskCache';
import { getErrorHttpStatus, getErrorMessage } from '@/lib/optimistic/httpError';
import { openOptimisticConflictModal } from '@/lib/optimistic/conflictModalState';
import { setOptimisticEntityPhase } from '@/lib/optimistic/entityVisualState';

function stripBookingForCreate(row) {
  if (!row || typeof row !== 'object') return {};
  const next = { ...row };
  delete next.id;
  delete next.created_at;
  delete next.updated_at;
  return next;
}
const CACHE_KEYS = {
  bookings: 'bookings',
  leads: 'leads',
  payments: 'payments',
  properties: 'properties',
  invoices: 'invoices',
  cleaningTasks: 'cleaning_tasks',
  messageLogs: 'message_logs',
  reviewRequests: 'review_requests',
  automationRules: 'automation_rules',
};

// ─── Bookings (used by Calendar, Bookings page, Dashboard, Invoices, Cleaning) ───
export function useBookings(filters = {}, sort = '-created_at', limit = 200) {
  return useQuery({
    queryKey: [CACHE_KEYS.bookings, filters, sort, limit],
    queryFn: () => base44.entities.Booking.filter(filters, sort, limit),
    staleTime: STALE_LIVE_MS,
  });
}

export function useBooking(id) {
  return useQuery({
    queryKey: [CACHE_KEYS.bookings, id],
    queryFn: () => base44.entities.Booking.get(id),
    enabled: !!id,
    staleTime: STALE_LIVE_MS,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.bookings] }),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: [CACHE_KEYS.bookings] });
      const previousBookings = snapshotBookingQueries(qc);
      patchBookingInAllBookingQueries(qc, id, data);
      setOptimisticEntityPhase(id, 'pending');
      const rollbackToastTimer = window.setTimeout(() => {
        toast({ title: 'הפעולה נכשלה — השינויים בוטלו', variant: 'destructive' });
      }, 200);
      return { previousBookings, rollbackToastTimer, bookingId: id };
    },
    onError: (err, variables, context) => {
      if (context?.rollbackToastTimer) window.clearTimeout(context.rollbackToastTimer);
      restoreBookingQueriesSnapshot(qc, context?.previousBookings);
      const id = variables?.id;
      if (id) setOptimisticEntityPhase(id, 'rollback');
      const status = getErrorHttpStatus(err);
      if (status === 409) {
        openOptimisticConflictModal({
          message: getErrorMessage(err) || 'לא ניתן לשמור — ייתכן שהתאריכים תפוסים או שהנתונים השתנו בשרת.',
        });
        return;
      }
      if (status === 422) {
        window.dispatchEvent(
          new CustomEvent('atlas:entity-validation-error', {
            detail: { entity: 'booking', id: variables?.id, message: getErrorMessage(err) },
          }),
        );
      }
      if (status !== 409) {
        toast({ title: 'הפעולה נכשלה — השינויים בוטלו', variant: 'destructive' });
      }
    },
    onSettled: (_d, err, _v, context) => {
      if (context?.rollbackToastTimer) window.clearTimeout(context.rollbackToastTimer);
      if (!err && context?.bookingId) setOptimisticEntityPhase(context.bookingId, 'idle');
      qc.invalidateQueries({ queryKey: [CACHE_KEYS.bookings] });
    },
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => base44.entities.Booking.delete(id),
    onMutate: async (variables) => {
      const { id, skipUndoToast } = variables;
      await qc.cancelQueries({ queryKey: [CACHE_KEYS.bookings] });
      const previousBookings = snapshotBookingQueries(qc);
      const removed = findBookingInSnapshot(previousBookings, id);
      removeBookingFromAllBookingQueries(qc, id);
      setOptimisticEntityPhase(id, 'pending');
      const rollbackToastTimer = window.setTimeout(() => {
        toast({ title: 'הפעולה נכשלה — השינויים בוטלו', variant: 'destructive' });
      }, 200);
      return { previousBookings, removed, rollbackToastTimer, bookingId: id, skipUndoToast };
    },
    onError: (err, variables, context) => {
      if (context?.rollbackToastTimer) window.clearTimeout(context.rollbackToastTimer);
      restoreBookingQueriesSnapshot(qc, context?.previousBookings);
      const id = variables?.id;
      if (id) setOptimisticEntityPhase(id, 'rollback');
      const status = getErrorHttpStatus(err);
      if (status === 409) {
        openOptimisticConflictModal({ message: getErrorMessage(err) || 'לא ניתן למחוק את ההזמנה.' });
        return;
      }
      if (status !== 409) {
        toast({ title: 'הפעולה נכשלה — השינויים בוטלו', variant: 'destructive' });
      }
    },
    onSuccess: (_void, variables, context) => {
      if (context?.rollbackToastTimer) window.clearTimeout(context.rollbackToastTimer);
      const id = variables?.id;
      if (id) setOptimisticEntityPhase(id, 'idle');
      const removed = context?.removed;
      if (context?.skipUndoToast || !removed) return;
      const t = toast({
        title: 'ההזמנה נמחקה',
        description: 'ניתן לשחזר מיד מהשרת',
        action: React.createElement(
          ToastAction,
          {
            altText: 'בטל מחיקה',
            onClick: async () => {
              t.dismiss();
              try {
                await base44.entities.Booking.create(stripBookingForCreate(removed));
                toast({ title: 'ההזמנה שוחזרה' });
              } catch (e) {
                toast({ title: 'שחזור נכשל', description: getErrorMessage(e), variant: 'destructive' });
              } finally {
                qc.invalidateQueries({ queryKey: [CACHE_KEYS.bookings] });
              }
            },
          },
          'בטל מחיקה',
        ),
      });
    },
    onSettled: (_d, err, variables, context) => {
      if (context?.rollbackToastTimer) window.clearTimeout(context.rollbackToastTimer);
      if (!err && variables?.id) setOptimisticEntityPhase(variables.id, 'idle');
      qc.invalidateQueries({ queryKey: [CACHE_KEYS.bookings] });
    },
  });
}

/** Alias for calendar occupancy / date-range edits — same optimistic booking cache as `useUpdateBooking`. */
export { useUpdateBooking as useUpdateRoomAvailability };

// ─── Properties ───
export function useProperties() {
  return useQuery({
    queryKey: [CACHE_KEYS.properties],
    queryFn: () => base44.entities.Property.list(),
    staleTime: STALE_REFERENCE_MS,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => base44.entities.Property.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.properties] }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => base44.entities.Property.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.properties] }),
  });
}

// ─── Leads (Guests) ───
export function useLeads(filters = {}, sort = '-created_at', limit = 200) {
  return useQuery({
    queryKey: [CACHE_KEYS.leads, filters, sort, limit],
    queryFn: () => base44.entities.Lead.filter(filters, sort, limit),
    staleTime: STALE_LIVE_MS,
  });
}

export function useLead(id) {
  return useQuery({
    queryKey: [CACHE_KEYS.leads, id],
    queryFn: () => base44.entities.Lead.get(id),
    enabled: !!id,
    staleTime: STALE_LIVE_MS,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.leads] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: [CACHE_KEYS.leads] });
      const previousLeads = snapshotLeadQueries(qc, id);
      patchLeadInListQueries(qc, id, data);
      patchLeadDetail(qc, id, data);
      setOptimisticEntityPhase(id, 'pending');
      const rollbackToastTimer = window.setTimeout(() => {
        toast({ title: 'הפעולה נכשלה — השינויים בוטלו', variant: 'destructive' });
      }, 200);
      return { previousLeads, rollbackToastTimer, leadId: id };
    },
    onError: (err, variables, context) => {
      if (context?.rollbackToastTimer) window.clearTimeout(context.rollbackToastTimer);
      restoreLeadQueriesSnapshot(qc, context?.previousLeads);
      const lid = variables?.id;
      if (lid) setOptimisticEntityPhase(lid, 'rollback');
      const status = getErrorHttpStatus(err);
      if (status === 409) {
        openOptimisticConflictModal({ message: getErrorMessage(err) || 'הנתונים התנגשו עם השרת.' });
        return;
      }
      if (status === 422) {
        window.dispatchEvent(
          new CustomEvent('atlas:entity-validation-error', {
            detail: { entity: 'lead', id: variables?.id, message: getErrorMessage(err) },
          }),
        );
      }
      if (status !== 409) {
        toast({ title: 'הפעולה נכשלה — השינויים בוטלו', variant: 'destructive' });
      }
    },
    onSettled: (_d, err, _v, context) => {
      if (context?.rollbackToastTimer) window.clearTimeout(context.rollbackToastTimer);
      if (!err && context?.leadId) setOptimisticEntityPhase(context.leadId, 'idle');
      qc.invalidateQueries({ queryKey: [CACHE_KEYS.leads] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.leads] }),
  });
}

// ─── Payments ───
export function usePayments(filters = {}, sort = '-created_at', limit = 100) {
  return useQuery({
    queryKey: [CACHE_KEYS.payments, filters, sort, limit],
    queryFn: () => base44.entities.Payment.filter(filters, sort, limit),
    staleTime: STALE_LIVE_MS,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => base44.entities.Payment.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CACHE_KEYS.payments] });
      qc.invalidateQueries({ queryKey: [CACHE_KEYS.bookings] });
    },
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => base44.entities.Payment.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.payments] }),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => base44.entities.Payment.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.payments] }),
  });
}

// ─── Invoices ───
export function useInvoices(filters = {}, sort = '-created_at', limit = 100) {
  return useQuery({
    queryKey: [CACHE_KEYS.invoices, filters, sort, limit],
    queryFn: async () => {
      try {
        return await base44.entities.Invoice.filter(filters, sort, limit);
      } catch {
        return [];
      }
    },
    staleTime: STALE_REFERENCE_MS,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.invoices] }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.invoices] }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.invoices] }),
  });
}

// ─── Cleaning Tasks ───
export function useCleaningTasks(filters = {}, sort = '-created_at', limit = 100) {
  return useQuery({
    queryKey: [CACHE_KEYS.cleaningTasks, filters, sort, limit],
    queryFn: async () => {
      try {
        return await base44.entities.CleaningTask.filter(filters, sort, limit);
      } catch {
        return [];
      }
    },
    staleTime: STALE_LIVE_MS,
    enabled: Boolean(filters?.org_id),
  });
}

export function useCreateCleaningTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => base44.entities.CleaningTask.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CACHE_KEYS.cleaningTasks] });
      qc.invalidateQueries({ queryKey: [CACHE_KEYS.bookings] });
    },
  });
}

export function useUpdateCleaningTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => base44.entities.CleaningTask.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ predicate: (q) => q.queryKey[0] === CACHE_KEYS.cleaningTasks || q.queryKey[0] === 'cleaningTasks' });
      const previous = snapshotCleaningTaskQueries(qc);
      patchCleaningTaskEverywhere(qc, id, data);
      setOptimisticEntityPhase(id, 'pending');
      const rollbackToastTimer = window.setTimeout(() => {
        toast({ title: 'הפעולה נכשלה — השינויים בוטלו', variant: 'destructive' });
      }, 200);
      return { previous, rollbackToastTimer, taskId: id };
    },
    onError: (err, variables, context) => {
      if (context?.rollbackToastTimer) window.clearTimeout(context.rollbackToastTimer);
      restoreCleaningTaskQueriesSnapshot(qc, context?.previous);
      const tid = variables?.id;
      if (tid) setOptimisticEntityPhase(tid, 'rollback');
      const status = getErrorHttpStatus(err);
      if (status === 409) {
        openOptimisticConflictModal({ message: getErrorMessage(err) || 'לא ניתן לעדכן את המשימה.' });
        return;
      }
      if (status !== 409) {
        toast({ title: 'הפעולה נכשלה — השינויים בוטלו', variant: 'destructive' });
      }
    },
    onSettled: (_d, err, _v, context) => {
      if (context?.rollbackToastTimer) window.clearTimeout(context.rollbackToastTimer);
      if (!err && context?.taskId) setOptimisticEntityPhase(context.taskId, 'idle');
      qc.invalidateQueries({ queryKey: [CACHE_KEYS.cleaningTasks] });
      qc.invalidateQueries({ queryKey: ['cleaningTasks'] });
    },
  });
}

// ─── Message Logs ───
export function useMessageLogs(filters = {}, sort = '-created_at', limit = 100) {
  return useQuery({
    queryKey: [CACHE_KEYS.messageLogs, filters, sort, limit],
    queryFn: async () => {
      try {
        return await base44.entities.MessageLog.filter(filters, sort, limit);
      } catch {
        return [];
      }
    },
    staleTime: STALE_REFERENCE_MS,
  });
}

export function useCreateMessageLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => base44.entities.MessageLog.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.messageLogs] }),
  });
}

// ─── Review Requests ───
export function useReviewRequests(filters = {}, sort = '-created_at', limit = 50) {
  return useQuery({
    queryKey: [CACHE_KEYS.reviewRequests, filters, sort, limit],
    queryFn: async () => {
      try {
        return await base44.entities.ReviewRequest.filter(filters, sort, limit);
      } catch {
        return [];
      }
    },
    staleTime: STALE_REFERENCE_MS,
  });
}

export function useUpdateReviewRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => base44.entities.ReviewRequest.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.reviewRequests] }),
  });
}

// ─── Automation Rules ───
export function useAutomationRules(filters = {}, sort = '-created_at', limit = 50) {
  return useQuery({
    queryKey: [CACHE_KEYS.automationRules, filters, sort, limit],
    queryFn: async () => {
      try {
        return await base44.entities.AutomationRule.filter(filters, sort, limit);
      } catch {
        return [];
      }
    },
    staleTime: STALE_REFERENCE_MS,
  });
}
