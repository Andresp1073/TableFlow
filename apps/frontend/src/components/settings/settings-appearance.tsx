'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useTheme } from '@/providers/theme-provider';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Monitor, Sun, Moon } from 'lucide-react';
const DENSITY_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
];

const LANDING_PAGE_OPTIONS = [
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/reservations', label: 'Reservations' },
  { value: '/tables', label: 'Tables' },
  { value: '/orders', label: 'Orders' },
  { value: '/payments', label: 'Payments' },
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
    toast.success('Appearance preferences saved');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose your preferred color scheme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
              className="gap-2"
              aria-label="Light mode"
            >
              <Sun className="h-4 w-4" />
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
              className="gap-2"
              aria-label="Dark mode"
            >
              <Moon className="h-4 w-4" />
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
              className="gap-2"
              aria-label="System theme"
            >
              <Monitor className="h-4 w-4" />
              System
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
          <CardDescription>Adjust the interface density and default page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="density">Interface Density</Label>
            <Select value={density} onValueChange={setDensity}>
              <SelectTrigger id="density" aria-label="Select interface density">
                <SelectValue placeholder="Select density" />
              </SelectTrigger>
              <SelectContent>
                {DENSITY_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landingPage">Default Landing Page</Label>
            <Select value={landingPage} onValueChange={setLandingPage}>
              <SelectTrigger id="landingPage" aria-label="Select default landing page">
                <SelectValue placeholder="Select page" />
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
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
