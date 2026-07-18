import { METHOD_TYPE_LABELS } from '@/lib/payment-types';
import { Badge } from '@/components/ui/badge';

export function PaymentMethodBadge({ method }: { method: string }) {
  const label = METHOD_TYPE_LABELS[method] ?? method;
  return <Badge variant="secondary">{label}</Badge>;
}
