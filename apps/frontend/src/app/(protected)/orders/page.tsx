import { ShoppingCart } from 'lucide-react';
import { PlaceholderPage } from '@/app/(protected)/placeholder-page';

export default function OrdersPage() {
  return (
    <PlaceholderPage
      title="Orders"
      description="Track and manage customer orders."
      icon={<ShoppingCart className="h-5 w-5" />}
    />
  );
}
