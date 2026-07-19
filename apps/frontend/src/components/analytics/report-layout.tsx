'use client';

import { ReportFilters } from '@/components/analytics/report-filters';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { t } from '@/lib/i18n';
import type { DateRange, DateRangePreset } from '@/lib/analytics-types';

interface ReportLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onDateRangeChange?: (range: DateRange) => void;
  defaultPreset?: DateRangePreset;
  filters?: React.ReactNode;
}

export function ReportLayout({
  title,
  description,
  children,
  loading = false,
  error = null,
  onRetry,
  onDateRangeChange,
  defaultPreset,
  filters,
}: ReportLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onDateRangeChange && <ReportFilters onDateRangeChange={onDateRangeChange} defaultPreset={defaultPreset} />}
      {filters}
      {error ? (
        <ErrorState
          title={t('Failed to load report')}
          message={error.message}
          onRetry={onRetry}
        />
      ) : loading ? (
        <LoadingState />
      ) : (
        children
      )}
    </div>
  );
}
