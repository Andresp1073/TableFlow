'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCreateReservation } from '@/hooks/use-reservations';
import { t } from '@/lib/i18n';
import { ReservationForm } from '@/components/reservations/reservation-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';

export default function CreateReservationPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.['id'] as string;
  const createMutation = useCreateReservation();

  const handleSubmit = (data: Record<string, unknown>) => {
    createMutation.mutate(
      { restaurantId, data: data as unknown as Parameters<typeof createMutation.mutate>[0]['data'] },
      {
        onSuccess: (reservation) =>
          router.push(`/restaurants/${restaurantId}/reservations/${reservation.id}`),
      },
    );
  };

  return (
    <PageWrapper
      title={t('Create Reservation')}
      description={t('Add a new reservation')}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.push(`/restaurants/${restaurantId}/reservations`)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          {t('Back to Reservations')}
        </Button>
      }
    >
      <div className="max-w-2xl">
        <ReservationForm
          mode="create"
          isLoading={createMutation.isPending}
          error={createMutation.error?.message ?? null}
          onSubmit={handleSubmit}
        />
      </div>
    </PageWrapper>
  );
}
