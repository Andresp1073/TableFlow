'use client';

import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';
import type { UpcomingReservationItem } from '@/lib/dashboard-types';
import { cn } from '@/lib/cn';

interface UpcomingReservationsWidgetProps {
  data?: UpcomingReservationItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefresh?: () => void;
  onRetry?: () => void;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-primary/10 text-primary',
  seated: 'bg-success/10 text-success',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
};

function getStatusBadge(status: string): string {
  return STATUS_BADGE[status] ?? 'bg-muted text-muted-foreground';
}

function UpcomingReservationsWidget({ data, isLoading, isError, error, onRefresh, onRetry }: UpcomingReservationsWidgetProps) {
  return (
    <DashboardWidget
      title="Upcoming Reservations"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.length === 0}
      error={error}
      emptyMessage="No upcoming reservations"
      onRefresh={onRefresh}
      onRetry={onRetry}
    >
      {data && data.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {data.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-1.5 border-b last:border-b-0">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-sm font-medium truncate">{r.customerName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {r.partySize}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(r.startTime)}
                  </span>
                  {r.tableNumber && <span>Table {r.tableNumber}</span>}
                </div>
              </div>
              <Badge variant="outline" className={cn('text-[10px]', getStatusBadge(r.status))}>
                {r.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </DashboardWidget>
  );
}

export { UpcomingReservationsWidget };
