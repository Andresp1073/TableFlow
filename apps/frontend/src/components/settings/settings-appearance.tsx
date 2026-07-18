'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { useTheme } from '@/providers/theme-provider';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Monitor, Sun, Moon } from 'lucide-react';
const DENSITY_OPTIONS = [
  { value: 'default', label: t('Default') },
  { value: 'compact', label: t('Compact') },
  { value: 'comfortable', label: t('Comfortable') },
];

const LANDING_PAGE_OPTIONS = [
  { value: '/dashboard', label: t('Dashboard') },
  { value: '/reservations', label: t('Reservations') },
  { value: '/tables', label: t('Tables') },
  { value: '/orders', label: t('Orders') },
  { value: '/payments', label: t('Payments') },
];

export function SettingsAppearance() {
  const { theme, setTheme } = useTheme();
  const [density, setDensity] = useState('default');
  const [landingPage, setLandingPage] = useState('/dashboard');

  useEffect(() => {
    const saved = localStorage.getItem('appearance-prefs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.density) setDensity(parsed.density);
        if (parsed.landingPage) setLandingPage(parsed.landingPage);
      } catch { /* ignore */ }
    }
  }, []);

  const initialRef = useRef({ theme: theme ?? 'system', density, landingPage });
  const isDirty =
    (theme ?? 'system') !== initialRef.current.theme ||
    density !== initialRef.current.density ||
    landingPage !== initialRef.current.landingPage;

  const handleSave = () => {
    localStorage.setItem('appearance-prefs', JSON.stringify({ density, landingPage }));
    initialRef.current = { theme: theme ?? 'system', density, landingPage };
    toast.success(t('Appearance preferences saved'));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Theme')}</CardTitle>
          <CardDescription>{t('Choose your preferred color scheme.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
              className="gap-2"
              aria-label={t('Light mode')}
            >
              <Sun className="h-4 w-4" />
              {t('Light')}
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
              className="gap-2"
              aria-label={t('Dark mode')}
            >
              <Moon className="h-4 w-4" />
              {t('Dark')}
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
              className="gap-2"
              aria-label={t('System theme')}
            >
              <Monitor className="h-4 w-4" />
              {t('System')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Display Preferences')}</CardTitle>
          <CardDescription>{t('Adjust the interface density and default page.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="density">{t('Interface Density')}</Label>
            <Select value={density} onValueChange={setDensity}>
              <SelectTrigger id="density" aria-label={t('Select interface density')}>
                <SelectValue placeholder={t('Select density')} />
              </SelectTrigger>
              <SelectContent>
                {DENSITY_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landingPage">{t('Default Landing Page')}</Label>
            <Select value={landingPage} onValueChange={setLandingPage}>
              <SelectTrigger id="landingPage" aria-label={t('Select default landing page')}>
                <SelectValue placeholder={t('Select page')} />
              </SelectTrigger>
              <SelectContent>
                {LANDING_PAGE_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={!isDirty}>
            <Save className="h-4 w-4 mr-1.5" />
            {t('Save Preferences')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
