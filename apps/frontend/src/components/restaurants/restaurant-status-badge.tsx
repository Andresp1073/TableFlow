import type { RestaurantStatus } from '@/lib/restaurant-types';
import { Badge } from '@/components/ui/badge';

const STATUS_VARIANTS: Record<RestaurantStatus, 'success' | 'warning' | 'danger' | 'info' | 'default' | 'secondary'> = {
  active: 'success',
  pending: 'warning',
  draft: 'secondary',
  suspended: 'danger',
  inactive: 'warning',
  archived: 'default',
};

export function RestaurantStatusBadge({ status }: { status: RestaurantStatus }) {
  const variant = STATUS_VARIANTS[status] ?? 'default';
  return <Badge variant={variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}
