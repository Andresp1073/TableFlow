'use client';

import { cn } from '@/lib/cn';

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
        'auto-rows-min',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface DashboardGridItemProps {
  children: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6;
  rowSpan?: 1 | 2;
  className?: string;
}

function DashboardGridItem({ children, colSpan = 1, rowSpan = 1, className }: DashboardGridItemProps) {
  return (
    <div
      className={cn(
        colSpan > 1 && `sm:col-span-${colSpan}`,
        colSpan >= 3 && 'lg:col-span-2',
        colSpan >= 5 && 'xl:col-span-3',
        rowSpan > 1 && 'row-span-1',
        className,
      )}
    >
      {children}
    </div>
  );
}

export { DashboardGrid, DashboardGridItem };
