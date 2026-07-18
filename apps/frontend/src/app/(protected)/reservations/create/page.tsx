'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCreateReservation } from '@/hooks/use-reservations';
import { useRestaurant } from '@/providers/restaurant-provider';
import { ReservationForm } from '@/components/reservations/reservation-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';

export default function CreateReservationPage() {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const createMutation = useCreateReservation();

  const handleSubmit = (data: Record<string, unknown>) => {
    createMutation.mutate(
      { restaurantId, data: data as unknown as Parameters<typeof createMutation.mutate>[0]['data'] },
      {
        onSuccess: (reservation) =>
          router.push(`/reservations/${reservation.id}`),
      },
    );
  };

  return (
    <PageWrapper
      title="Create Reservation"
      description="Add a new reservation"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.push('/reservations')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Reservations
        </Button>
      }
    >
      <div className="max-w-2xl">
        {!restaurantId ? (
          <p className="text-sm text-muted-foreground">Select a restaurant to create a reservation.</p>
        ) : (
          <ReservationForm
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
