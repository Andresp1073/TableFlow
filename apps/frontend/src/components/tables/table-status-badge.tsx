import type { TableStatus } from '@/lib/table-types';
import { TABLE_STATUS_VARIANTS, TABLE_STATUS_LABELS } from '@/lib/table-types';
import { Badge } from '@/components/ui/badge';

export function TableStatusBadge({ status }: { status: TableStatus }) {
  const variant = TABLE_STATUS_VARIANTS[status] ?? 'default';
  const label = TABLE_STATUS_LABELS[status] ?? status;
  return <Badge variant={variant}>{label}</Badge>;
}

export function TableStatusBadgeSmall({ status }: { status: TableStatus }) {
  const label = TABLE_STATUS_LABELS[status] ?? status;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium"
      aria-label={`Status: ${label}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: `var(--table-status-${status})` }}
      />
      {label}
    </span>
  );
}
