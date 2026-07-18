'use client';

import { useState, useCallback } from 'react';
import { KitchenPerformanceContent } from '@/components/analytics/kitchen-performance-content';
import { ReportLayout } from '@/components/analytics/report-layout';
import type { DateRange } from '@/lib/analytics-types';
import { getDateRangeFromPreset } from '@/lib/analytics-types';

export default function KitchenPerformancePage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPreset('thisWeek'));

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <ReportLayout
      title="Kitchen Performance"
      description="Ticket times, station performance, and delay analysis."
      onDateRangeChange={handleDateRangeChange}
    >
      <KitchenPerformanceContent dateRange={dateRange} />
    </ReportLayout>
  );
}
