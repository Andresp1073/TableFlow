'use client';

import { useState, useCallback } from 'react';
import { FinancialReportContent } from '@/components/analytics/financial-report-content';
import { ReportLayout } from '@/components/analytics/report-layout';
import type { DateRange } from '@/lib/analytics-types';
import { getDateRangeFromPreset } from '@/lib/analytics-types';
import { t } from '@/lib/i18n';

export default function FinancialReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPreset('thisMonth'));

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <ReportLayout
      title={t('Financial Report')}
      description={t('Revenue breakdown, taxes, discounts, refunds, and payment method analysis.')}
      onDateRangeChange={handleDateRangeChange}
    >
      <FinancialReportContent dateRange={dateRange} />
    </ReportLayout>
  );
}
