'use client';
import { t } from '@/lib/i18n';

import type { KitchenStats } from '@/lib/order-types';
import { cn } from '@/lib/cn';

interface KdsHeaderProps {
  title?: string;
  stats?: KitchenStats | null;
  children?: React.ReactNode;
  className?: string;
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${label}: ${value}`}>
      <span className={cn('h-2 w-2 rounded-full shrink-0', color)} aria-hidden="true" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

export function KdsHeader({ title = 'Kitchen Display', stats, children, className }: KdsHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border',
        className,
      )}
      role="banner"
    >
      <div className="flex items-center justify-between px-4 py-2.5 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate">{title}</h1>
          {stats && (
            <div className="hidden sm:flex items-center gap-3" role="status" aria-label={t("Kitchen statistics")}>
              <StatBadge label={t("New")} value={stats.pending} color="bg-warning" />
              <StatBadge label={t("Prep")} value={stats.preparing} color="bg-info" />
              <StatBadge label={t("Ready")} value={stats.ready} color="bg-success" />
              <StatBadge label={t("Late")} value={stats.slaLate} color="bg-destructive" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      </div>
    </header>
  );
}
