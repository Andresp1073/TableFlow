'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { SidebarProvider } from '@/providers/sidebar-provider';
import { BreadcrumbProvider } from '@/providers/breadcrumb-provider';
import { RestaurantProvider } from '@/providers/restaurant-provider';
import { NotificationProvider } from '@/providers/notification-provider';
import { AdminAppShell } from '@/components/layout/admin-app-shell';
import { SpinnerPage } from '@/components/ui/spinner';

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password', '/session-expired'];

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    const isErrorRoute = pathname.startsWith('/401') || pathname.startsWith('/403') || pathname.startsWith('/500');
    if (!isAuthenticated && !isPublicRoute && !isErrorRoute) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return <SpinnerPage />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <RestaurantProvider>
      <SidebarProvider>
        <BreadcrumbProvider>
          <NotificationProvider>
            <AdminAppShell>{children}</AdminAppShell>
          </NotificationProvider>
        </BreadcrumbProvider>
      </SidebarProvider>
    </RestaurantProvider>
  );
}
