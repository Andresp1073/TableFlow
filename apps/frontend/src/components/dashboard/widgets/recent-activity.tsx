'use client';

import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import type { RecentActivityItem } from '@/lib/dashboard-types';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface RecentActivityWidgetProps {
  data?: RecentActivityItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefresh?: () => void;
  onRetry?: () => void;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t('Just now');
    if (diffMin < 60) return t('{diffMin}m ago', { diffMin });
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return t('{diffHrs}h ago', { diffHrs });
    return d.toLocaleDateString();
  } catch { return ''; }
}

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-primary/10 text-primary',
  updated: 'bg-warning/10 text-warning',
  cancelled: 'bg-destructive/10 text-destructive',
  confirmed: 'bg-success/10 text-success',
  completed: 'bg-muted text-muted-foreground',
};

function getActionColor(action: string): string {
  for (const [key, value] of Object.entries(ACTION_COLORS)) {
    if (action.toLowerCase().includes(key)) return value;
  }
  return 'bg-muted text-muted-foreground';
}

function RecentActivityWidget({ data, isLoading, isError, error, onRefresh, onRetry }: RecentActivityWidgetProps) {
  return (
    <DashboardWidget
      title={t('Recent Activity')}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.length === 0}
      error={error}
      emptyMessage={t('No recent activity')}
      onRefresh={onRefresh}
      onRetry={onRetry}
    >
      {data && data.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {data.map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-xs">
              <History className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className={cn('text-[10px] px-1 py-0', getActionColor(item.action))}>
                    {item.action}
                  </Badge>
                  <span className="text-muted-foreground truncate">{item.description}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-muted-foreground">{item.userName}</span>
                  <span className="text-muted-foreground">&middot;</span>
                  <time className="text-muted-foreground">{formatTime(item.createdAt)}</time>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardWidget>
  );
}

export { RecentActivityWidget };
