'use client';

import { ExportCenterContent } from '@/components/analytics/export-center-content';

export default function ExportCenterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Export Center</h1>
        <p className="text-sm text-muted-foreground">
          Export reports as CSV, JSON, or print-friendly views.
        </p>
      </div>
      <ExportCenterContent />
    </div>
  );
}
