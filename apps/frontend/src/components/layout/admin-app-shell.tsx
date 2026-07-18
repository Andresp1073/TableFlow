'use client';

import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useSidebar } from '@/providers/sidebar-provider';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { NAV_ITEMS } from '@/components/navigation/nav-config';

interface AdminAppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminAppShell({ children, className }: AdminAppShellProps) {
  const { collapsed, mobileOpen, toggleCollapsed, setMobileOpen } = useSidebar();
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className={cn('flex h-screen overflow-hidden bg-background', className)}>
      {isMobile ? (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <AppSidebar
              sections={NAV_ITEMS}
              collapsed={false}
              showToggle={false}
              className="h-full border-r-0"
            />
          </SheetContent>
        </Sheet>
      ) : (
        <AppSidebar
          sections={NAV_ITEMS}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
