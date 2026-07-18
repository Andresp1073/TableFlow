import { Users } from 'lucide-react';
import { PlaceholderPage } from '@/app/(protected)/placeholder-page';

export default function CustomersPage() {
  return (
    <PlaceholderPage
      title="Customers"
      description="View and manage customer profiles and history."
      icon={<Users className="h-5 w-5" />}
    />
  );
}
