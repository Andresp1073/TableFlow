'use client';

import { TrendingUp, ShoppingCart, DollarSign, Ban, RotateCcw } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { ReportChart } from '@/components/analytics/report-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSalesReport } from '@/hooks/use-analytics';
import type { DateRange } from '@/lib/analytics-types';

interface SalesReportContentProps {
  dateRange?: DateRange;
}

export function SalesReportContent({ dateRange }: SalesReportContentProps) {
  const { data, isLoading, error, refetch } = useSalesReport(dateRange);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="text-sm">Failed to load sales report</p>
        <button onClick={() => refetch()} className="text-sm underline mt-2">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard title="Total Revenue" value={data?.summary.totalRevenue ? `$${data.summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0'} icon={<TrendingUp className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Total Orders" value={data?.summary.totalOrders ?? 0} icon={<ShoppingCart className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Avg Order Value" value={data?.summary.averageOrderValue ? `$${data.summary.averageOrderValue.toFixed(2)}` : '$0'} icon={<DollarSign className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Cancelled" value={data?.summary.cancelledOrders ?? 0} icon={<Ban className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Refunded" value={data?.summary.refundedAmount ? `$${data.summary.refundedAmount.toFixed(2)}` : '$0'} icon={<RotateCcw className="h-4 w-4" />} loading={isLoading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportChart title="Revenue by Period" type="area" data={data?.revenueByPeriod ?? []} loading={isLoading} height={280} />
        <ReportChart title="Orders by Period" type="bar" data={data?.ordersByPeriod ?? []} loading={isLoading} height={280} />
        <ReportChart title="Revenue by Payment Method" type="pie" data={data?.revenueByPaymentMethod ?? []} loading={isLoading} height={280} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
            ) : !data?.topSellingItems.length ? (
              <p className="text-sm text-muted-foreground">No sales data available.</p>
            ) : (
              <div className="space-y-2">
                {data.topSellingItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate flex-1">{item.name}</span>
                    <span className="text-muted-foreground ml-2">{item.quantity} sold — ${item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <ReportChart title="Sales by Hour" type="bar" data={data?.salesByHour ?? []} loading={isLoading} height={340} />
      </div>
    </div>
  );
}
