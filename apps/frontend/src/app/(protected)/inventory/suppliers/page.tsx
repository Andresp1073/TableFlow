'use client';
import { t } from '@/lib/i18n';

import { useRestaurant } from '@/providers/restaurant-provider';
import { useSuppliers } from '@/hooks/use-inventory';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { PageHeader } from '@/components/inventory/shared/page-header';
import { SupplierList } from '@/components/inventory/suppliers/supplier-list';

export default function SuppliersPage() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const { data, isLoading, error } = useSuppliers(restaurantId);

  return (
    <PageWrapper>
      <PageHeader title={t("Suppliers")} description={t("Manage your product suppliers")} createHref="/inventory/suppliers/new" createLabel={t("New Supplier")} />
      <SupplierList data={data ?? []} loading={isLoading} error={error?.message ?? null} />
    </PageWrapper>
  );
}
