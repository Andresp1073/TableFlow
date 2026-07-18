'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser, AuthState } from '@/lib/auth-types';
import * as authApi from '@/services/auth';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'authUser',
} as const;

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadPersistedState(): Partial<AuthState> {
  if (typeof window === 'undefined') return {};
  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshTokenValue = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    const user = userJson ? JSON.parse(userJson) : null;
    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user,
      isAuthenticated: !!accessToken && !!user,
    };
  } catch {
    return {};
  }
}

function persistAuth(user: AuthUser, accessToken: string, refreshTokenValue: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshTokenValue);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {
    // Silently handle storage errors
  }
}

function clearPersistedAuth() {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch {
    // Silently handle storage errors
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const persisted = loadPersistedState();
  const [state, setState] = useState<AuthState>({
    user: persisted.user ?? null,
    accessToken: persisted.accessToken ?? null,
    refreshToken: persisted.refreshToken ?? null,
    isAuthenticated: persisted.isAuthenticated ?? false,
    isLoading: false,
  });
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshInternalRef = useRef<(() => Promise<void>) | null>(null);

  const scheduleTokenRefresh = useCallback(
    (expiresIn: number) => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      const refreshMs = Math.max((expiresIn - 60) * 1000, 30_000);
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          await refreshInternalRef.current?.();
        } catch {
          setState((prev) => ({ ...prev, isAuthenticated: false, user: null, accessToken: null, refreshToken: null }));
          clearPersistedAuth();
          router.push('/session-expired');
        }
      }, refreshMs);
    },
    [router],
  );

  const refreshSessionInternal = useCallback(async () => {
    const currentRefreshToken = state.refreshToken;
    if (!currentRefreshToken) throw new Error('No refresh token');

    const response = await authApi.refreshToken({ refreshToken: currentRefreshToken });
    const { accessToken, refreshToken: newRefreshToken, expiresIn, user } = response.data;
    persistAuth(user, accessToken, newRefreshToken);
    setState((prev) => ({
      ...prev,
      accessToken,
      refreshToken: newRefreshToken,
      user,
      isAuthenticated: true,
    }));
    scheduleTokenRefresh(expiresIn);
  }, [state.refreshToken, scheduleTokenRefresh]);

  refreshInternalRef.current = refreshSessionInternal;

  const login = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await authApi.login({ email, password });
        const { accessToken, refreshToken: newRefreshToken, expiresIn, user } = response.data;
        persistAuth(user, accessToken, newRefreshToken);
        setState({
          user,
          accessToken,
          refreshToken: newRefreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
        scheduleTokenRefresh(expiresIn);
        router.push('/dashboard');
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [router, scheduleTokenRefresh],
  );

  const logout = useCallback(async () => {
    try {
      if (state.refreshToken) {
        await authApi.logout(state.refreshToken);
      }
    } catch {
      // Continue with local logout even if API fails
    } finally {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      clearPersistedAuth();
      setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
      router.push('/login');
    }
  }, [state.refreshToken, router]);

  const refreshSession = useCallback(async () => {
    if (!state.refreshToken) return;
    try {
      await refreshSessionInternal();
    } catch {
      clearPersistedAuth();
      setState((prev) => ({ ...prev, isAuthenticated: false, user: null, accessToken: null, refreshToken: null }));
      router.push('/session-expired');
    }
  }, [state.refreshToken, refreshSessionInternal, router]);

  const getAccessToken = useCallback(() => state.accessToken, [state.accessToken]);

  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      const userJson = JSON.stringify(state.user);
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER) : null;
      if (stored !== userJson) {
        try { localStorage.setItem(STORAGE_KEYS.USER, userJson); } catch { void 0; }
      }
    }
  }, [state.isAuthenticated, state.user]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshSession,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
