'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { authService, LoginRequest } from '@/lib/api/services/auth.service';
import { ROUTES } from '@/lib/constants';

export function useAuth() {
  const router = useRouter();
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        const response = await authService.login(credentials);
        setAuth(response.user, response.token);
        router.push(ROUTES.DASHBOARD);
        return response;
      } catch (error) {
        throw error;
      }
    },
    [setAuth, router]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      router.push(ROUTES.LOGIN);
    }
  }, [clearAuth, router]);

  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      // Token is already in store, just update user if needed
      return currentUser;
    } catch (error) {
      clearAuth();
      return null;
    }
  }, [clearAuth]);

  return {
    login,
    logout,
    checkAuth,
    isAuthenticated,
    user,
  };
}
