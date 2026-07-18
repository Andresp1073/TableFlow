'use client';

import { useState, useCallback } from 'react';
import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import { SettingsDashboard } from '@/components/settings/settings-dashboard';
import { SettingsRestaurant } from '@/components/settings/settings-restaurant';
import { SettingsBusinessHours } from '@/components/settings/settings-business-hours';
import { SettingsRegional } from '@/components/settings/settings-regional';
import { SettingsTax } from '@/components/settings/settings-tax';
import { SettingsBusiness } from '@/components/settings/settings-business';
import { SettingsNotifications } from '@/components/settings/settings-notifications';
import { SettingsAppearance } from '@/components/settings/settings-appearance';
import { SettingsSecurity } from '@/components/settings/settings-security';
import { SettingsAbout } from '@/components/settings/settings-about';
import { PageWrapper } from '@/components/layout/page-wrapper';

const SECTION_TITLES: Record<string, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard', description: 'Overview of your restaurant settings and configuration.' },
  restaurant: { title: 'Restaurant Info', description: 'View your restaurant information.' },
  'business-hours': { title: 'Business Hours', description: 'Manage your opening hours and schedule.' },
  regional: { title: 'Regional Settings', description: 'Configure timezone, currency, and regional preferences.' },
  tax: { title: 'Tax Settings', description: 'Manage tax rates and service charges.' },
  business: { title: 'Business Settings', description: 'Configure reservation rules and business policies.' },
  notifications: { title: 'Notifications', description: 'Manage your notification preferences.' },
  appearance: { title: 'Appearance', description: 'Customize the look and feel of the application.' },
  security: { title: 'Security', description: 'Manage your account security settings.' },
  about: { title: 'About', description: 'Application version and resource links.' },
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

  const sectionConfig = SECTION_TITLES[activeSection] ?? SECTION_TITLES['dashboard'];

  return (
    <PageWrapper title={sectionConfig.title} description={sectionConfig.description}>
      <div className="flex flex-col lg:flex-row gap-6">
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
        <div className="flex-1 min-w-0">
          {activeSection === 'dashboard' && <SettingsDashboard />}
          {activeSection === 'restaurant' && <SettingsRestaurant />}
          {activeSection === 'business-hours' && <SettingsBusinessHours />}
          {activeSection === 'regional' && <SettingsRegional />}
          {activeSection === 'tax' && <SettingsTax />}
          {activeSection === 'business' && <SettingsBusiness />}
          {activeSection === 'notifications' && <SettingsNotifications />}
          {activeSection === 'appearance' && <SettingsAppearance />}
          {activeSection === 'security' && <SettingsSecurity />}
          {activeSection === 'about' && <SettingsAbout />}
        </div>
      </div>
    </PageWrapper>
  );
}
