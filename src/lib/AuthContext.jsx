import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase, isSupabaseConfigured, storedSessionUser } from '@/api/supabaseClient';
import { clearPersistedQueries } from '@/lib/queryPersist';
import { queryClientInstance } from '@/lib/query-client';
import { setActiveOrg, syncOrgSettingsFromDb } from '@/lib/onboarding/orgSettings';
import { fetchAccountStatus } from '@/lib/accountStatus';

const AuthContext = createContext();

/** REST / demo auth keys — storage events sync other tabs when Supabase is off. */
const REST_TOKEN_KEY = 'atlas_jwt_token';
const LOCAL_USER_KEY = 'atlas_current_user';
/** Last good auth.me() result for the stored session's user: paints the app at once on reload, then refreshed. */
const ME_CACHE_KEY = 'atlas.me.v1';
const ME_CACHE_MAX_AGE_MS = 7 * 24 * 3600_000;

function readCachedMe() {
  if (!isSupabaseConfigured) return null;
  const uid = storedSessionUser()?.id;
  if (!uid) return null;
  try {
    const c = JSON.parse(localStorage.getItem(ME_CACHE_KEY) || 'null');
    if (!c || c.uid !== uid || !c.user || c.user.id !== uid || Date.now() - (c.at || 0) > ME_CACHE_MAX_AGE_MS) return null;
    return c.user;
  } catch { return null; }
}
function writeCachedMe(u) {
  if (!isSupabaseConfigured || !u?.id) return;
  try { localStorage.setItem(ME_CACHE_KEY, JSON.stringify({ uid: u.id, at: Date.now(), user: u })); } catch { /* quota / private mode */ }
}
function dropCachedMe() {
  try { localStorage.removeItem(ME_CACHE_KEY); } catch { /* ignore */ }
}

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
    clearPersistedQueries();
    dropCachedMe();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: 'auth_required', message: 'Authentication required' });
  }, []);

  // One in-flight hydration at a time: init, INITIAL_SESSION and SIGNED_IN often fire together,
  // and each used to run auth.me() + profile + status again.
  const inflightRef = useRef(null);
  const lastUidRef = useRef(null);
  const userRef = useRef(null);

  const hydrateUser = useCallback(() => {
    if (inflightRef.current) return inflightRef.current;
    const run = (async () => {
      try {
        let me, status;
        try {
          [me, status] = await Promise.all([base44.auth.me(), fetchAccountStatus()]);
        } catch (err) {
          if (!err?.isTransient) throw err;
          // Slow / failed profile read: keep the copy already on screen, or try once more.
          if (userRef.current) return userRef.current;
          [me, status] = await Promise.all([base44.auth.me(), fetchAccountStatus()]);
        }
        // Suspension is set by the platform admin (migration 011); null when unknown / not suspended.
        const currentUser = me && status?.suspended
          ? { ...me, account_suspended: true, account_suspended_reason: status.reason || '' }
          : me;
        setActiveOrg(currentUser?.organization_id);
        syncOrgSettingsFromDb(currentUser?.organization_id); // background; local copy is used meanwhile
        lastUidRef.current = currentUser?.id || null;
        userRef.current = currentUser;
        writeCachedMe(currentUser);
        setUser(currentUser);
        setIsAuthenticated(true);
        setAuthError(null);
        if (currentUser?.onboarding_completed) {
          try { localStorage.removeItem('onboarding_just_completed'); } catch {}
        }
        return currentUser;
      } catch {
        lastUidRef.current = null;
        userRef.current = null;
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
        // Returning owner: show the app at once from the last good copy and refresh it in the background
        // (profile + suspension status). Without a copy, wait for it as before.
        const cached = readCachedMe();
        if (cached) {
          lastUidRef.current = cached.id;
          userRef.current = cached;
          setActiveOrg(cached.organization_id);
          setUser(cached);
          setIsAuthenticated(true);
          setAuthError(null);
          setIsLoadingAuth(false);
          void hydrateUser();
        } else {
          // Restore session from storage (if the user was previously logged in)
          await hydrateUser();
          setIsLoadingAuth(false);
        }

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
