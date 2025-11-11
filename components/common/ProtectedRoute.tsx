'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loading } from './Loading';
import { ROUTES } from '@/lib/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: ('ADMIN' | 'OPERATOR')[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (roles && user && !roles.includes(user.role)) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, user, roles, router]);

  if (!isAuthenticated) {
    return <Loading fullScreen message="Redirecting to login..." />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Loading fullScreen message="Access denied..." />;
  }

  return <>{children}</>;
}
