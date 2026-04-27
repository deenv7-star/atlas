import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { queryClientInstance } from '@/lib/query-client';

const AuthContext = createContext();

/** REST / demo auth keys — storage events sync other tabs when Supabase is off. */
const REST_TOKEN_KEY = 'atlas_jwt_token';
const LOCAL_USER_KEY = 'atlas_current_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser]                         = useState(null);
  const [isAuthenticated, setIsAuthenticated]   = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]       = useState(true);
  const [authError, setAuthError]               = useState(null);

  // Kept for API-compatibility with existing consumers
  const [isLoadingPublicSettings] = useState(false);
  const [appPublicSettings]       = useState({ id: 'standalone', public_settings: {} });

  // ── helpers ────────────────────────────────────────────────────────────────

  const clearSessionState = useCallback(() => {
    queryClientInstance.clear();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: 'auth_required', message: 'Authentication required' });
  }, []);

  const hydrateUser = useCallback(async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      if (currentUser?.onboarding_completed) {
        try { localStorage.removeItem('onboarding_just_completed'); } catch {}
      }
      return currentUser;
    } catch {
      clearSessionState();
      return null;
    }
  }, [clearSessionState]);

  // ── initialise ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let unsubscribe = () => {};

    const init = async () => {
      setIsLoadingAuth(true);

      if (isSupabaseConfigured && supabase) {
        // Restore session from storage (if the user was previously logged in)
        await hydrateUser();
        setIsLoadingAuth(false);

        // Supabase syncs the same session across tabs via storage; this listener
        // runs on sign-in, refresh, sign-out, and user metadata updates.
        unsubscribe = base44.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
            clearSessionState();
            return;
          }
          if (
            event === 'SIGNED_IN' ||
            event === 'TOKEN_REFRESHED' ||
            event === 'INITIAL_SESSION' ||
            event === 'USER_UPDATED' ||
            event === 'PASSWORD_RECOVERY'
          ) {
            if (session != null || event === 'USER_UPDATED') {
              await hydrateUser();
            }
          }
        });
      } else {
        // localStorage / REST — read once on mount
        await hydrateUser();
        setIsLoadingAuth(false);
      }
    };

    init();
    return () => unsubscribe();
  }, [hydrateUser, clearSessionState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Other tabs: REST JWT or demo user blob changed or removed
  useEffect(() => {
    if (isSupabaseConfigured) return undefined;

    const onStorage = (e) => {
      if (e.storageArea !== localStorage) return;
      if (e.key !== REST_TOKEN_KEY && e.key !== LOCAL_USER_KEY) return;
      if (e.newValue == null) {
        clearSessionState();
        return;
      }
      void hydrateUser();
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrateUser, clearSessionState]);

  // ── actions ────────────────────────────────────────────────────────────────

  const logout = async (shouldRedirect = true) => {
    try {
      await base44.auth.logout();
    } finally {
      clearSessionState();
      if (shouldRedirect) window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  /**
   * Called by the Login page after a successful sign-in / sign-up.
   * In Supabase mode the auth state listener will fire automatically, so this
   * is mostly a compatibility shim that also handles the localStorage case.
   * Returns the hydrated user object (for redirect logic).
   */
  const loginUser = async (userObjOrNull) => {
    if (userObjOrNull) {
      // localStorage mode — caller passes a plain user object
      base44.auth.setUser?.(userObjOrNull);
      setUser(userObjOrNull);
      setIsAuthenticated(true);
      setAuthError(null);
      return userObjOrNull;
    } else {
      // Supabase mode — re-fetch from the server after signIn
      return await hydrateUser();
    }
  };

  const checkAppState = hydrateUser;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      loginUser,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
