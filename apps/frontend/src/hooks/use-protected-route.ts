'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password', '/session-expired'];

export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    const isErrorRoute = pathname.startsWith('/401') || pathname.startsWith('/403') || pathname.startsWith('/404') || pathname.startsWith('/500');

    if (!isAuthenticated && !isPublicRoute && !isErrorRoute) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);
}
