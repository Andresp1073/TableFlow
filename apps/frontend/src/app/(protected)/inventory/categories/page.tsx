'use client';

import { useRestaurant } from '@/providers/restaurant-provider';
import { useCategories } from '@/hooks/use-inventory';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { PageHeader } from '@/components/inventory/shared/page-header';
import { CategoryList } from '@/components/inventory/categories/category-list';

export default function CategoriesPage() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const { data, isLoading, isError } = useCategories(restaurantId);

  return (
    <PageWrapper>
      <PageHeader title="Categories" description="Product categories for inventory organization" />
      <CategoryList data={data} isLoading={isLoading} isError={isError} />
    </PageWrapper>
  );
}
