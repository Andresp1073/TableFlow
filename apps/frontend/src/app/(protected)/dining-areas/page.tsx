import { Sofa } from 'lucide-react';
import { PlaceholderPage } from '@/app/(protected)/placeholder-page';

export default function DiningAreasPage() {
  return (
    <PlaceholderPage
      title="Dining Areas"
      description="Configure dining areas, sections, and floor layouts."
      icon={<Sofa className="h-5 w-5" />}
    />
  );
}
