'use client';

import { useState, useCallback } from 'react';
import { ReservationReportContent } from '@/components/analytics/reservation-report-content';
import { ReportLayout } from '@/components/analytics/report-layout';
import type { DateRange } from '@/lib/analytics-types';
import { getDateRangeFromPreset } from '@/lib/analytics-types';

export default function ReservationReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPreset('thisMonth'));

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <ReportLayout
      title="Reservation Report"
      description="Reservation trends, cancellations, no-shows, and table utilization."
      onDateRangeChange={handleDateRangeChange}
    >
      <ReservationReportContent dateRange={dateRange} />
    </ReportLayout>
  );
}
