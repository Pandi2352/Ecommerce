import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, onSessionExpired, setAccessToken } from '@/lib/api';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  emailVerified?: boolean;
}

interface AuthContextValue {
  user: CustomerUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clear = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // Try to restore a session on mount (silent refresh via the httpOnly cookie).
  useEffect(() => {
    onSessionExpired(clear);
    (async () => {
      try {
        const res = await api.post('/storefront/auth/refresh');
        setAccessToken((res.data as { accessToken: string }).accessToken);
        const me = await api.get('/storefront/auth/me');
        setUser(me.data as CustomerUser);
      } catch {
        clear();
      } finally {
        setLoading(false);
      }
    })();
  }, [clear]);

  // After auth, hydrate the full profile (the token response omits phone/addresses).
  const hydrate = useCallback(async (accessToken: string) => {
    setAccessToken(accessToken);
    const me = await api.get('/storefront/auth/me');
    setUser(me.data as CustomerUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post('/storefront/auth/login', { email, password });
      await hydrate((res.data as { accessToken: string }).accessToken);
    },
    [hydrate],
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string; phone?: string }) => {
      const res = await api.post('/storefront/auth/register', input);
      await hydrate((res.data as { accessToken: string }).accessToken);
    },
    [hydrate],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/storefront/auth/logout');
    } catch {
      /* ignore */
    }
    clear();
  }, [clear]);

  const refreshUser = useCallback(async () => {
    const me = await api.get('/storefront/auth/me');
    setUser(me.data as CustomerUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
