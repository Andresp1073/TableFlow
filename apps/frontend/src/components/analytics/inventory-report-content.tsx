'use client';

import { Package, DollarSign, AlertTriangle, XCircle, ClipboardList, Trash2 } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { ReportChart } from '@/components/analytics/report-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInventoryReport } from '@/hooks/use-analytics';
import { formatCurrency } from '@/lib/analytics-types';
import { t } from '@/lib/i18n';
import type { DateRange } from '@/lib/analytics-types';

interface InventoryReportContentProps {
  dateRange?: DateRange;
}

export function InventoryReportContent({ dateRange }: InventoryReportContentProps) {
  const { data, isLoading, error, refetch } = useInventoryReport(dateRange);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="text-sm">{t('Failed to load report')}</p>
        <button onClick={() => refetch()} className="text-sm underline mt-2">{t('Retry')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title={t('Total Products')} value={data?.summary.totalProducts ?? 0} icon={<Package className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Stock Value')} value={formatCurrency(data?.summary.totalStockValue ?? 0)} icon={<DollarSign className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Low Stock')} value={data?.summary.lowStockItems ?? 0} icon={<AlertTriangle className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Out of Stock')} value={data?.summary.outOfStockItems ?? 0} icon={<XCircle className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Pending Orders')} value={data?.summary.pendingOrders ?? 0} icon={<ClipboardList className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Waste Value')} value={formatCurrency(data?.summary.wasteValue ?? 0)} icon={<Trash2 className="h-4 w-4" />} loading={isLoading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportChart title={t('Stock Value by Category')} type="pie" data={data?.stockValueByCategory ?? []} loading={isLoading} height={280} />
        <ReportChart title={t('Consumption by Period')} type="bar" data={data?.consumptionByPeriod ?? []} loading={isLoading} height={280} />
        <ReportChart title={t('Stock Movement History')} type="line" data={data?.movementHistory ?? []} loading={isLoading} height={280} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Top Consumed Items')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
            ) : !data?.topConsumedItems.length ? (
              <p className="text-sm text-muted-foreground">{t('No consumption data available.')}</p>
            ) : (
              <div className="space-y-2">
                {data.topConsumedItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate flex-1">{item.name}</span>
                    <span className="text-muted-foreground ml-2">{item.quantity} {t('units')} — {formatCurrency(item.cost)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Low Stock Alerts')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
            ) : !data?.lowStockAlerts.length ? (
              <p className="text-sm text-muted-foreground">{t('No low stock alerts.')}</p>
            ) : (
              <div className="space-y-3">
                {data.lowStockAlerts.map((alert, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{alert.name}</p>
                      <p className="text-xs text-muted-foreground">{t('Supplier:')} {alert.supplier}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className={`font-medium ${alert.currentStock <= alert.reorderLevel ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {alert.currentStock} / {alert.reorderLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
