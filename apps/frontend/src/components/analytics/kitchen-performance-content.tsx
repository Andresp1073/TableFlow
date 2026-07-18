'use client';

import { ChefHat, Clock, CheckCircle2, AlertTriangle, Timer, Percent } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { ReportChart } from '@/components/analytics/report-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKitchenPerformance } from '@/hooks/use-analytics';
import type { DateRange } from '@/lib/analytics-types';

interface KitchenPerformanceContentProps {
  dateRange?: DateRange;
}

export function KitchenPerformanceContent({ dateRange }: KitchenPerformanceContentProps) {
  const { data, isLoading, error, refetch } = useKitchenPerformance(dateRange);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="text-sm">Failed to load kitchen data</p>
        <button onClick={() => refetch()} className="text-sm underline mt-2">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Total Tickets" value={data?.summary.totalTickets ?? 0} icon={<ChefHat className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Completed" value={data?.summary.completedTickets ?? 0} icon={<CheckCircle2 className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="In Progress" value={data?.summary.preparingTickets ?? 0} icon={<Clock className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Delayed" value={data?.summary.delayedTickets ?? 0} icon={<AlertTriangle className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Avg Prep Time" value={data?.summary.averagePrepTime ? `${data.summary.averagePrepTime} min` : '0 min'} icon={<Timer className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="On-Time Rate" value={data?.summary.onTimeRate ? `${data.summary.onTimeRate.toFixed(1)}%` : '0%'} icon={<Percent className="h-4 w-4" />} loading={isLoading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportChart title="Tickets by Period" type="bar" data={data?.ticketsByPeriod ?? []} loading={isLoading} height={280} />
        <ReportChart title="Tickets by Station" type="pie" data={data?.ticketsByStation ?? []} loading={isLoading} height={280} />
        <ReportChart title="Avg Prep Time by Station (min)" type="bar" data={data?.averagePrepTimeByStation ?? []} loading={isLoading} height={280} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ReportChart title="Performance Trend (% On-Time)" type="line" data={data?.performanceTrend ?? []} loading={isLoading} height={280} />
        {data?.delayedOrders && data.delayedOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delayed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.delayedOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{order.items}</p>
                      <p className="text-xs text-muted-foreground">{order.station} — {order.elapsedTime} min elapsed</p>
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
