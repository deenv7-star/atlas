import { useSyncExternalStore } from 'react';

type ConflictState = { open: boolean; title: string; message: string };

let state: ConflictState = { open: false, title: '', message: '' };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function openOptimisticConflictModal(payload: { title?: string; message: string }) {
  state = {
    open: true,
    title: payload.title ?? 'הנתונים התנגשו עם השרת',
    message: payload.message,
  };
  emit();
}

export function closeOptimisticConflictModal() {
  state = { open: false, title: '', message: '' };
  emit();
}

export function subscribeOptimisticConflictModal(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getOptimisticConflictModalState(): ConflictState {
  return state;
}

export function useOptimisticConflictModalState(): ConflictState {
  return useSyncExternalStore(subscribeOptimisticConflictModal, getOptimisticConflictModalState, getOptimisticConflictModalState);
}
