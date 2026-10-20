import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { adminApi } from '../api';
import { useAdminAction } from '../hooks';
import { heMessage } from '../ui';

const Q = { staleTime: 30_000, retry: (n, e) => e?.name !== 'AdminAccessError' && n < 1 };
export const useCustomersV2 = () => useQuery({ queryKey: ['admin', 'customers', 'v2'], queryFn: adminApi.listCustomersV2, ...Q });
export const useCustomerV2 = (id) => useQuery({ queryKey: ['admin', 'customer', 'v2', id], queryFn: () => adminApi.getCustomerV2(id), enabled: Boolean(id), ...Q });

/** Saves a JSON file in the browser (UTF-8, pretty). */
export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
export const slug = (s) => String(s || 'customer').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'customer';

export function useV2Actions() {
  return {
    setTestFlag: useAdminAction(({ orgId, isTest, reason }) => adminApi.setTestFlag(orgId, isTest, reason), (v) => (v.isTest == null ? 'הסימון חזר לאוטומטי' : v.isTest ? 'סומן כחשבון בדיקה' : 'סומן כלקוח אמיתי')),
    passwordReset: useAdminAction(({ orgId, email }) => adminApi.customerOp('password_reset', orgId, email ? { email } : {}), null),
    resendConfirmation: useAdminAction(({ orgId, email }) => adminApi.customerOp('resend_confirmation', orgId, email ? { email } : {}), null),
    exportOne: useAdminAction(async ({ orgId, name }) => {
      const data = await adminApi.customerOp('export', orgId);
      downloadJson(`atlas-${slug(name)}-${new Date().toISOString().slice(0, 10)}.json`, data);
      return data;
    }, 'הקובץ ירד למחשב'),
  };
}
export const logEvent = (action, orgId, details) => adminApi.logEvent(action, orgId, details);

/** Runs one action over many customers, one after another, and reports how many worked. */
export function useBulk() {
  const qc = useQueryClient();
  const [state, setState] = useState(null); // { label, done, total, failed }
  async function run(label, ids, fn) {
    setState({ label, done: 0, total: ids.length, failed: 0 });
    let failed = 0;
    let lastError = null;
    for (let i = 0; i < ids.length; i++) {
      try { await fn(ids[i]); } catch (e) { failed += 1; lastError = e; }
      setState({ label, done: i + 1, total: ids.length, failed });
    }
    await qc.invalidateQueries({ queryKey: ['admin'] });
    const ok = ids.length - failed;
    if (failed) atlasToastApi.error(`${label}: ${ok} הצליחו, ${failed} לא. ${heMessage(lastError, '')}`.trim());
    else atlasToastApi.success(`${label}: ${ok} ${ok === 1 ? 'לקוח' : 'לקוחות'}`);
    setState(null);
    return { ok, failed };
  }
  return { run, state };
}
