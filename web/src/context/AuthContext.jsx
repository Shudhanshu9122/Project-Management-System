import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

const SESSION_MESSAGES = {
  TOKEN_EXPIRED: 'Your session expired. Please log in again.',
  TOKEN_REVOKED: 'You were logged out on another device. Please log in again.',
  INVALID_TOKEN: 'Your session is no longer valid. Please log in again.',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [sessionMessage, setSessionMessage] = useState(null);

  
  
  useEffect(() => {
    setUnauthorizedHandler((code) => {
      setUser(null);
      setSessionMessage(SESSION_MESSAGES[code] || 'Your session expired. Please log in again.');
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  
  useEffect(() => {
    if (!getToken()) {
      setRestoring(false);
      return undefined;
    }

    let active = true;

    api
      .get('/auth/me')
      .then((payload) => {
        if (active) setUser(payload.user);
      })
      .catch(() => {
        if (active) clearToken();
      })
      .finally(() => {
        if (active) setRestoring(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const payload = await api.post('/auth/login', credentials);
    setToken(payload.token);
    setUser(payload.user);
    setSessionMessage(null);
    return payload.user;
  }, []);

  const register = useCallback(async (details) => {
    const payload = await api.post('/auth/register', details);
    setToken(payload.token);
    setUser(payload.user);
    setSessionMessage(null);
    return payload.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      
      await api.post('/auth/logout');
    } catch {
      
    }
    clearToken();
    setUser(null);
    setSessionMessage(null);
  }, []);

  const value = useMemo(
    () => ({ user, restoring, sessionMessage, login, register, logout, clearSessionMessage: () => setSessionMessage(null) }),
    [user, restoring, sessionMessage, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
