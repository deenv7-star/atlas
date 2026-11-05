/**
 * Connected services that need a secret (invoicing app, outgoing automations), read through the `integrations`
 * edge function (never the secret, only provider / status / hint). Demo account: kept in this browser only.
 */
import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/api/supabaseClient';
import { callEdge } from '@/lib/real/edge';
import { INTEGRATIONS_V1 } from './catalog';

const DEMO_KEY = 'atlas-demo-integrations';
const demoRead = () => { try { return JSON.parse(localStorage.getItem(DEMO_KEY) || '[]'); } catch { return []; } };
const demoWrite = (v) => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(v)); } catch { /* private mode */ } };
export const IS_DEMO = !isSupabaseConfigured;

export function useIntegrations() {
  const [items, setItems] = useState(IS_DEMO ? demoRead() : []);
  const load = useCallback(async () => {
    if (IS_DEMO) { setItems(demoRead()); return; }
    if (!INTEGRATIONS_V1) return;
    try { const r = await callEdge('integrations', { action: 'list' }); setItems(r?.items || []); } catch { /* keep last */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const connect = async (provider, payload) => {
    if (IS_DEMO) {
      await new Promise((r) => setTimeout(r, 900));
      const hint = provider === 'WEBHOOK' ? (() => { try { return new URL(payload.credentials.url).hostname; } catch { return ''; } })() : 'דוגמה';
      const next = [...demoRead().filter((x) => x.provider !== provider && !(['MORNING', 'ICOUNT'].includes(provider) && ['MORNING', 'ICOUNT'].includes(x.provider))),
        { provider, status: 'ACTIVE', hint, config: { doc_type: payload.doc_type, send_email: payload.send_email, events: payload.events }, connected_at: new Date().toISOString(), demo: true }];
      demoWrite(next); setItems(next);
      return { ok: true, demo: true, hint, signing_secret: provider === 'WEBHOOK' ? 'דוגמה-בלבד' : undefined };
    }
    const r = await callEdge('integrations', { action: 'connect', provider, ...payload });
    if (r?.ok) await load();
    return r || { ok: false };
  };
  const disconnect = async (provider) => {
    if (IS_DEMO) { const next = demoRead().filter((x) => x.provider !== provider); demoWrite(next); setItems(next); return { ok: true }; }
    const r = await callEdge('integrations', { action: 'disconnect', provider });
    await load();
    return r;
  };
  const issueReceipt = async (paymentId) => {
    if (IS_DEMO) { await new Promise((r) => setTimeout(r, 900)); return { ok: true, demo: true, doc_number: 'דוגמה' }; }
    return callEdge('integrations', { action: 'issue_receipt', payment_id: paymentId });
  };
  const testWebhook = async () => {
    if (IS_DEMO) { await new Promise((r) => setTimeout(r, 700)); return { ok: true, demo: true }; }
    return callEdge('integrations', { action: 'webhook_test' });
  };
  const has = (provider) => items.find((x) => x.provider === provider) || null;
  return { items, has, connect, disconnect, issueReceipt, testWebhook, reload: load };
}

/** Payments that already got a document (production only, after migration 038). */
export async function issuedPaymentIds() {
  if (IS_DEMO || !INTEGRATIONS_V1 || !supabase) return new Set();
  const { data } = await supabase.from('integration_documents').select('payment_id').limit(500);
  return new Set((data || []).map((r) => r.payment_id));
}
