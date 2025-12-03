'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/lib/api/services/auth.service';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isValidating, setIsValidating] = useState(false);
  const { token, setAuth, clearAuth, _hasHydrated } = useAuthStore();

  useEffect(() => {
    // Only validate session after store has hydrated
    if (!_hasHydrated) {
      return;
    }

    const validateSession = async () => {
      // Check if we have a persisted token
      if (token) {
        setIsValidating(true);
        try {
          // Validate the session by fetching current user
          const user = await authService.getCurrentUser();
          // If successful, update the user in case it changed
          if (user) {
            setAuth(user, token);
          }
        } catch (error) {
          // Token is invalid or expired, clear auth
          clearAuth();
        } finally {
          setIsValidating(false);
        }
      }
    };

    validateSession();
  }, [_hasHydrated, token, setAuth, clearAuth]);

  return <>{children}</>;
}

