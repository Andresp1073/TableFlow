'use client';

import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import { CheckCircle2, Clock, Users, Wrench } from 'lucide-react';
import type { AvailableTablesData } from '@/lib/dashboard-types';
import { cn } from '@/lib/cn';

interface AvailableTablesWidgetProps {
  data?: AvailableTablesData;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefresh?: () => void;
  onRetry?: () => void;
}

const TABLE_STATUSES = [
  { key: 'available' as const, label: 'Available', icon: CheckCircle2, color: 'text-success' },
  { key: 'reserved' as const, label: 'Reserved', icon: Clock, color: 'text-warning' },
  { key: 'occupied' as const, label: 'Occupied', icon: Users, color: 'text-primary' },
  { key: 'maintenance' as const, label: 'Maintenance', icon: Wrench, color: 'text-destructive' },
];

function AvailableTablesWidget({ data, isLoading, isError, error, onRefresh, onRetry }: AvailableTablesWidgetProps) {
  return (
    <DashboardWidget
      title="Available Tables"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.total === 0}
      error={error}
      emptyMessage="No tables configured"
      onRefresh={onRefresh}
      onRetry={onRetry}
    >
      {data && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-success">{data.available}</span>
            <span className="text-xs text-muted-foreground">of {data.total} free</span>
          </div>
          <div className="space-y-1.5">
            {TABLE_STATUSES.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-3.5 w-3.5', color)} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <span className="text-xs font-mono font-medium">{data[key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardWidget>
  );
}

export { AvailableTablesWidget };
