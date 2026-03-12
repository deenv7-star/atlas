import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  // Kept for API-compatibility with existing consumers
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({ id: 'standalone', public_settings: {} });

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    await base44.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.href = '/Login';
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  // Called by the Login page after a successful sign-in
  const loginUser = (userObj) => {
    base44.auth.setUser(userObj);
    setUser(userObj);
    setIsAuthenticated(true);
    setAuthError(null);
  };

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
