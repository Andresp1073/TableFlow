'use client';

import { Shield, AlertTriangle, AlertCircle, Info, Users, Clock } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { ReportChart } from '@/components/analytics/report-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuditReport } from '@/hooks/use-analytics';
import type { DateRange } from '@/lib/analytics-types';
import { t } from '@/lib/i18n';

interface AuditReportContentProps {
  dateRange?: DateRange;
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    info: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors[severity] ?? colors['info']}`}>
      {severity}
    </span>
  );
}

export function AuditReportContent({ dateRange }: AuditReportContentProps) {
  const { data, isLoading, error, refetch } = useAuditReport(dateRange);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="text-sm">{t('Failed to load audit data')}</p>
        <button onClick={() => refetch()} className="text-sm underline mt-2">{t('Retry')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title={t('Total Events')} value={data?.summary.totalEvents ?? 0} icon={<Shield className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Critical')} value={data?.summary.criticalEvents ?? 0} icon={<AlertTriangle className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Warnings')} value={data?.summary.warningEvents ?? 0} icon={<AlertCircle className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Info')} value={data?.summary.infoEvents ?? 0} icon={<Info className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Unique Users')} value={data?.summary.uniqueUsers ?? 0} icon={<Users className="h-4 w-4" />} loading={isLoading} />
        <StatCard title={t('Period')} value={data?.summary.timeRange ?? '-'} icon={<Clock className="h-4 w-4" />} loading={isLoading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportChart title={t('Events by Period')} type="bar" data={data?.eventsByPeriod ?? []} loading={isLoading} height={280} />
        <ReportChart title={t('Events by Severity')} type="pie" data={data?.eventsBySeverity ?? []} loading={isLoading} height={280} />
        <ReportChart title={t('Events by Entity')} type="pie" data={data?.eventsByEntity ?? []} loading={isLoading} height={280} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t('Recent Events')}</CardTitle>
          <span className="text-xs text-muted-foreground">{t('Showing up to 20 most recent')}</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
          ) : !data?.recentEvents.length ? (
              <p className="text-sm text-muted-foreground">{t('No events found.')}</p>
          ) : (
            <div className="space-y-2">
              {data.recentEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 text-sm">
                  <SeverityBadge severity={event.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">
                      <span className="font-medium">{event.userName}</span>
                      {' '}{event.action}{' '}
                      <span className="text-muted-foreground">{event.entity}</span>
                    </p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Top Active Users')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
            ) : !data?.topUsers.length ? (
              <p className="text-sm text-muted-foreground">{t('No user activity data.')}</p>
            ) : (
              <div className="space-y-2">
                {data.topUsers.map((user, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.userName}</span>
                    </div>
                    <span className="text-muted-foreground">{user.eventCount} {t('events')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
