'use client';

import { ChefHat, Clock, CheckCircle2, AlertTriangle, Timer, Percent } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { ReportChart } from '@/components/analytics/report-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKitchenPerformance } from '@/hooks/use-analytics';
import type { DateRange } from '@/lib/analytics-types';
import { t } from '@/lib/i18n';

interface KitchenPerformanceContentProps {
  dateRange?: DateRange;
}

export function KitchenPerformanceContent({ dateRange }: KitchenPerformanceContentProps) {
  const { data, isLoading, error, refetch } = useKitchenPerformance(dateRange);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="text-sm">{t('Failed to load kitchen data')}</p>
        <button onClick={() => refetch()} className="text-sm underline mt-2">{t('Retry')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title={t('Total Tickets')} value={data?.summary.totalTickets ?? 0} icon={<ChefHat className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Completed')} value={data?.summary.completedTickets ?? 0} icon={<CheckCircle2 className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('In Progress')} value={data?.summary.preparingTickets ?? 0} icon={<Clock className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Delayed')} value={data?.summary.delayedTickets ?? 0} icon={<AlertTriangle className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Avg Prep Time')} value={data?.summary.averagePrepTime ? `${data.summary.averagePrepTime} min` : '0 min'} icon={<Timer className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('On-Time Rate')} value={data?.summary.onTimeRate ? `${data.summary.onTimeRate.toFixed(1)}%` : '0%'} icon={<Percent className="h-4 w-4" />} loading={isLoading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportChart title={t('Tickets by Period')} type="bar" data={data?.ticketsByPeriod ?? []} loading={isLoading} height={280} />
        <ReportChart title={t('Tickets by Station')} type="pie" data={data?.ticketsByStation ?? []} loading={isLoading} height={280} />
        <ReportChart title={t('Avg Prep Time by Station (min)')} type="bar" data={data?.averagePrepTimeByStation ?? []} loading={isLoading} height={280} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ReportChart title={t('Performance Trend (% On-Time)')} type="line" data={data?.performanceTrend ?? []} loading={isLoading} height={280} />
        {data?.delayedOrders && data.delayedOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Delayed Orders')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.delayedOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{order.items}</p>
                      <p className="text-xs text-muted-foreground">{order.station} — {order.elapsedTime} {t('min elapsed')}</p>
                    </div>
                    <span className="text-destructive font-medium">{order.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
