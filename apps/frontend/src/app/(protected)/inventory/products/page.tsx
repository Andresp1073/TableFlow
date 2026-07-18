'use client';

import { useState } from 'react';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useProducts, useCategories, useArchiveProduct, useRestoreProduct } from '@/hooks/use-inventory';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { PageHeader } from '@/components/inventory/shared/page-header';
import { InventoryFilters } from '@/components/inventory/shared/inventory-filters';
import { ProductList } from '@/components/inventory/products/product-list';
import { toast } from 'sonner';

export default function ProductsPage() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading, isError, error } = useProducts(restaurantId, { search, category: category || undefined });
  const archiveProduct = useArchiveProduct();
  const restoreProduct = useRestoreProduct();

  const handleArchive = (id: string) => {
    archiveProduct.mutate({ restaurantId, productId: id }, {
      onSuccess: () => toast.success('Product archived'),
      onError: () => toast.error('Failed to archive product'),
    });
  };

  const handleRestore = (id: string) => {
    restoreProduct.mutate({ restaurantId, productId: id }, {
      onSuccess: () => toast.success('Product restored'),
      onError: () => toast.error('Failed to restore product'),
    });
  };

  return (
    <PageWrapper>
      <PageHeader title="Products" description="Manage your inventory products and ingredients" createHref="/inventory/products/new" createLabel="New Product" />
      <div className="space-y-4">
        <InventoryFilters search={search} onSearchChange={setSearch} category={category} onCategoryChange={setCategory} showCategory />
        <ProductList
          data={data ?? []}
          loading={isLoading}
          error={error?.message ?? null}
          onArchive={handleArchive}
          onRestore={handleRestore}
        />
      </div>
    </PageWrapper>
  );
}
