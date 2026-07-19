'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { t } from '@/lib/i18n';

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  isActive?: boolean;
  badge?: string | number;
  onClick?: () => void;
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  sections: SidebarSection[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showToggle?: boolean;
}

const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ sections, collapsed = false, onToggleCollapse, showToggle = true, className, ...props }, ref) => {
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
            {collapsed ? (
              <div className="flex w-full items-center justify-center">
                <span className="text-sm font-bold">TF</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{t('TableFlow')}</span>
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin" aria-label={t('Sidebar navigation')}>
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-4">
                {section.title && !collapsed && (
                  <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
                    {t(section.title)}
                  </p>
                )}
                <ul className="space-y-0.5" role="list">
                  {section.items.map((item, itemIndex) => (
                    <SidebarItem key={itemIndex} item={item} collapsed={collapsed} />
                  ))}
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
                aria-label={collapsed ? t('Expand sidebar') : t('Collapse sidebar')}
              >
                {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                {!collapsed && <span className="ml-2 text-xs">{t('Collapse')}</span>}
              </Button>
            </div>
          )}
        </aside>
      </TooltipProvider>
    );
  },
);
Sidebar.displayName = 'Sidebar';

function SidebarItem({ item, collapsed }: { item: SidebarItem; collapsed: boolean }) {
  const content = (
    <button
      onClick={item.onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
        'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        item.isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
        collapsed && 'justify-center px-0',
      )}
      aria-current={item.isActive ? 'page' : undefined}
    >
      <span className="h-4 w-4 shrink-0" aria-hidden="true">
        {item.icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{t(item.label)}</span>
          {item.badge !== undefined && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-accent px-1 text-xs font-medium">
              {item.badge}
            </span>
          )}
        </>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              {t(item.label)}
            {item.badge !== undefined && (
              <span className="ml-2 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return <li>{content}</li>;
}

export { Sidebar };
export type { SidebarItem, SidebarSection, SidebarProps };
