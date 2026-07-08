'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api, warmupApi } from './api';
import { clearSessionExpiry, isSessionExpired, setSessionExpiry } from './session';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  /** True once we can render the app (uses cached user immediately). */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function forceLogout(reason?: 'expired') {
  clearSessionExpiry();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  const suffix = reason === 'expired' ? '?session=expired' : '';
  window.location.href = `/login${suffix}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    clearSessionExpiry();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    warmupApi();

    if (isSessionExpired()) {
      forceLogout('expired');
      return;
    }

    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');

    if (token && saved) {
      try {
        setUser(JSON.parse(saved) as User);
      } catch {
        localStorage.removeItem('user');
      }
      setReady(true);

      api.get('/auth/me').then((res) => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }).catch(() => {
        clearSessionExpiry();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      });
    } else {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const interval = window.setInterval(() => {
      if (isSessionExpired()) {
        forceLogout('expired');
      }
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string) => {
    warmupApi();
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.accessToken);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setSessionExpiry(res.data.user.role);
    sessionStorage.setItem('kedar_show_welcome', '1');
    setUser(res.data.user);
    setReady(true);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
