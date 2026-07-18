'use client';

import { Badge } from '@/components/ui/badge';
import { getCustomerStatusColor } from '@/lib/customer-types';
import type { CustomerStatus } from '@/lib/customer-types';

interface StatusBadgeProps {
  status: CustomerStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={getCustomerStatusColor(status)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
