import { BarChart3 } from 'lucide-react';
import { PlaceholderPage } from '@/app/(protected)/placeholder-page';

export default function AnalyticsPage() {
  return (
    <PlaceholderPage
      title="Analytics"
      description="View business insights, reports, and performance metrics."
      icon={<BarChart3 className="h-5 w-5" />}
    />
  );
}
