import { Table2 } from 'lucide-react';
import { PlaceholderPage } from '@/app/(protected)/placeholder-page';

export default function TablesPage() {
  return (
    <PlaceholderPage
      title="Tables"
      description="Manage table configurations, layouts, and availability."
      icon={<Table2 className="h-5 w-5" />}
    />
  );
}
