'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useDiningArea } from '@/hooks/use-dining-areas';
import { useRestaurant } from '@/providers/restaurant-provider';
import { DiningAreaDetailView } from '@/components/dining-areas/dining-area-detail-view';
import { DiningAreaActions } from '@/components/dining-areas/dining-area-actions';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { t } from '@/lib/i18n';

export default function DiningAreaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const diningAreaId = params?.['diningAreaId'] as string | undefined;
  const { data: area, isLoading, isError, error } = useDiningArea(restaurantId, diningAreaId);

  return (
    <PageWrapper
      title=""
      description=""
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/dining-areas')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {t('Back to Dining Areas')}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-6 space-y-4">
                <Skeleton className="h-5 w-40" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('Failed to load dining area: {error}', { error: (error as Error)?.message || t('An unexpected error occurred') })}
          </AlertDescription>
        </Alert>
      ) : area ? (
        <div className="space-y-6">
          <DiningAreaActions area={area} restaurantId={restaurantId} />
          <DiningAreaDetailView area={area} />
        </div>
      ) : null}
    </PageWrapper>
  );
}
