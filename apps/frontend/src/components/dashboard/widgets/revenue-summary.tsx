'use client';

import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import { TrendingUp, Calendar, Clock } from 'lucide-react';
import type { RevenueSummaryData } from '@/lib/dashboard-types';
import { t } from '@/lib/i18n';

interface RevenueSummaryWidgetProps {
  data?: RevenueSummaryData;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefresh?: () => void;
  onRetry?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

function RevenueSummaryWidget({ data, isLoading, isError, error, onRefresh, onRetry }: RevenueSummaryWidgetProps) {
  const isEmpty = !data || (data.today === 0 && data.thisWeek === 0 && data.thisMonth === 0);

  return (
    <DashboardWidget
      title={t('Revenue Summary')}
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      error={error}
      emptyMessage={t('Revenue data coming soon')}
      onRefresh={onRefresh}
      onRetry={onRetry}
    >
      {data && !isEmpty && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatCurrency(data.today)}</span>
            <span className="text-xs text-muted-foreground">{t('today')}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t('This Week')}</span>
              </div>
              <span className="text-sm font-medium">{formatCurrency(data.thisWeek)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t('This Month')}</span>
              </div>
              <span className="text-sm font-medium">{formatCurrency(data.thisMonth)}</span>
            </div>
          </div>
        </div>
      )}
      {isEmpty && !isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t('Connect payment provider to see revenue')}</p>
          </div>
        </div>
      )}
    </DashboardWidget>
  );
}

export { RevenueSummaryWidget };
