'use client';

import { DollarSign, Percent, Tag, TrendingUp, CreditCard, Wallet } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { ReportChart } from '@/components/analytics/report-chart';
import { Card, CardContent } from '@/components/ui/card';
import { useFinancialReport } from '@/hooks/use-analytics';
import { formatCurrency } from '@/lib/analytics-types';
import type { DateRange } from '@/lib/analytics-types';

interface FinancialReportContentProps {
  dateRange?: DateRange;
}

export function FinancialReportContent({ dateRange }: FinancialReportContentProps) {
  const { data, isLoading, error, refetch } = useFinancialReport(dateRange);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="text-sm">Failed to load financial data</p>
        <button onClick={() => refetch()} className="text-sm underline mt-2">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Total Revenue" value={formatCurrency(data?.summary.totalRevenue ?? 0)} icon={<DollarSign className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Net Revenue" value={formatCurrency(data?.summary.netRevenue ?? 0)} icon={<TrendingUp className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Taxes" value={formatCurrency(data?.summary.totalTaxes ?? 0)} icon={<Percent className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Discounts" value={formatCurrency(data?.summary.totalDiscounts ?? 0)} icon={<Tag className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Avg Transaction" value={formatCurrency(data?.summary.averageTransactionValue ?? 0)} icon={<Wallet className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Card Revenue" value={formatCurrency(data?.summary.cardRevenue ?? 0)} icon={<CreditCard className="h-4 w-4" />} loading={isLoading} />
      </div>

      <div className="grid gap-4 text-sm">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Cash: {formatCurrency(data?.summary.cashRevenue ?? 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span>Card: {formatCurrency(data?.summary.cardRevenue ?? 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span>Other: {formatCurrency(data?.summary.otherRevenue ?? 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>Refunds: {formatCurrency(data?.summary.totalRefunds ?? 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportChart title="Revenue by Period" type="area" data={data?.revenueByPeriod ?? []} loading={isLoading} height={280} />
        <ReportChart title="Revenue by Payment Method" type="pie" data={data?.revenueByPaymentMethod ?? []} loading={isLoading} height={280} />
        <ReportChart title="Revenue vs Target" type="bar" data={data?.revenueVsTarget?.map(p => ({ label: p.label, value: p.value, secondary: p.secondary })) ?? []} loading={isLoading} secondaryDataKey="secondary" height={280} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <ReportChart title="Discounts by Period" type="bar" data={data?.discountsByPeriod ?? []} loading={isLoading} height={250} />
        <ReportChart title="Refunds by Period" type="bar" data={data?.refundsByPeriod ?? []} loading={isLoading} height={250} />
        <ReportChart title="Taxes by Period" type="bar" data={data?.taxesByPeriod ?? []} loading={isLoading} height={250} />
      </div>
    </div>
  );
}
