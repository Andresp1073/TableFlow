'use client';

import { ExportCenterContent } from '@/components/analytics/export-center-content';

import { t } from '@/lib/i18n';

export default function ExportCenterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('Export Center')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('Export reports as CSV, JSON, or print-friendly views.')}
        </p>
      </div>
      <ExportCenterContent />
    </div>
  );
}
