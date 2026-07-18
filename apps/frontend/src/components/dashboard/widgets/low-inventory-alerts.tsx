'use client';

import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import { AlertTriangle } from 'lucide-react';
import type { LowInventoryAlertsData } from '@/lib/dashboard-types';
import { t } from '@/lib/i18n';

interface LowInventoryAlertsWidgetProps {
  data?: LowInventoryAlertsData;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefresh?: () => void;
  onRetry?: () => void;
}

function LowInventoryAlertsWidget({ data, isLoading, isError, error, onRefresh, onRetry }: LowInventoryAlertsWidgetProps) {
  return (
    <DashboardWidget
      title={t('Low Inventory Alerts')}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.total === 0}
      error={error}
      emptyMessage={t('All inventory levels are healthy')}
      onRefresh={onRefresh}
      onRetry={onRetry}
    >
      {data && data.total > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-3xl font-bold">{data.total}</span>
            <span className="text-xs text-muted-foreground">{t('alerts')}</span>
          </div>
          <div className="space-y-1.5">
            {data.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{item.name}</span>
                <span className="text-xs font-mono text-destructive">{item.currentStock}/{item.minimumStock} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardWidget>
  );
}

export { LowInventoryAlertsWidget };
