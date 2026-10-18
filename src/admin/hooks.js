import { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { adminApi } from './api';
import { DEFAULT_PLANS, can } from './config';
import { computeOverview } from './metrics';
import { heMessage } from './ui';

export const AdminCtx = createContext({ me: null, role: null });
export function useAdmin() {
  const ctx = useContext(AdminCtx);
  return { ...ctx, can: (min) => can(ctx.role, min) };
}

const Q = { staleTime: 30_000, retry: (n, e) => e?.name !== 'AdminAccessError' && n < 1 };
export const useCustomers = () => useQuery({ queryKey: ['admin', 'customers'], queryFn: adminApi.listCustomers, ...Q });
export const useCustomer = (id) => useQuery({ queryKey: ['admin', 'customer', id], queryFn: () => adminApi.getCustomer(id), enabled: Boolean(id), ...Q });
export const useCharges = () => useQuery({ queryKey: ['admin', 'charges'], queryFn: adminApi.listCharges, ...Q });
export const usePlans = () => {
  const q = useQuery({ queryKey: ['admin', 'plans'], queryFn: adminApi.listPlans, ...Q });
  return { ...q, plans: q.data?.length ? q.data : DEFAULT_PLANS };
};
export const useTeam = () => useQuery({ queryKey: ['admin', 'team'], queryFn: adminApi.listTeam, ...Q });
export const useAudit = () => useQuery({ queryKey: ['admin', 'audit'], queryFn: adminApi.listAudit, ...Q });
export const useHealth = () => useQuery({ queryKey: ['admin', 'health'], queryFn: async () => {
  const t0 = performance.now();
  const h = await adminApi.health();
  return { ...h, latency_ms: Math.round(performance.now() - t0) };
}, ...Q, staleTime: 10_000 });

export function useOverview() {
  const c = useCustomers();
  const ch = useCharges();
  const { plans } = usePlans();
  const ready = c.data && ch.data;
  return {
    isLoading: c.isLoading || ch.isLoading,
    error: c.error || ch.error,
    data: ready ? computeOverview(c.data, ch.data, plans) : null,
    customers: c.data || [],
    charges: ch.data || [],
    plans,
  };
}

/** Mutation that refreshes every admin query and shows one calm toast. */
export function useAdminAction(fn, success) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      const msg = typeof success === 'function' ? success(vars) : success;
      if (msg) atlasToastApi.success(msg);
    },
    onError: (e) => atlasToastApi.error(heMessage(e, 'הפעולה לא הצליחה. נסו שוב בעוד רגע.')),
  });
}

export function useActions() {
  return {
    extendTrial: useAdminAction(({ orgId, days }) => adminApi.extendTrial(orgId, days), 'תקופת הניסיון הוארכה'),
    changePlan: useAdminAction(({ orgId, ...rest }) => adminApi.changePlan(orgId, rest), 'החבילה עודכנה'),
    setSuspended: useAdminAction(({ orgId, suspended, reason }) => adminApi.setSuspended(orgId, suspended, reason), (v) => (v.suspended ? 'החשבון הושהה' : 'החשבון הופעל מחדש')),
    addNote: useAdminAction(({ orgId, body }) => adminApi.addNote(orgId, body), 'ההערה נשמרה'),
    recordCharge: useAdminAction(({ orgId, ...rest }) => adminApi.recordCharge(orgId, rest), 'החיוב נרשם'),
    markPaid: useAdminAction(({ chargeId, method }) => adminApi.markChargePaid(chargeId, method), 'סומן כשולם'),
    updatePlan: useAdminAction(({ key, patch }) => adminApi.updatePlan(key, patch), 'המחיר עודכן'),
    setTeamMember: useAdminAction(({ email, role }) => adminApi.setTeamMember(email, role), 'הצוות עודכן'),
    removeTeamMember: useAdminAction(({ userId }) => adminApi.removeTeamMember(userId), 'הוסר מהצוות'),
  };
}
