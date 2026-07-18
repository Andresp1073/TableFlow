'use client';

import { useState, useCallback } from 'react';
import { ExecutiveDashboardContent } from '@/components/analytics/executive-dashboard';
import { ReportFilters } from '@/components/analytics/report-filters';
import { ExportButton } from '@/components/analytics/export-button';
import type { DateRange, ExportConfig } from '@/lib/analytics-types';
import { getDateRangeFromPreset } from '@/lib/analytics-types';

export default function ExecutiveDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPreset('thisMonth'));

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const exportConfig: ExportConfig = {
    filename: `executive-dashboard-${new Date().toISOString().slice(0, 10)}`,
    format: 'csv',
    data: [],
    columns: [
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">High-level business performance overview.</p>
        </div>
        <ExportButton config={exportConfig} label="Export" />
      </div>
      <ReportFilters onDateRangeChange={handleDateRangeChange} />
      <ExecutiveDashboardContent dateRange={dateRange} />
    </div>
  );
}
