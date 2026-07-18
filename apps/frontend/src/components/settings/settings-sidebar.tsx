'use client';

import { t } from '@/lib/i18n';
import {
  LayoutDashboard,
  Building2,
  Clock,
  Globe,
  Percent,
  Bell,
  Palette,
  Shield,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: t('Dashboard'), icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'restaurant', label: t('Restaurant Info'), icon: <Building2 className="h-4 w-4" /> },
  { id: 'business-hours', label: t('Business Hours'), icon: <Clock className="h-4 w-4" /> },
  { id: 'regional', label: t('Regional'), icon: <Globe className="h-4 w-4" /> },
  { id: 'tax', label: t('Tax'), icon: <Percent className="h-4 w-4" /> },
  { id: 'notifications', label: t('Notifications'), icon: <Bell className="h-4 w-4" /> },
  { id: 'appearance', label: t('Appearance'), icon: <Palette className="h-4 w-4" /> },
  { id: 'security', label: t('Security'), icon: <Shield className="h-4 w-4" /> },
  { id: 'about', label: t('About'), icon: <Info className="h-4 w-4" /> },
];

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <nav className="flex flex-col gap-1 w-full lg:w-56 shrink-0" aria-label={t('Settings navigation')}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSectionChange(item.id)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left',
            'hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            activeSection === item.id
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground',
          )}
          aria-current={activeSection === item.id ? 'page' : undefined}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );
}
