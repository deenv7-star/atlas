/**
 * UNIFIED DATA LAYER — Single source of truth for all entities
 * All modules MUST use these hooks/services. No direct supabase.from() calls.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { STALE_LIVE_MS, STALE_REFERENCE_MS } from '@/lib/queryStaleTimes';
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
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.bookings] }),
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => base44.entities.Booking.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.bookings] }),
  });
}

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
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.leads] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: [CACHE_KEYS.cleaningTasks] }),
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
