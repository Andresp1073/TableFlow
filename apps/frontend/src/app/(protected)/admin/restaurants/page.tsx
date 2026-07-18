'use client';
import { t } from '@/lib/i18n';

import Link from 'next/link';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Building2, ExternalLink } from 'lucide-react';

export default function AdminRestaurantsPage() {
  return (
    <AdminPageLayout
      title={t("Restaurant Configuration")}
      description={t("Manage restaurants and their settings")}
    >
      <Breadcrumb
        items={[
          { label: t('Admin'), href: '/admin' },
          { label: t('Restaurants') },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/restaurants"
          className="flex items-center gap-4 rounded-lg border p-6 hover:bg-accent transition-colors"
        >
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium">{t("All Restaurants")}</p>
            <p className="text-sm text-muted-foreground">{t("View and manage restaurants")}</p>
          </div>
          <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
        </Link>
      </div>

      <div className="mt-8 rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-2">{t("Restaurant Settings")}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Restaurant-specific settings are available within each restaurant&apos;s detail page.
          Select a restaurant from the Restaurants section to configure:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Business hours and holiday schedules</li>
          <li>Tax rates and currency settings</li>
          <li>Reservation policies</li>
          <li>Kitchen configuration</li>
          <li>Dining area and table settings</li>
          <li>POS and payment settings</li>
        </ul>
      </div>
    </AdminPageLayout>
  );
}
