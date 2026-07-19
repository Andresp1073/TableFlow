'use client';

import { useState, useCallback } from 'react';
import { InventoryReportContent } from '@/components/analytics/inventory-report-content';
import { ReportLayout } from '@/components/analytics/report-layout';
import type { DateRange } from '@/lib/analytics-types';
import { getDateRangeFromPreset } from '@/lib/analytics-types';
import { t } from '@/lib/i18n';

export default function InventoryReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPreset('thisMonth'));

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <ReportLayout
      title={t('Inventory Report')}
      description={t('Stock levels, consumption trends, and valuation.')}
      onDateRangeChange={handleDateRangeChange}
    >
      <InventoryReportContent dateRange={dateRange} />
    </ReportLayout>
  );
}
