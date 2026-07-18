'use client';

import { useState, useCallback } from 'react';
import { OccupancyReportContent } from '@/components/analytics/occupancy-report-content';
import { ReportLayout } from '@/components/analytics/report-layout';
import type { DateRange } from '@/lib/analytics-types';
import { getDateRangeFromPreset } from '@/lib/analytics-types';

export default function OccupancyReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPreset('thisMonth'));

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <ReportLayout
      title="Occupancy Report"
      description="Table utilization rates, occupancy trends, and peak times."
      onDateRangeChange={handleDateRangeChange}
    >
      <OccupancyReportContent dateRange={dateRange} />
    </ReportLayout>
  );
}
