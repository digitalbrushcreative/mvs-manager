import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Api } from './api';

const SESSION_KEY = 'mvs-session';

const AuthContext = createContext(null);

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());
  const [bootstrapping, setBootstrapping] = useState(false);

  const login = useCallback(async (email, password) => {
    const result = await Api.login(email, password);
    if (!result?.token) throw new Error('Invalid response from server');
    const next = { token: result.token, user: result.user };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    try {
      await Api.logout();
    } catch {
      // best-effort; we'll clear the session locally regardless
    }
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  // Optional: revalidate the session on mount in case the token was revoked.
  useEffect(() => {
    if (!session?.token) return;
    setBootstrapping(true);
    Api.me()
      .then((me) => {
        if (me?.user) {
          const next = { token: session.token, user: me.user };
          localStorage.setItem(SESSION_KEY, JSON.stringify(next));
          setSession(next);
        }
      })
      .catch(() => {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
      })
      .finally(() => setBootstrapping(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      role: session?.user?.role || null,
      isAuthenticated: Boolean(session?.token),
      bootstrapping,
      login,
      logout,
    }),
    [session, bootstrapping, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
