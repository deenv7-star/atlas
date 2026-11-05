import { useMemo } from 'react';
import { atlasToastApi, type PersistentToastAction, type ToastOpts } from './atlasToastApi';

export type AtlasToast = {
  success: (message: string, opts?: ToastOpts) => string;
  error: (message: string, detail?: string, opts?: ToastOpts) => string;
  info: (message: string, opts?: ToastOpts) => string;
  undo: (message: string, onUndo: () => void, onExpire?: () => void | Promise<void>) => void;
  persistent: (id: string, message: string, action?: PersistentToastAction) => void;
  dismissPersistent: (id: string) => void;
  realtime: (message: string) => void;
};

/**
 * ATLAS notification facade — do not import `sonner` elsewhere; use this hook or `atlasToastApi` from non-hook code.
 */
export function useToast(): AtlasToast {
  return useMemo(
    () => ({
      success: atlasToastApi.success,
      error: atlasToastApi.error,
      info: atlasToastApi.info,
      undo: atlasToastApi.undo,
      persistent: atlasToastApi.persistent,
      dismissPersistent: atlasToastApi.dismissPersistent,
      realtime: atlasToastApi.realtime,
    }),
    [],
  );
}
