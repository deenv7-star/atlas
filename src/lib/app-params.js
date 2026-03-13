/**
 * app-params.js — Standalone version
 *
 * The original file read Base44-specific URL / localStorage parameters.
 * In standalone mode the application no longer needs a remote app-id or
 * access-token, so this module exports a minimal, no-op compatible object.
 */

export const appParams = {
  appId: import.meta.env.VITE_APP_ID || 'atlas-standalone',
  token: null,
  fromUrl: typeof window !== 'undefined' ? window.location.href : '',
  functionsVersion: null,
  appBaseUrl: import.meta.env.VITE_APP_BASE_URL || '',
};
