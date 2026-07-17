'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Header } from '@/components/layout/header';
import { Sidebar, type SidebarSection } from '@/components/layout/sidebar';
import { Menu, Bell, Settings, Moon, Sun, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/providers/theme-provider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface AppShellProps {
  sidebarSections: SidebarSection[];
  children: React.ReactNode;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
  user?: {
    name: string;
    email?: string;
    avatar?: string;
    initials?: string;
  };
}

function AppShell({
  sidebarSections,
  children,
  headerLeft,
  headerRight,
  className,
  user,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={cn('flex h-screen overflow-hidden bg-background', className)}>
      {isMobile ? (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-md" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar
              sections={sidebarSections}
              collapsed={false}
              showToggle={false}
              className="h-full border-r-0"
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar
          sections={sidebarSections}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          leftSlot={
            <div className="flex items-center gap-2">
              {isMobile && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon-md">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                </Sheet>
              )}
              {headerLeft}
            </div>
          }
          rightSlot={
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-md" onClick={toggleTheme} aria-label="Toggle theme">
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              <Button variant="ghost" size="icon-md" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-md" className="rounded-full">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {user.initials ?? user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.name}</span>
                        {user.email && (
                          <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {headerRight}
            </div>
          }
        />

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export { AppShell };
export type { AppShellProps };
