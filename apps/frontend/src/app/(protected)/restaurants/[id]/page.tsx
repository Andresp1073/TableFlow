'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useRestaurant } from '@/hooks/use-restaurants';
import { RestaurantDetailView } from '@/components/restaurants/restaurant-detail-view';
import { RestaurantActions } from '@/components/restaurants/restaurant-actions';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.['id'] as string | undefined;
  const { data: restaurant, isLoading, isError, error } = useRestaurant(id);

  return (
    <PageWrapper
      title=""
      description=""
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/restaurants')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Restaurants
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
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
            Failed to load restaurant: {(error as Error)?.message || 'An unexpected error occurred'}
          </AlertDescription>
        </Alert>
      ) : restaurant ? (
        <div className="space-y-6">
          <RestaurantActions restaurant={restaurant} />
          <RestaurantDetailView restaurant={restaurant} />
        </div>
      ) : null}
    </PageWrapper>
  );
}
