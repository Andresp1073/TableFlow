'use client';

import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@/lib/sales-types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANTS } from '@/lib/sales-types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge variant={ORDER_STATUS_VARIANTS[status] ?? 'default'}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
