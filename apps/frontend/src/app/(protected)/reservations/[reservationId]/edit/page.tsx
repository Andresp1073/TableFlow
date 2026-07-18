'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useReservation, useUpdateReservation } from '@/hooks/use-reservations';
import { useRestaurant } from '@/providers/restaurant-provider';
import { ReservationForm } from '@/components/reservations/reservation-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EditReservationPage() {
  const params = useParams();
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const reservationId = params?.['reservationId'] as string | undefined;
  const { data: reservation, isLoading, isError, error } = useReservation(restaurantId, reservationId);
  const updateMutation = useUpdateReservation();

  const handleSubmit = (data: Record<string, unknown>) => {
    if (!restaurantId || !reservationId) return;
    updateMutation.mutate(
      { restaurantId, reservationId, data: data as unknown as Parameters<typeof updateMutation.mutate>[0]['data'] },
      {
        onSuccess: () => router.push(`/reservations/${reservationId}`),
      },
    );
  };

  return (
    <PageWrapper
      title={reservation ? `Edit: ${reservation.reservationNumber}` : 'Edit Reservation'}
      description="Update reservation information"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/reservations/${reservationId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Details
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
            Failed to load reservation: {(error as Error)?.message || 'An unexpected error occurred'}
          </AlertDescription>
        </Alert>
      ) : reservation ? (
        <div className="max-w-2xl">
          <ReservationForm
            mode="edit"
            initialData={reservation}
            isLoading={updateMutation.isPending}
            error={updateMutation.error?.message ?? null}
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}
    </PageWrapper>
  );
}
