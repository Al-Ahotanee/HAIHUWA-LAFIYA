'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole, AuthTokens } from '@/types/api';
import { api, apiClient } from '@/lib/api-client';
import {
  TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  ROLE_HIERARCHY,
} from '@/lib/constants';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasMinRole: (minRole: UserRole) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ['/', '/login', '/forgot-password', '/reset-password'];

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleClearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (!storedRefreshToken) {
      handleClearAuth();
      return;
    }

    try {
      const response = await api.post<{ access_token: string; refresh_token?: string; user?: User }>(
        '/api/v1/auth/refresh',
        { refresh_token: storedRefreshToken }
      );

      localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
      if (response.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.refresh_token);
      }
      if (response.user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
        setUser(response.user);
      }
    } catch {
      handleClearAuth();
    }
  }, [handleClearAuth]);

  // Initial Auth Check
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);

        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // Invalid JSON, will verify with API
          }
        }

        // Verify with /me
        try {
          const currentUser = await api.get<User>('/api/v1/auth/me');
          setUser(currentUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
        } catch {
          // Attempt refresh if me fails
          await refreshToken();
        }
      } catch {
        handleClearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [handleClearAuth, refreshToken]);

  // Unauthenticated Route Protection
  useEffect(() => {
    if (!isLoading) {
      const isPublicPath =
        pathname === '/' ||
        PUBLIC_PATHS.filter((p) => p !== '/').some((path) => pathname?.startsWith(path));
      if (!user && !isPublicPath) {
        router.push('/login');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const tokens = await api.post<AuthTokens>('/api/v1/auth/login', {
        email,
        password,
      });

      localStorage.setItem(TOKEN_STORAGE_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refresh_token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(tokens.user));
      apiClient.defaults.headers.common.Authorization = `Bearer ${tokens.access_token}`;

      setUser(tokens.user);
      return tokens.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/api/v1/auth/logout').catch(() => {
        // Ignore API failures on logout
      });
    } finally {
      handleClearAuth();
      router.push('/login');
    }
  };

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      if (user.role === 'super_admin') return true;
      const roleList = Array.isArray(roles) ? roles : [roles];
      return roleList.includes(user.role);
    },
    [user]
  );

  const hasMinRole = useCallback(
    (minRole: UserRole): boolean => {
      if (!user) return false;
      const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
      const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;
      return userLevel >= requiredLevel;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshToken,
        hasRole,
        hasMinRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
