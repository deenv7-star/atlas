/**
 * State for one conversation, shared by the full page and the side panel (one store per browser tab,
 * kept in sessionStorage so a reload or moving between screens keeps the thread).
 */
import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { buildFacts } from './facts.js';
import { streamAnswer, AssistantError } from './api.js';

/* ── data ─────────────────────────────────────────────────────────────── */
const STALE = 60 * 1000;
function useRows(key, orgId, fn) {
  return useQuery({ queryKey: ['assistant', key, orgId], queryFn: fn, enabled: !!orgId, staleTime: STALE });
}
export function useAssistantFacts(orgId) {
  const on = !!orgId;
  const bookings = useRows('bookings', orgId, () => base44.entities.Booking.filter({ org_id: orgId }, '-check_in_date', 500));
  const payments = useRows('payments', orgId, () => base44.entities.Payment.filter({ org_id: orgId }, '-created_date', 500));
  const leads = useRows('leads', orgId, () => base44.entities.Lead.filter({ org_id: orgId }, '-created_date', 200));
  const properties = useRows('properties', orgId, () => base44.entities.Property.list());
  const loading = on && [bookings, payments, leads, properties].some((x) => x.isLoading);
  const facts = useMemo(() => (loading || !on ? null : buildFacts({
    bookings: bookings.data || [], payments: payments.data || [], leads: leads.data || [], properties: properties.data || [],
  })), [loading, on, bookings.data, payments.data, leads.data, properties.data]);
  return { facts, loading };
}

/* ── store ────────────────────────────────────────────────────────────── */
const KEY = 'atlas-assistant-v1';
let state = { messages: [] };
try { const raw = sessionStorage.getItem(KEY); if (raw) state = { messages: JSON.parse(raw).messages || [] }; } catch { /* private mode */ }
state.messages = state.messages.map((m) => (m.status === 'streaming' ? { ...m, status: 'stopped' } : m));
const subs = new Set();
function set(fn) {
  state = { ...state, messages: fn(state.messages) };
  try { sessionStorage.setItem(KEY, JSON.stringify({ messages: state.messages.slice(-30) })); } catch { /* full */ }
  subs.forEach((s) => s());
}
const subscribe = (cb) => { subs.add(cb); return () => subs.delete(cb); };
const snap = () => state;
const uid = () => Math.random().toString(36).slice(2, 10);
let controller = null;

/**
 * useAssistant({ facts, page }) → { messages, busy, send, stop, retry, clear }
 * message: { id, role: 'user'|'assistant', content, status: 'pending'|'streaming'|'done'|'stopped'|'error', error? }
 */
export function useAssistant({ facts, page }) {
  const { messages } = useSyncExternalStore(subscribe, snap, snap);
  const ctx = useRef({ facts, page });
  ctx.current = { facts, page };
  const busy = messages.some((m) => m.status === 'pending' || m.status === 'streaming');

  const run = useCallback(async (history, answerId) => {
    controller?.abort();
    const ac = new AbortController();
    controller = ac;
    const patch = (p) => set((list) => list.map((m) => (m.id === answerId ? { ...m, ...p } : m)));
    try {
      await streamAnswer({
        messages: history.map(({ role, content }) => ({ role, content })),
        facts: ctx.current.facts,
        page: ctx.current.page,
        signal: ac.signal,
        onDelta: (d) => set((list) => list.map((m) => (m.id === answerId ? { ...m, status: 'streaming', content: m.content + d } : m))),
      });
      patch({ status: 'done' });
    } catch (e) {
      if (e?.name === 'AbortError') patch({ status: 'stopped' });
      else patch({ status: 'error', error: e instanceof AssistantError ? e.message : new AssistantError('upstream').message });
    } finally {
      if (controller === ac) controller = null;
    }
  }, []);

  const send = useCallback((text) => {
    const q = String(text || '').trim();
    if (!q || snap().messages.some((m) => m.status === 'pending' || m.status === 'streaming')) return false;
    const user = { id: uid(), role: 'user', content: q.slice(0, 2000), status: 'done' };
    const answer = { id: uid(), role: 'assistant', content: '', status: 'pending' };
    const history = [...snap().messages.filter((m) => m.status === 'done' && m.content), user];
    set((list) => [...list, user, answer]);
    run(history, answer.id);
    return true;
  }, [run]);

  const stop = useCallback(() => { controller?.abort(); }, []);

  /** Ask the same question again in place of a failed / stopped / unwanted answer. */
  const retry = useCallback((answerId) => {
    const list = snap().messages;
    const i = list.findIndex((m) => m.id === answerId);
    if (i < 1 || list[i - 1].role !== 'user') return;
    const history = list.slice(0, i).filter((m) => m.status === 'done' && m.content);
    set((l) => l.map((m) => (m.id === answerId ? { ...m, content: '', status: 'pending', error: undefined } : m)));
    run(history, answerId);
  }, [run]);

  const clear = useCallback(() => { controller?.abort(); set(() => []); }, []);
  return { messages, busy, send, stop, retry, clear };
}
