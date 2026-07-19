'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRestaurant } from '@/providers/restaurant-provider';
import { get } from '@/services/api';
import { t } from '@/lib/i18n';
import { ExportButton } from '@/components/analytics/export-button';
import type { ExportConfig } from '@/lib/analytics-types';
import { REPORT_META } from '@/lib/analytics-types';

const BASE = '/restaurants';

interface ExportableReport {
  key: string;
  meta: { title: string; description: string; category: string; icon: string };
  getData: (restaurantId: string) => Promise<Record<string, unknown>[]>;
  columns: { key: string; label: string }[];
}

const EXPORTABLE_REPORTS: ExportableReport[] = [
  {
    key: 'executive',
    meta: REPORT_META['executive']!,
    getData: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await get(`${BASE}/${id}/dashboard`) as any;
      const d = res.data;
      return [{
        'Total Revenue': d?.revenueSummary?.today ?? 0,
        'This Week Revenue': d?.revenueSummary?.thisWeek ?? 0,
        'This Month Revenue': d?.revenueSummary?.thisMonth ?? 0,
        'Today Reservations': d?.todayReservations?.total ?? 0,
        'Occupancy Rate': `${d?.currentOccupancy?.occupancyRate ?? 0}%`,
        'Total Customers': d?.quickStatistics?.totalCustomers ?? 0,
        'Avg Party Size': d?.quickStatistics?.averagePartySize ?? 0,
      }];
    },
    columns: [
      { key: 'Total Revenue', label: t('Total Revenue') },
      { key: 'This Week Revenue', label: t('This Week Revenue') },
      { key: 'This Month Revenue', label: t('This Month Revenue') },
      { key: 'Today Reservations', label: t('Today Reservations') },
      { key: 'Occupancy Rate', label: t('Occupancy Rate') },
      { key: 'Total Customers', label: t('Total Customers') },
      { key: 'Avg Party Size', label: t('Avg Party Size') },
    ],
  },
  {
    key: 'sales',
    meta: REPORT_META['sales']!,
    getData: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await get(`${BASE}/${id}/orders?limit=500`) as any;
      return (res.data as any[]).map((o: any) => ({
        ID: o.id,
        Status: o.status,
        Total: o.total,
        Items: (o.items as any[])?.length ?? 0,
        Created: o.createdAt,
      }));
    },
    columns: [
      { key: 'ID', label: t('Order ID') },
      { key: 'Status', label: t('Status') },
      { key: 'Total', label: t('Total') },
      { key: 'Items', label: t('Items') },
      { key: 'Created', label: t('Created') },
    ],
  },
  {
    key: 'reservations',
    meta: REPORT_META['reservations']!,
    getData: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await get(`${BASE}/${id}/reservations?limit=500`) as any;
      return (res.data as any[]).map((r: any) => ({
        Customer: r.customerName,
        'Party Size': r.partySize,
        Status: r.status,
        Time: r.startTime,
        Table: r.tableNumber,
      }));
    },
    columns: [
      { key: 'Customer', label: t('Customer') },
      { key: 'Party Size', label: t('Party Size') },
      { key: 'Status', label: t('Status') },
      { key: 'Time', label: t('Time') },
      { key: 'Table', label: t('Table') },
    ],
  },
  {
    key: 'inventory',
    meta: REPORT_META['inventory']!,
    getData: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await get(`${BASE}/${id}/inventory/products?page=1&limit=500`) as any;
      return (res.data as any[]).map((p: any) => ({
        Name: p.name,
        Category: p.category,
        'Stock Level': p.currentStock,
        'Cost/Unit': p.costPerUnit,
        Unit: p.unit,
      }));
    },
    columns: [
      { key: 'Name', label: t('Name') },
      { key: 'Category', label: t('Category') },
      { key: 'Stock Level', label: t('Stock Level') },
      { key: 'Cost/Unit', label: t('Cost/Unit') },
      { key: 'Unit', label: t('Unit') },
    ],
  },
  {
    key: 'customers',
    meta: REPORT_META['customers']!,
    getData: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await get(`${BASE}/${id}/customers?page=1&limit=500`) as any;
      return (res.data as any[]).map((c: any) => ({
        Name: `${c.firstName} ${c.lastName}`,
        Email: c.email,
        Phone: c.phone,
        Visits: c.totalVisits,
        'Total Spent': c.totalSpent,
        VIP: c.isVip ? 'Yes' : 'No',
      }));
    },
    columns: [
      { key: 'Name', label: t('Name') },
      { key: 'Email', label: t('Email') },
      { key: 'Phone', label: t('Phone') },
      { key: 'Visits', label: t('Visits') },
      { key: 'Total Spent', label: t('Total Spent') },
      { key: 'VIP', label: t('VIP') },
    ],
  },
  {
    key: 'audit',
    meta: REPORT_META['audit']!,
    getData: async (_id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await get('/audit?limit=500') as any;
      return (res.data as any[]).map((e: any) => ({
        Action: e.action,
        Entity: e.entity,
        User: e.userName,
        Severity: e.severity,
        Time: e.createdAt,
      }));
    },
    columns: [
      { key: 'Action', label: t('Action') },
      { key: 'Entity', label: t('Entity') },
      { key: 'User', label: t('User') },
      { key: 'Severity', label: t('Severity') },
      { key: 'Time', label: t('Time') },
    ],
  },
];

export function ExportCenterContent() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => EXPORTABLE_REPORTS.filter((r) => r.meta.title.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('Search reports...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            aria-label={t('Search reports')}
          />
        </div>
        <span className="text-sm text-muted-foreground">{t('{count} reports', { count: filtered.length })}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((report) => (
          <ReportExportCard key={report.key} report={report} restaurantId={restaurantId} />
        ))}
      </div>

      {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {t('No reports match your search.')}
          </div>
      )}
    </div>
  );
}

function ReportExportCard({ report, restaurantId }: { report: ExportableReport; restaurantId: string }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['export', report.key, restaurantId],
    queryFn: () => report.getData(restaurantId),
    staleTime: 60_000,
  });

  const exportConfig: ExportConfig = {
    filename: `${report.meta.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}`,
    format: 'csv',
    data: (data ?? []) as Record<string, unknown>[],
    columns: report.columns,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{t(report.meta.title)}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{t(report.meta.description)}</p>
          </div>
          <Badge variant="outline" className="text-xs">{t('{count} columns', { count: report.columns.length })}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          {isLoading ? t('Loading data...') : t('{count} records available', { count: exportConfig.data.length })}
        </p>
        <div className="flex gap-2">
          <ExportButton config={exportConfig} size="sm" label={t('CSV')} />
          <ExportButton config={{ ...exportConfig, format: 'json' }} size="sm" label={t('JSON')} />
          <Button variant="outline" size="sm" onClick={() => {
            const w = window.open('', '_blank');
            if (w) {
              w.document.write(`<html><head><title>${t('Loading...')}</title></head><body><p>${t('Loading...')}</p></body></html>`);
              w.document.close();
              refetch().then((result) => {
                const html = `
                  <html>
                    <head><title>${t(report.meta.title)}</title></head>
                    <body>
                      <h1>${t(report.meta.title)}</h1>
                      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:system-ui;">
                        <thead>
                          <tr>${report.columns.map((c) => `<th style="background:#f5f5f5;text-align:left;">${c.label}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                          ${(result.data ?? []).map((row: Record<string, unknown>) =>
                            `<tr>${report.columns.map((c) => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`
                          ).join('')}
                        </tbody>
                      </table>
                    </body>
                  </html>
                `;
                w.document.write(html);
                w.document.close();
                w.focus();
                setTimeout(() => w.print(), 250);
              });
            }
          }}>
            {t('Print')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
