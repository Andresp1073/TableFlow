'use client';

import { Table2, Users, TrendingUp, Building2 } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { ReportChart } from '@/components/analytics/report-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOccupancyReport } from '@/hooks/use-analytics';
import type { DateRange } from '@/lib/analytics-types';

interface OccupancyReportContentProps {
  dateRange?: DateRange;
}

export function OccupancyReportContent({ dateRange }: OccupancyReportContentProps) {
  const { data, isLoading, error, refetch } = useOccupancyReport(dateRange);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="text-sm">Failed to load report</p>
        <button onClick={() => refetch()} className="text-sm underline mt-2">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard title="Avg Occupancy" value={data?.summary.averageOccupancyRate ? `${data.summary.averageOccupancyRate.toFixed(1)}%` : '0%'} icon={<TrendingUp className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Peak Occupancy" value={data?.summary.peakOccupancyRate ? `${data.summary.peakOccupancyRate.toFixed(1)}%` : '0%'} icon={<TrendingUp className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Total Tables" value={data?.summary.totalTables ?? 0} icon={<Table2 className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Total Capacity" value={data?.summary.totalCapacity ?? 0} icon={<Users className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Avg Guests/Day" value={data?.summary.averageGuestsPerDay ?? 0} icon={<Building2 className="h-4 w-4" />} loading={isLoading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportChart title="Occupancy by Day" type="area" data={data?.occupancyByDay ?? []} loading={isLoading} height={280} />
        <ReportChart title="Occupancy by Hour" type="line" data={data?.occupancyByHour ?? []} loading={isLoading} height={280} />
        <ReportChart title="Occupancy by Area" type="bar" data={data?.occupancyByArea?.map(a => ({ label: a.area, value: Math.round(a.rate) })) ?? []} loading={isLoading} height={280} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Occupancy by Dining Area</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.occupancyByArea.map((area, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">{area.area}</p>
                    <p className="text-2xl font-bold">{area.rate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">{area.occupiedTables} of {area.totalTables} tables occupied</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Peak Times</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {data?.peakTimes.map((pt, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">{pt.dayOfWeek}</p>
                    <p className="text-xs text-muted-foreground">{pt.hour}</p>
                    <p className="text-2xl font-bold">{pt.occupancyRate.toFixed(0)}%</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
