'use client';
import { t } from '@/lib/i18n';

import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

const channels = [
  { name: t('Email'), icon: Mail, description: t('Configure SMTP settings and email templates'), enabled: true },
  { name: t('SMS'), icon: Smartphone, description: t('Configure SMS provider and phone notifications'), enabled: false },
  { name: t('Push'), icon: Bell, description: t('Configure push notification channels'), enabled: false },
  { name: t('In-App'), icon: MessageSquare, description: t('Configure in-app notification display'), enabled: true },
];

const templates = [
  { name: t('Reservation Confirmation'), channel: 'Email', status: t('Active') },
  { name: t('Reservation Reminder'), channel: 'Email', status: t('Active') },
  { name: t('Reservation Cancellation'), channel: 'Email', status: t('Active') },
  { name: t('Password Reset'), channel: 'Email', status: t('Active') },
  { name: t('Account Verification'), channel: 'Email', status: t('Active') },
  { name: t('Welcome Email'), channel: 'Email', status: t('Inactive') },
];

export default function AdminNotificationsPage() {
  return (
    <AdminPageLayout
      title={t("Notifications")}
      description={t("Manage notification channels and templates")}
    >
      <Breadcrumb
        items={[
          { label: t('Admin'), href: '/admin' },
          { label: t('Notifications') },
        ]}
      />

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">{t("Channels")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <Card key={channel.name} className="p-4 flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${channel.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 ${channel.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{channel.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        channel.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {channel.enabled ? 'Configured' : 'Coming Soon'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{channel.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">{t("Templates")}</h2>
          <div className="rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">{t("Template Name")}</th>
                  <th className="text-left p-3 text-sm font-medium">{t("Channel")}</th>
                  <th className="text-left p-3 text-sm font-medium">{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.name} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-sm font-medium">{template.name}</td>
                    <td className="p-3 text-sm text-muted-foreground">{template.channel}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        template.status === 'Active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {template.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}
