'use client';

import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import { Users, UsersRound, CalendarCheck, Ban, AlertCircle, Clock } from 'lucide-react';
import type { QuickStatisticsData } from '@/lib/dashboard-types';

interface QuickStatisticsWidgetProps {
  data?: QuickStatisticsData;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefresh?: () => void;
  onRetry?: () => void;
}

type StatItem = {
  key: keyof QuickStatisticsData;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  format: (v: number | string) => string;
};

const STATS: StatItem[] = [
  { key: 'totalCustomers', label: 'Total Customers', icon: Users, format: (v) => (v as number).toLocaleString() },
  { key: 'averagePartySize', label: 'Avg Party Size', icon: UsersRound, format: (v) => (v as number).toFixed(1) },
  { key: 'totalReservationsToday', label: 'Reservations Today', icon: CalendarCheck, format: (v) => (v as number).toString() },
  { key: 'cancellationRate', label: 'Cancellation Rate', icon: Ban, format: (v) => `${v as number}%` },
  { key: 'noShowRate', label: 'No-Show Rate', icon: AlertCircle, format: (v) => `${v as number}%` },
  { key: 'peakHour', label: 'Peak Hour', icon: Clock, format: (v) => v as string },
];

function QuickStatisticsWidget({ data, isLoading, isError, error, onRefresh, onRetry }: QuickStatisticsWidgetProps) {
  return (
    <DashboardWidget
      title="Quick Statistics"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      error={error}
      emptyMessage="No statistics available"
      onRefresh={onRefresh}
      onRetry={onRetry}
    >
      {data && (
        <div className="grid grid-cols-2 gap-3">
          {STATS.map(({ key, label, icon: Icon, format }) => (
            <div key={key} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">
                  {typeof data[key] === 'number' ? format(data[key] as number) : String(data[key])}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardWidget>
  );
}

export { QuickStatisticsWidget };
