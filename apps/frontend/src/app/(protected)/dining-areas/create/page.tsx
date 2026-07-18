'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCreateDiningArea } from '@/hooks/use-dining-areas';
import { useRestaurant } from '@/providers/restaurant-provider';
import { DiningAreaForm } from '@/components/dining-areas/dining-area-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

export default function CreateDiningAreaPage() {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const createMutation = useCreateDiningArea();

  const handleSubmit = (data: Record<string, unknown>) => {
    createMutation.mutate(
      { restaurantId, data: data as unknown as Parameters<typeof createMutation.mutate>[0]['data'] },
      {
        onSuccess: (area) => router.push(`/dining-areas/${area.id}`),
      },
    );
  };

  return (
    <PageWrapper
      title={t('Create Dining Area')}
      description={t('Add a new dining area')}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.push('/dining-areas')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          {t('Back to Dining Areas')}
        </Button>
      }
    >
      <div className="max-w-2xl">
        {!restaurantId ? (
          <p className="text-sm text-muted-foreground">{t('Select a restaurant to create a dining area.')}</p>
        ) : (
          <DiningAreaForm
            mode="create"
            isLoading={createMutation.isPending}
            error={createMutation.error?.message ?? null}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </PageWrapper>
  );
}
