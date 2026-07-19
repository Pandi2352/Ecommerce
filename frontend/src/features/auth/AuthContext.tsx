import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { hasPermission } from '@ecommerce/shared';
import { setAccessToken, onSessionExpired } from '@/lib/api';
import { authApi, type AuthUser } from './api';

type Status = 'loading' | 'authenticated' | 'guest';

interface AuthContextValue {
  user: AuthUser | null;
  status: Status;
  login: (email: string, password: string) => Promise<void>;
  acceptInvite: (token: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Merge fields into the current user (e.g. after a profile/avatar update). */
  updateUser: (patch: Partial<AuthUser>) => void;
  /** Does the current user have a permission (write implies read)? */
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const apply = (payload: { accessToken: string; user: AuthUser }) => {
    setAccessToken(payload.accessToken);
    setUser(payload.user);
    setStatus('authenticated');
  };

  const clear = () => {
    setAccessToken(null);
    setUser(null);
    setStatus('guest');
  };

  // Bootstrap: try to restore a session from the refresh cookie on first load.
  useEffect(() => {
    let active = true;
    authApi
      .refresh()
      .then((payload) => active && apply(payload))
      .catch(() => active && clear());
    onSessionExpired(() => clear());
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    apply(await authApi.login({ email, password }));
  };

  const acceptInvite = async (token: string, password: string) => {
    apply(await authApi.acceptInvite(token, password));
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clear();
    }
  };

  const updateUser = (patch: Partial<AuthUser>) =>
    setUser((current) => (current ? { ...current, ...patch } : current));

  const can = (permission: string) => hasPermission(user?.permissions ?? [], permission);

  return (
    <AuthContext.Provider value={{ user, status, login, acceptInvite, logout, updateUser, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
