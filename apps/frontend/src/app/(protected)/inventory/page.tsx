import { Package } from 'lucide-react';
import { PlaceholderPage } from '@/app/(protected)/placeholder-page';

export default function InventoryPage() {
  return (
    <PlaceholderPage
      title="Inventory"
      description="Manage inventory stock, suppliers, and orders."
      icon={<Package className="h-5 w-5" />}
    />
  );
}
