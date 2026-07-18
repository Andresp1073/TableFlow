import type { PaymentTransactionStatus } from '@/lib/payment-types';
import { TRANSACTION_STATUS_VARIANTS, TRANSACTION_STATUS_LABELS } from '@/lib/payment-types';
import { Badge } from '@/components/ui/badge';

export function PaymentStatusBadge({ status }: { status: PaymentTransactionStatus }) {
  const variant = TRANSACTION_STATUS_VARIANTS[status] ?? 'default';
  const label = TRANSACTION_STATUS_LABELS[status] ?? status;
  return <Badge variant={variant}>{label}</Badge>;
}
