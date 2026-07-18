'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useReservation } from '@/hooks/use-reservations';
import { useRestaurant } from '@/providers/restaurant-provider';
import { ReservationDetailView } from '@/components/reservations/reservation-detail-view';
import { ReservationActions } from '@/components/reservations/reservation-actions';
import type { ReservationStatus } from '@/lib/reservation-types';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const reservationId = params?.['reservationId'] as string | undefined;
  const { data: reservation, isLoading, isError, error } = useReservation(restaurantId, reservationId);

  return (
    <PageWrapper
      title=""
      description=""
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/reservations')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {t('Back to Reservations')}
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
                {Array.from({ length: 2 }).map((_, j) => (
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
            {t('Failed to load reservation:')} {(error as Error)?.message || t('An unexpected error occurred')}
          </AlertDescription>
        </Alert>
      ) : reservation ? (
        <div className="space-y-6">
          <ReservationActions
            restaurantId={restaurantId}
            reservationId={reservation.id}
            currentStatus={reservation.status as ReservationStatus}
          />
          <ReservationDetailView reservation={reservation} />
        </div>
      ) : null}
    </PageWrapper>
  );
}
