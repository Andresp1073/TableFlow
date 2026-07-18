'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import type { NavGroup } from '@/components/navigation/nav-types';

interface AppSidebarProps extends React.HTMLAttributes<HTMLElement> {
  sections: NavGroup;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showToggle?: boolean;
}

const AppSidebar = forwardRef<HTMLElement, AppSidebarProps>(
  ({ sections, collapsed = false, onToggleCollapse, showToggle = true, className, ...props }, ref) => {
    const pathname = usePathname();

    return (
      <TooltipProvider delayDuration={200}>
        <aside
          ref={ref}
          className={cn(
            'flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200',
            collapsed ? 'w-16' : 'w-60',
            className,
          )}
          {...props}
        >
          <div className="flex h-14 items-center border-b border-sidebar-border px-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              {collapsed ? (
                <span className="text-sm font-bold">TF</span>
              ) : (
                <span className="text-sm font-bold">TableFlow</span>
              )}
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin" aria-label="Sidebar navigation">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-4">
                {section.title && !collapsed && (
                  <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
                    {section.title}
                  </p>
                )}
                <ul className="space-y-0.5" role="list">
                  {section.items.map((item, itemIndex) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <SidebarNavItem
                        key={itemIndex}
                        label={item.label}
                        href={item.href}
                        icon={item.icon}
                        badge={item.badge}
                        isActive={isActive}
                        collapsed={collapsed}
                      />
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {showToggle && (
            <div className="border-t border-sidebar-border p-2">
              <Button
                variant="ghost"
                size={collapsed ? 'icon-md' : 'md'}
                className={cn(
                  'w-full text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center',
                )}
                onClick={onToggleCollapse}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
              </Button>
            </div>
          )}
        </aside>
      </TooltipProvider>
    );
  },
);
AppSidebar.displayName = 'AppSidebar';

interface SidebarNavItemProps {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  isActive: boolean;
  collapsed: boolean;
}

function SidebarNavItem({ label, href, icon, badge, isActive, collapsed }: SidebarNavItemProps) {
  const linkContent = (
    <Link
      href={href}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
        'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
        collapsed && 'justify-center px-0',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="h-4 w-4 shrink-0" aria-hidden="true">
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{label}</span>
          {badge !== undefined && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-accent px-1 text-xs font-medium">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="ml-2">
            {label}
            {badge !== undefined && (
              <span className="ml-2 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return <li>{linkContent}</li>;
}

export { AppSidebar };
export type { AppSidebarProps };
