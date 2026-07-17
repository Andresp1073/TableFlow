'use client';

import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NavItem {
  label: string;
  value: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TopNavigationProps extends React.HTMLAttributes<HTMLElement> {
  items: NavItem[];
  activeValue?: string;
  onValueChange?: (value: string) => void;
}

function TopNavigation({ items, activeValue, onValueChange, className, ...props }: TopNavigationProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const visibleItems = isMobile ? items.slice(0, 4) : items;

  return (
    <nav className={cn('border-b', className)} aria-label="Top navigation" {...props}>
      <div className="flex h-10 items-center px-4 lg:px-6">
        <Tabs value={activeValue} onValueChange={onValueChange} className="w-full">
          <TabsList className="bg-transparent p-0 h-10">
            {visibleItems.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="relative rounded-none border-b-2 border-transparent px-3 py-2 text-sm data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                  {item.badge !== undefined && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/10 px-1 text-xs font-medium text-primary">
                      {item.badge}
                    </span>
                  )}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </nav>
  );
}

export { TopNavigation };
export type { NavItem, TopNavigationProps };
