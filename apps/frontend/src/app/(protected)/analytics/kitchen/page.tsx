'use client';

import { useState, useCallback } from 'react';
import { KitchenPerformanceContent } from '@/components/analytics/kitchen-performance-content';
import { ReportLayout } from '@/components/analytics/report-layout';
import type { DateRange } from '@/lib/analytics-types';
import { getDateRangeFromPreset } from '@/lib/analytics-types';
import { t } from '@/lib/i18n';

export default function KitchenPerformancePage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPreset('thisWeek'));

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <ReportLayout
      title={t('Kitchen Performance')}
      description={t('Ticket times, station performance, and delay analysis.')}
      onDateRangeChange={handleDateRangeChange}
    >
      <KitchenPerformanceContent dateRange={dateRange} />
    </ReportLayout>
  );
}
