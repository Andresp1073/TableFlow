import { CreditCard } from 'lucide-react';
import { PlaceholderPage } from '@/app/(protected)/placeholder-page';

export default function PaymentsPage() {
  return (
    <PlaceholderPage
      title="Payments"
      description="Manage payment processing, transactions, and refunds."
      icon={<CreditCard className="h-5 w-5" />}
    />
  );
}
