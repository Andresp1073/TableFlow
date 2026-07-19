import { t } from '@/lib/i18n';
import type { ReservationStatus } from '@/lib/reservation-types';
import { RESERVATION_STATUS_VARIANTS, RESERVATION_STATUS_LABELS } from '@/lib/reservation-types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ReservationStatusBadge({
  status,
  size = 'md',
  className,
}: ReservationStatusBadgeProps) {
  const variant = RESERVATION_STATUS_VARIANTS[status] ?? 'default';
  const label = RESERVATION_STATUS_LABELS[status] ?? status;
  return (
    <Badge variant={variant} size={size} className={className} aria-label={t('Status: {status}', { status: t(label) })}>
      {t(label)}
    </Badge>
  );
}

interface ReservationStatusDotProps {
  status: ReservationStatus;
  className?: string;
}

const STATUS_DOT_COLORS: Record<ReservationStatus, string> = {
  pending: 'bg-warning',
  confirmed: 'bg-info',
  checked_in: 'bg-info',
  seated: 'bg-info',
  completed: 'bg-success',
  cancelled: 'bg-muted-foreground',
  no_show: 'bg-destructive',
};

export function ReservationStatusDot({ status, className }: ReservationStatusDotProps) {
  const label = RESERVATION_STATUS_LABELS[status] ?? status;
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}
      aria-label={t('Status: {status}', { status: t(label) })}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full shrink-0', STATUS_DOT_COLORS[status])}
        aria-hidden="true"
      />
      {t(label)}
    </span>
  );
}
