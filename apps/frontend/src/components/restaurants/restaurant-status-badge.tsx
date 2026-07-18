import { t } from '@/lib/i18n';
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
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant={variant}>{t(label)}</Badge>;
}
