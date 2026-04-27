import { useMemo } from 'react';
import { atlasToastApi, type PersistentToastAction } from './atlasToastApi';

export type AtlasToast = {
  success: (message: string) => void;
  error: (message: string, detail?: string) => void;
  info: (message: string) => void;
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
