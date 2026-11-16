import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!tokenStore.get()) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    api.auth
      .me()
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('campuscare:unauthorized', onUnauthorized);
    return () => window.removeEventListener('campuscare:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await api.auth.login({ email, password });
    tokenStore.set(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await api.auth.register(payload);
    tokenStore.set(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    const profile = await api.auth.me();
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshProfile, isAuthenticated: Boolean(user) }),
    [user, loading, login, register, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
