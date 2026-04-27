import { useSyncExternalStore } from 'react';

export type OptimisticVisualPhase = 'idle' | 'pending' | 'rollback';

const phaseByEntityId = new Map<string, OptimisticVisualPhase>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Marks UI phase for a row/cell (booking id, lead id, task id, etc.). */
export function setOptimisticEntityPhase(entityId: string, phase: OptimisticVisualPhase) {
  if (phase === 'idle') {
    phaseByEntityId.delete(entityId);
  } else {
    phaseByEntityId.set(entityId, phase);
  }
  emit();
  if (phase === 'rollback') {
    window.setTimeout(() => {
      phaseByEntityId.delete(entityId);
      emit();
    }, 300);
  }
}

export function subscribeOptimisticEntityPhase(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function getOptimisticEntityPhase(entityId: string): OptimisticVisualPhase {
  return phaseByEntityId.get(entityId) ?? 'idle';
}

export function optimisticEntityClassName(entityId: string | undefined): string {
  if (!entityId) return '';
  const p = getOptimisticEntityPhase(entityId);
  if (p === 'pending') {
    return 'opacity-75 ring-[0.5px] ring-amber-400/90 rounded-xl transition-[opacity,box-shadow] duration-150 motion-safe:animate-pulse';
  }
  if (p === 'rollback') {
    return 'ring-2 ring-red-500/80 bg-red-50/40 rounded-xl transition-colors duration-150';
  }
  return '';
}

export function useOptimisticEntityPhase(entityId: string | undefined): OptimisticVisualPhase {
  return useSyncExternalStore(
    subscribeOptimisticEntityPhase,
    () => (entityId ? getOptimisticEntityPhase(entityId) : 'idle'),
    () => 'idle',
  );
}
