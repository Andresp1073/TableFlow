'use client';

import { useState, useCallback } from 'react';
import { AuditReportContent } from '@/components/analytics/audit-report-content';
import { ReportLayout } from '@/components/analytics/report-layout';
import type { DateRange } from '@/lib/analytics-types';
import { getDateRangeFromPreset } from '@/lib/analytics-types';
import { t } from '@/lib/i18n';

export default function AuditReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPreset('thisMonth'));

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <ReportLayout
      title={t('Audit Report')}
      description={t('Security events, user activity, and system changes.')}
      onDateRangeChange={handleDateRangeChange}
    >
      <AuditReportContent dateRange={dateRange} />
    </ReportLayout>
  );
}
