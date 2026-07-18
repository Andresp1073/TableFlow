import { t } from '@/lib/i18n';
import type { DiningAreaStatus } from '@/lib/dining-area-types';
import { Badge } from '@/components/ui/badge';

const STATUS_VARIANTS: Record<DiningAreaStatus, 'success' | 'warning' | 'danger' | 'info' | 'default' | 'secondary'> = {
  active: 'success',
  archived: 'default',
};

export function DiningAreaStatusBadge({ status }: { status: DiningAreaStatus }) {
  const variant = STATUS_VARIANTS[status] ?? 'default';
  return <Badge variant={variant}>{t(status.charAt(0).toUpperCase() + status.slice(1))}</Badge>;
}
