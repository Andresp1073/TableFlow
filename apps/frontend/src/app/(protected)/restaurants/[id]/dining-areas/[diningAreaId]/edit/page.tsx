'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useDiningArea, useUpdateDiningArea } from '@/hooks/use-dining-areas';
import { DiningAreaForm } from '@/components/dining-areas/dining-area-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function EditDiningAreaPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.['id'] as string | undefined;
  const diningAreaId = params?.['diningAreaId'] as string | undefined;
  const { data: area, isLoading, isError, error } = useDiningArea(restaurantId, diningAreaId);
  const updateMutation = useUpdateDiningArea();

  const handleSubmit = (data: Record<string, unknown>) => {
    if (!restaurantId || !diningAreaId) return;
    updateMutation.mutate(
      { restaurantId, diningAreaId, data: data as unknown as Parameters<typeof updateMutation.mutate>[0]['data'] },
      {
        onSuccess: () => router.push(`/restaurants/${restaurantId}/dining-areas/${diningAreaId}`),
      },
    );
  };

  return (
    <PageWrapper
      title={area ? `Edit: ${area.name}` : t('Edit Dining Area')}
      description={t('Update dining area information')}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/restaurants/${restaurantId}/dining-areas/${diningAreaId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          {t('Back to Details')}
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-4 max-w-2xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('Failed to load dining area')}: {(error as Error)?.message || t('An unexpected error occurred')}
          </AlertDescription>
        </Alert>
      ) : area ? (
        <div className="max-w-2xl">
          <DiningAreaForm
            mode="edit"
            initialData={area}
            isLoading={updateMutation.isPending}
            error={updateMutation.error?.message ?? null}
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}
    </PageWrapper>
  );
}
