import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                         = useState(null);
  const [isAuthenticated, setIsAuthenticated]   = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]       = useState(true);
  const [authError, setAuthError]               = useState(null);

  // Kept for API-compatibility with existing consumers
  const [isLoadingPublicSettings] = useState(false);
  const [appPublicSettings]       = useState({ id: 'standalone', public_settings: {} });

  // ── helpers ────────────────────────────────────────────────────────────────

  const hydrateUser = async () => {
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
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
      return null;
    }
  };

  // ── initialise ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let unsubscribe = () => {};

    const init = async () => {
      setIsLoadingAuth(true);

      if (isSupabaseConfigured && supabase) {
        // Restore session from storage (if the user was previously logged in)
        await hydrateUser();
        setIsLoadingAuth(false);

        // Keep in sync with Supabase auth state changes (sign-in, sign-out,
        // token refresh, etc.)
        unsubscribe = base44.auth.onAuthStateChange(async (event) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await hydrateUser();
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsAuthenticated(false);
            setAuthError({ type: 'auth_required', message: 'Authentication required' });
          }
        });
      } else {
        // localStorage mode — read once on mount
        await hydrateUser();
        setIsLoadingAuth(false);
      }
    };

    init();
    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── actions ────────────────────────────────────────────────────────────────

  const logout = async (shouldRedirect = true) => {
    await base44.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.href = '/login';
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
