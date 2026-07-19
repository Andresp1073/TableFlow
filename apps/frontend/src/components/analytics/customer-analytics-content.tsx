'use client';

import { Users, UserPlus, UserCheck, Award, DollarSign, Star, Gift, TrendingUp, TrendingDown } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { ReportChart } from '@/components/analytics/report-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomerAnalytics } from '@/hooks/use-analytics';
import { formatCurrency } from '@/lib/analytics-types';
import { t } from '@/lib/i18n';
import type { DateRange } from '@/lib/analytics-types';

interface CustomerAnalyticsContentProps {
  dateRange?: DateRange;
}

export function CustomerAnalyticsContent({ dateRange }: CustomerAnalyticsContentProps) {
  const { data, isLoading, error, refetch } = useCustomerAnalytics(dateRange);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="text-sm">{t('Failed to load customer data')}</p>
        <button onClick={() => refetch()} className="text-sm underline mt-2">{t('Retry')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title={t('Total Customers')} value={data?.summary.totalCustomers ?? 0} icon={<Users className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('New Customers')} value={data?.summary.newCustomers ?? 0} icon={<UserPlus className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Returning')} value={data?.summary.returningCustomers ?? 0} icon={<UserCheck className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('VIP')} value={data?.summary.vipCustomers ?? 0} icon={<Award className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Avg LTV')} value={formatCurrency(data?.summary.averageCustomerLifetimeValue ?? 0)} icon={<DollarSign className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Avg Visits')} value={data?.summary.averageVisitsPerCustomer?.toFixed(1) ?? '0'} icon={<Star className="h-4 w-4" />} loading={isLoading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportChart title={t('Customers by Period')} type="area" data={data?.customersByPeriod ?? []} loading={isLoading} height={280} />
        <ReportChart title={t('Customer Status')} type="pie" data={data?.customersByStatus ?? []} loading={isLoading} height={280} />
        <ReportChart title={t('Spending Segments')} type="pie" data={data?.spendingSegments ?? []} loading={isLoading} height={280} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Top Customers by Spending')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
            ) : !data?.topCustomers.length ? (
              <p className="text-sm text-muted-foreground">{t('No customer data available.')}</p>
            ) : (
              <div className="space-y-2">
                {data.topCustomers.map((customer, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{customer.name}</p>
                       <p className="text-xs text-muted-foreground">{customer.visits} {t('visits')}</p>
                    </div>
                    <span className="font-medium ml-2">{formatCurrency(customer.totalSpent)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-6">
          <ReportChart title={t('Loyalty Activity')} type="bar" data={data?.loyaltyActivity ?? []} loading={isLoading} height={200} />
          <ReportChart title={t('Visits by Day of Week')} type="bar" data={data?.visitsByDayOfWeek ?? []} loading={isLoading} height={200} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title={t('Loyalty Members')} value={data?.summary.loyaltyMembers ?? 0} icon={<Gift className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Points Earned')} value={data?.summary.totalPointsEarned?.toLocaleString() ?? '0'} icon={<TrendingUp className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Points Redeemed')} value={data?.summary.totalPointsRedeemed?.toLocaleString() ?? '0'} icon={<TrendingDown className="h-4 w-4" />} loading={isLoading} />
      </div>
    </div>
  );
}
