'use client';

import { useState, useCallback } from 'react';
import { SalesReportContent } from '@/components/analytics/sales-report-content';
import { ReportLayout } from '@/components/analytics/report-layout';
import type { DateRange } from '@/lib/analytics-types';
import { getDateRangeFromPreset } from '@/lib/analytics-types';

export default function SalesReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPreset('thisMonth'));

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <ReportLayout
      title="Sales Report"
      description="Revenue, orders, and sales performance analysis."
      onDateRangeChange={handleDateRangeChange}
    >
      <SalesReportContent dateRange={dateRange} />
    </ReportLayout>
  );
}
