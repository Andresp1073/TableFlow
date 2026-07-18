'use client';

import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import { Badge } from '@/components/ui/badge';
import { Clock, XCircle, CheckCircle2, UserCheck, Ban } from 'lucide-react';
import type { TodayReservationsData } from '@/lib/dashboard-types';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface TodayReservationsWidgetProps {
  data?: TodayReservationsData;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefresh?: () => void;
  onRetry?: () => void;
}

const STATUS_ITEMS = [
  { key: 'confirmed' as const, label: t('Confirmed'), icon: CheckCircle2, color: 'text-primary' },
  { key: 'pending' as const, label: t('Pending'), icon: Clock, color: 'text-warning' },
  { key: 'seated' as const, label: t('Seated'), icon: UserCheck, color: 'text-success' },
  { key: 'completed' as const, label: t('Completed'), icon: CheckCircle2, color: 'text-muted-foreground' },
  { key: 'cancelled' as const, label: t('Cancelled'), icon: XCircle, color: 'text-destructive' },
  { key: 'noShow' as const, label: t('No Show'), icon: Ban, color: 'text-destructive' },
];

function TodayReservationsWidget({ data, isLoading, isError, error, onRefresh, onRetry }: TodayReservationsWidgetProps) {
  return (
    <DashboardWidget
      title={t("Today's Reservations")}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.total === 0}
      error={error}
      emptyMessage={t('No reservations today')}
      onRefresh={onRefresh}
      onRetry={onRetry}
    >
      {data && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{data.total}</span>
            <span className="text-xs text-muted-foreground">{t('total today')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_ITEMS.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="flex items-center gap-2">
                <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />
                <span className="text-xs text-muted-foreground flex-1">{label}</span>
                <Badge variant="secondary" className="text-xs font-mono">{data[key]}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardWidget>
  );
}

export { TodayReservationsWidget };
