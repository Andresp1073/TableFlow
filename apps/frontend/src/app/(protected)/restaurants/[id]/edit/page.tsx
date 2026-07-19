'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useRestaurant, useUpdateRestaurant } from '@/hooks/use-restaurants';
import { RestaurantForm } from '@/components/restaurants/restaurant-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { UpdateRestaurantFormData } from '@/lib/restaurant-schemas';

export default function EditRestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.['id'] as string | undefined;
  const { data: restaurant, isLoading, isError, error } = useRestaurant(id);
  const updateMutation = useUpdateRestaurant();

  const handleSubmit = async (data: UpdateRestaurantFormData) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, data });
      router.push(`/restaurants/${id}`);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <PageWrapper
      title={restaurant ? `Edit: ${restaurant.name}` : t('Edit Restaurant')}
      description={t('Update restaurant information')}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.push(`/restaurants/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          {t('Back to Details')}
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-4 max-w-2xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('Failed to load restaurant')}: {(error as Error)?.message || t('An unexpected error occurred')}
          </AlertDescription>
        </Alert>
      ) : restaurant ? (
        <div className="max-w-2xl">
          <RestaurantForm
            mode="edit"
            initialData={restaurant}
            isLoading={updateMutation.isPending}
            error={updateMutation.error?.message ?? null}
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}
    </PageWrapper>
  );
}
