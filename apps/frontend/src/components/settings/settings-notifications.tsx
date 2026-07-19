'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save } from 'lucide-react';

interface NotificationToggle {
  id: string;
  label: string;
  description: string;
}

const TOGGLES: NotificationToggle[] = [
  { id: 'email', label: t('Email Notifications'), description: t('Receive email notifications for important updates') },
  { id: 'reservation', label: t('Reservation Notifications'), description: t('Get notified when new reservations are made') },
  { id: 'kitchen', label: t('Kitchen Notifications'), description: t('Receive updates from the kitchen') },
  { id: 'inventory', label: t('Inventory Alerts'), description: t('Get alerts when inventory is running low') },
  { id: 'system', label: t('System Alerts'), description: t('Receive system maintenance and outage notifications') },
];

export function SettingsNotifications() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('notification-prefs') : null;
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return Object.fromEntries(TOGGLES.map((t) => [t.id, true]));
  });

  const [initialPrefs] = useState(JSON.stringify(prefs));
  const isDirty = JSON.stringify(prefs) !== initialPrefs;

  const handleToggle = (id: string, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('notification-prefs', JSON.stringify(prefs));
    toast.success(t('Notification preferences saved'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Notification Preferences')}</CardTitle>
        <CardDescription>
          {t('Configure which notifications you receive. These settings are stored locally.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {TOGGLES.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor={`notif-${item.id}`} className="cursor-pointer font-medium">
                {item.label}
              </Label>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              id={`notif-${item.id}`}
              checked={!!prefs[item.id]}
              onCheckedChange={(v) => handleToggle(item.id, v)}
              aria-label={`${t('Toggle')} ${item.label}`}
            />
          </div>
        ))}

        <div className="flex items-center gap-4 pt-2">
          <Button onClick={handleSave} disabled={!isDirty}>
            <Save className="h-4 w-4 mr-1.5" />
             {t('Save Preferences')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
