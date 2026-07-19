'use client';

import { CalendarCheck, XCircle, EyeOff, CheckCircle2, Users, Percent } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { ReportChart } from '@/components/analytics/report-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReservationReport } from '@/hooks/use-analytics';
import type { DateRange } from '@/lib/analytics-types';
import { t } from '@/lib/i18n';

interface ReservationReportContentProps {
  dateRange?: DateRange;
}

export function ReservationReportContent({ dateRange }: ReservationReportContentProps) {
  const { data, isLoading, error, refetch } = useReservationReport(dateRange);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="text-sm">{t('Failed to load report')}</p>
        <button onClick={() => refetch()} className="text-sm underline mt-2">{t('Retry')}</button>
      </div>
    );
  }

  const avgParty = data?.summary.averagePartySize?.toFixed(1) ?? '0';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title={t('Total Reservations')} value={data?.summary.totalReservations ?? 0} icon={<CalendarCheck className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Confirmed')} value={data?.summary.confirmed ?? 0} icon={<CheckCircle2 className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Cancelled')} value={data?.summary.cancelled ?? 0} icon={<XCircle className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('No Shows')} value={data?.summary.noShows ?? 0} icon={<EyeOff className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Avg Party Size')} value={avgParty} icon={<Users className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Cancel Rate')} value={data?.summary.cancellationRate ? `${data.summary.cancellationRate.toFixed(1)}%` : '0%'} icon={<Percent className="h-4 w-4" />} loading={isLoading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportChart title={t('Reservations by Period')} type="bar" data={data?.reservationsByPeriod ?? []} loading={isLoading} height={280} />
        <ReportChart title={t('Reservation Status')} type="pie" data={data?.reservationsByStatus ?? []} loading={isLoading} height={280} />
        <ReportChart title={t('Reservations by Hour')} type="line" data={data?.reservationsByHour ?? []} loading={isLoading} height={280} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Peak Hours')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
            ) : (
              <div className="space-y-2">
                {data?.peakHours.map((ph, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{ph.hour}</span>
                    <span className="text-muted-foreground">{ph.count} {t('reservations')}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Table Utilization by Area')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
            ) : (
              <div className="space-y-3">
                {data?.tableUtilization.map((tu, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{tu.name}</span>
                      <span className="text-muted-foreground">{tu.utilizationRate.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${tu.utilizationRate}%` }} />
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
