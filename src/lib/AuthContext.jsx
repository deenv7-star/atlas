import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { queryClientInstance } from '@/lib/query-client';
import { setActiveOrg, syncOrgSettingsFromDb } from '@/lib/onboarding/orgSettings';
import { fetchAccountStatus } from '@/lib/accountStatus';

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

  // One in-flight hydration at a time: init, INITIAL_SESSION and SIGNED_IN often fire together,
  // and each used to run auth.me() + profile + status again.
  const inflightRef = useRef(null);
  const lastUidRef = useRef(null);

  const hydrateUser = useCallback(() => {
    if (inflightRef.current) return inflightRef.current;
    const run = (async () => {
      try {
        const [me, status] = await Promise.all([base44.auth.me(), fetchAccountStatus()]);
        // Suspension is set by the platform admin (migration 011); null when unknown / not suspended.
        const currentUser = me && status?.suspended
          ? { ...me, account_suspended: true, account_suspended_reason: status.reason || '' }
          : me;
        setActiveOrg(currentUser?.organization_id);
        syncOrgSettingsFromDb(currentUser?.organization_id); // background; local copy is used meanwhile
        lastUidRef.current = currentUser?.id || null;
        setUser(currentUser);
        setIsAuthenticated(true);
        setAuthError(null);
        if (currentUser?.onboarding_completed) {
          try { localStorage.removeItem('onboarding_just_completed'); } catch {}
        }
        return currentUser;
      } catch {
        lastUidRef.current = null;
        clearSessionState();
        return null;
      } finally {
        inflightRef.current = null;
      }
    })();
    inflightRef.current = run;
    return run;
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
        // IMPORTANT: never await Supabase calls inside this callback. supabase-js holds its auth lock
        // while listeners run, so awaiting getUser()/queries here deadlocks updateUser() (password
        // reset spinner that never ends). Defer the work to the next tick instead.
        unsubscribe = base44.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
            lastUidRef.current = null;
            clearSessionState();
            return;
          }
          // Token refresh / initial session for the user we already hydrated: nothing changed.
          if ((event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session?.user?.id && session.user.id === lastUidRef.current) {
            return;
          }
          if (
            event === 'SIGNED_IN' ||
            event === 'TOKEN_REFRESHED' ||
            event === 'INITIAL_SESSION' ||
            event === 'USER_UPDATED' ||
            event === 'PASSWORD_RECOVERY'
          ) {
            if (event === 'SIGNED_IN' && session?.user?.id && session.user.id === lastUidRef.current) return;
            if (session != null || event === 'USER_UPDATED') {
              setTimeout(() => { void hydrateUser(); }, 0);
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
