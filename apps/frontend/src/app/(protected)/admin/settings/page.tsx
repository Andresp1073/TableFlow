'use client';
import { t } from '@/lib/i18n';

import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Globe, Palette, Bell, Shield, DollarSign } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <AdminPageLayout
      title={t("System Preferences")}
      description={t("Configure platform-wide settings")}
    >
      <Breadcrumb
        items={[
          { label: t('Admin'), href: '/admin' },
          { label: t('Settings') },
        ]}
      />

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("Localization")}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <div className="space-y-2">
              <Label>Default Locale</Label>
              <Select defaultValue="en-US">
                <SelectTrigger aria-label={t("Default Locale")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-MX">Spanish (Mexico)</SelectItem>
                  <SelectItem value="fr-FR">French (France)</SelectItem>
                  <SelectItem value="de-DE">German (Germany)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Timezone')}</Label>
              <Select defaultValue="UTC">
                <SelectTrigger aria-label={t("Timezone")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern (US)</SelectItem>
                  <SelectItem value="America/Chicago">Central (US)</SelectItem>
                  <SelectItem value="America/Denver">Mountain (US)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Date Format')}</Label>
              <Select defaultValue="MM/DD/YYYY">
                <SelectTrigger aria-label={t("Date Format")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Time Format')}</Label>
              <Select defaultValue="12h">
                <SelectTrigger aria-label={t("Time Format")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("Appearance")}</h2>
          </div>
          <div className="space-y-4 max-w-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkMode">{t("Dark Mode")}</Label>
                <p className="text-sm text-muted-foreground">Enable dark mode across the platform</p>
              </div>
              <Switch id="darkMode" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="compactMode">{t("Compact Mode")}</Label>
                <p className="text-sm text-muted-foreground">Use compact layout for data-dense views</p>
              </div>
              <Switch id="compactMode" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("Security")}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input id="sessionTimeout" type="number" defaultValue="60" min={5} max={1440} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input id="maxLoginAttempts" type="number" defaultValue="5" min={1} max={20} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
              <Input id="lockoutDuration" type="number" defaultValue="15" min={1} max={1440} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordMinLength">Min Password Length</Label>
              <Input id="passwordMinLength" type="number" defaultValue="8" min={6} max={128} />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch id="twoFactorAuth" />
              <Label htmlFor="twoFactorAuth">Require Two-Factor Authentication for all users</Label>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("Notifications")}</h2>
          </div>
          <div className="space-y-4 max-w-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send system notifications via email</p>
              </div>
              <Switch id="emailNotifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auditAlerts">Security Alerts</Label>
                <p className="text-sm text-muted-foreground">Alert admins on security events</p>
              </div>
              <Switch id="auditAlerts" defaultChecked />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("Billing & Currency")}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select defaultValue="USD">
                <SelectTrigger aria-label={t("Default Currency")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="MXN">MXN ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
              <Input id="taxRate" type="number" defaultValue="8.5" min={0} max={100} step={0.01} />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button>{t("Save Settings")}</Button>
        </div>
      </div>
    </AdminPageLayout>
  );
}
