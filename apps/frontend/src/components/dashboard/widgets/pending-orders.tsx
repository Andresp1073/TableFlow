'use client';

import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import { ShoppingCart } from 'lucide-react';
import type { PendingOrdersData } from '@/lib/dashboard-types';

interface PendingOrdersWidgetProps {
  data?: PendingOrdersData;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefresh?: () => void;
  onRetry?: () => void;
}

function PendingOrdersWidget({ data, isLoading, isError, error, onRefresh, onRetry }: PendingOrdersWidgetProps) {
  return (
    <DashboardWidget
      title="Pending Orders"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.total === 0}
      error={error}
      emptyMessage="No pending orders"
      onRefresh={onRefresh}
      onRetry={onRetry}
    >
      {data && data.total > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <ShoppingCart className="h-5 w-5 text-warning" />
            <span className="text-3xl font-bold">{data.total}</span>
            <span className="text-xs text-muted-foreground">pending</span>
          </div>
          <p className="text-xs text-muted-foreground">Order management coming soon</p>
        </div>
      )}
    </DashboardWidget>
  );
}

export { PendingOrdersWidget };
