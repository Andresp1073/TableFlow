'use client';
import { t } from '@/lib/i18n';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCreateRestaurant } from '@/hooks/use-restaurants';
import { RestaurantForm } from '@/components/restaurants/restaurant-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';

export default function CreateRestaurantPage() {
  const router = useRouter();
  const createMutation = useCreateRestaurant();

  const handleSubmit = (data: Record<string, unknown>) => {
    createMutation.mutate(data as unknown as Parameters<typeof createMutation.mutate>[0], {
      onSuccess: (restaurant) => router.push(`/restaurants/${restaurant.id}`),
    });
  };

  return (
    <PageWrapper
      title={t("Create Restaurant")}
      description={t("Add a new restaurant to your organization")}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.push('/restaurants')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Restaurants
        </Button>
      }
    >
      <div className="max-w-2xl">
        <RestaurantForm
          mode="create"
          isLoading={createMutation.isPending}
          error={createMutation.error?.message ?? null}
          onSubmit={handleSubmit}
        />
      </div>
    </PageWrapper>
  );
}
