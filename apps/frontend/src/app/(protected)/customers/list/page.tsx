'use client';
import { t } from '@/lib/i18n';

import { useState } from 'react';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useCustomers, useArchiveCustomer, useRestoreCustomer } from '@/hooks/use-customers';
import { PageHeader } from '@/components/customers/shared/page-header';
import { CustomerList } from '@/components/customers/list/customer-list';
import { Input } from '@/components/ui/input';
import { ContentArea } from '@/components/layout/content-area';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerListPage() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useCustomers(restaurantId, { search: search || undefined });
  const archiveCustomer = useArchiveCustomer();
  const restoreCustomer = useRestoreCustomer();

  const handleArchive = (id: string) => {
    archiveCustomer.mutate({ restaurantId, customerId: id }, {
      onSuccess: () => toast.success(t("Customer archived")),
      onError: () => toast.error(t("Failed to archive customer")),
    });
  };

  const handleRestore = (id: string) => {
    restoreCustomer.mutate({ restaurantId, customerId: id }, {
      onSuccess: () => toast.success(t("Customer restored")),
      onError: () => toast.error(t("Failed to restore customer")),
    });
  };

  return (
    <ContentArea>
      <div className="space-y-4">
        <PageHeader title={t("Customers")} description={t("View and manage customer profiles")} createHref="/customers/new" createLabel={t("New Customer")} />
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Search customers...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label={t("Search customers")}
          />
        </div>
        <CustomerList
          data={data ?? []}
          loading={isLoading}
          error={error?.message ?? null}
          onArchive={handleArchive}
          onRestore={handleRestore}
        />
      </div>
    </ContentArea>
  );
}
