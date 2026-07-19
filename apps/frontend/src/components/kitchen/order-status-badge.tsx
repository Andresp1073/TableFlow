'use client';

import type { TicketStatus } from '@/lib/order-types';
import { TICKET_STATUS_VARIANTS, TICKET_STATUS_LABELS } from '@/lib/order-types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface OrderStatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OrderStatusBadge({ status, size = 'md', className }: OrderStatusBadgeProps) {
  const variant = TICKET_STATUS_VARIANTS[status] ?? 'default';
  const label = TICKET_STATUS_LABELS[status] ?? status;
  return (
    <Badge
      variant={variant}
      size={size}
      className={cn('uppercase tracking-wider font-bold', className)}
      aria-label={t('Order status: {status}', { status: t(label) })}
    >
      {t(label)}
    </Badge>
  );
}

interface OrderStatusIndicatorProps {
  status: TicketStatus;
  className?: string;
}

const STATUS_DOT_COLORS: Record<TicketStatus, string> = {
  new: 'bg-warning',
  accepted: 'bg-info',
  preparing: 'bg-info',
  ready: 'bg-success',
  delivered: 'bg-muted-foreground',
  cancelled: 'bg-destructive',
};

export function OrderStatusDot({ status, className }: OrderStatusIndicatorProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-hidden="true"
    >
      <span className={cn('h-2 w-2 rounded-full shrink-0', STATUS_DOT_COLORS[status])} />
      {t(TICKET_STATUS_LABELS[status])}
    </span>
  );
}
