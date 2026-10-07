import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

const SESSION_MESSAGES = {
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
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
      setSessionMessage(SESSION_MESSAGES[code] || 'Your session has expired. Please log in again.');
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  // Reading the token is asynchronous (it comes from the Keystore), so the app
  // shows a splash until /auth/me has confirmed it.
  useEffect(() => {
    let active = true;

    (async () => {
      const token = await getToken();
      if (!token) {
        if (active) setRestoring(false);
        return;
      }

      try {
        const payload = await api.get('/auth/me');
        if (active) setUser(payload.user);
      } catch (error) {
        // A network failure must not log the user out; only a rejected token
        // means the stored session is genuinely dead.
        if (error.isOffline) {
          // Keep the token and let the screens show their offline state.
        } else {
          await clearToken();
        }
      } finally {
        if (active) setRestoring(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const payload = await api.post('/auth/login', credentials);
    await setToken(payload.token);
    setUser(payload.user);
    setSessionMessage(null);
    return payload.user;
  }, []);

  const register = useCallback(async (details) => {
    const payload = await api.post('/auth/register', details);
    await setToken(payload.token);
    setUser(payload.user);
    setSessionMessage(null);
    return payload.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Best effort; the token is discarded locally regardless.
    }
    await clearToken();
    setUser(null);
    setSessionMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      restoring,
      sessionMessage,
      login,
      register,
      logout,
      clearSessionMessage: () => setSessionMessage(null),
    }),
    [user, restoring, sessionMessage, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
