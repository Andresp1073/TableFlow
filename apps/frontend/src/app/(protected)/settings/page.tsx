import { Settings } from 'lucide-react';
import { PlaceholderPage } from '@/app/(protected)/placeholder-page';

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Manage application settings, preferences, and configurations."
      icon={<Settings className="h-5 w-5" />}
    />
  );
}
