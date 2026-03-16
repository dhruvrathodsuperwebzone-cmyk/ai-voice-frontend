import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

const TOKEN_KEY = 'token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authService.getMe();
      // API may return { data: { user: {...} } } or { user: {...} } or {...} as the user object
      const userObj = data?.data?.user ?? data?.user ?? data;
      setUser(userObj && typeof userObj === 'object' ? userObj : null);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const getTokenFromResponse = useCallback((data) => {
    return data?.token ?? data?.accessToken ?? data?.access_token ?? data?.jwt;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await authService.login({ email, password });
      const token = getTokenFromResponse(data);
      if (token) {
        setToken(token);
        await loadUser();
        return { success: true };
      }
      return { success: false, message: 'No token received. Check backend login response.' };
    },
    [setToken, loadUser, getTokenFromResponse]
  );

  const registerUser = useCallback(
    async (payload) => {
      const data = await authService.register(payload);
      const token = getTokenFromResponse(data);
      if (token) {
        setToken(token);
        await loadUser();
        return { success: true };
      }
      return {
        success: false,
        message: 'Account may be created but no token returned. Please sign in.',
      };
    },
    [setToken, loadUser, getTokenFromResponse]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
  }, [setToken]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register: registerUser,
    logout,
    setToken,
    loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
