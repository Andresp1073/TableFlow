'use client';

import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import { ChefHat, Clock, CookingPot, UtensilsCrossed, ListChecks } from 'lucide-react';
import type { KitchenStatusData } from '@/lib/dashboard-types';
import { cn } from '@/lib/cn';

interface KitchenStatusWidgetProps {
  data?: KitchenStatusData;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefresh?: () => void;
  onRetry?: () => void;
}

const STATUS_ITEMS = [
  { key: 'pending' as const, label: 'Pending', icon: Clock, color: 'text-warning' },
  { key: 'preparing' as const, label: 'Preparing', icon: CookingPot, color: 'text-primary' },
  { key: 'ready' as const, label: 'Ready', icon: UtensilsCrossed, color: 'text-success' },
  { key: 'completed' as const, label: 'Completed', icon: ListChecks, color: 'text-muted-foreground' },
];

function KitchenStatusWidget({ data, isLoading, isError, error, onRefresh, onRetry }: KitchenStatusWidgetProps) {
  return (
    <DashboardWidget
      title="Kitchen Status"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.totalOrders === 0}
      error={error}
      emptyMessage="Kitchen tracking coming soon"
      onRefresh={onRefresh}
      onRetry={onRetry}
    >
      {data && data.totalOrders > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <ChefHat className="h-5 w-5 text-muted-foreground" />
            <span className="text-3xl font-bold">{data.totalOrders}</span>
            <span className="text-xs text-muted-foreground">total orders</span>
          </div>
          <div className="space-y-1.5">
            {STATUS_ITEMS.map(({ key, label, icon: Icon, color }) => (
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

export { KitchenStatusWidget };
