'use client';

import { useState, useCallback } from 'react';
import { CustomerAnalyticsContent } from '@/components/analytics/customer-analytics-content';
import { ReportLayout } from '@/components/analytics/report-layout';
import type { DateRange } from '@/lib/analytics-types';
import { getDateRangeFromPreset } from '@/lib/analytics-types';

export default function CustomerAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPreset('thisMonth'));

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <ReportLayout
      title="Customer Analytics"
      description="Customer behavior, segments, loyalty activity, and spending analysis."
      onDateRangeChange={handleDateRangeChange}
    >
      <CustomerAnalyticsContent dateRange={dateRange} />
    </ReportLayout>
  );
}
