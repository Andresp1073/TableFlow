'use client';

import { Menu, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/theme-provider';
import { useSidebar } from '@/providers/sidebar-provider';
import { useMediaQuery } from '@/hooks/use-media-query';
import { BreadcrumbManager } from '@/components/layout/breadcrumb-manager';
import { GlobalSearch } from '@/components/layout/global-search';
import { NotificationBell } from '@/components/layout/notification-bell';
import { UserMenu } from '@/components/layout/user-menu';
import { RestaurantSelector } from '@/components/layout/restaurant-selector';

interface AdminHeaderProps {
  className?: string;
}

export function AdminHeader({ className }: AdminHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { toggleMobileOpen } = useSidebar();
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 lg:px-6',
        className,
      )}
    >
      {isMobile && (
        <Button variant="ghost" size="icon-md" onClick={toggleMobileOpen} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <div className="flex items-center gap-3 flex-1 min-w-0">
        {!isMobile && <RestaurantSelector />}
        {!isMobile && <div className="h-4 w-px bg-border" />}
        <div className="hidden sm:block">
          <BreadcrumbManager />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <GlobalSearch />
        <Button
          variant="ghost"
          size="icon-md"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <NotificationBell />
        <UserMenu name="Admin User" email="admin@tableflow.com" initials="AU" />
      </div>
    </header>
  );
}
