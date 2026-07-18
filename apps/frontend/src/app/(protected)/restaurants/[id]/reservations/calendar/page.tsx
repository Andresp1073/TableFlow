'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useReservations } from '@/hooks/use-reservations';
import { useRestaurant } from '@/hooks/use-restaurants';
import { ReservationCalendar } from '@/components/reservations/reservation-calendar';
import { ReservationTimeline } from '@/components/reservations/reservation-timeline';
import type { CalendarViewType } from '@/lib/reservation-types';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';

export default function ReservationCalendarPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.['id'] as string | undefined;
  const { data: restaurant } = useRestaurant(restaurantId);

  const [view, setView] = useState<CalendarViewType>('week');

  const today = format(new Date(), 'yyyy-MM-dd');

  const listParams = useMemo(
    () => ({
      date: view === 'day' || view === 'timeline' ? today : undefined,
    }),
    [view, today],
  );

  const { data: reservations, isLoading, error } = useReservations(
    restaurantId,
    listParams,
  );

  const handleViewChange = useCallback((newView: CalendarViewType) => {
    setView(newView);
  }, []);

  const handleEventClick = useCallback(
    (reservationId: string) => {
      router.push(`/restaurants/${restaurantId}/reservations/${reservationId}`);
    },
    [router, restaurantId],
  );

  const handleDateSelect = useCallback(
    (start: string, _end: string) => {
      router.push(
        `/restaurants/${restaurantId}/reservations/create?date=${start.split('T')[0]}`,
      );
    },
    [router, restaurantId],
  );

  return (
    <PageWrapper
      title="Reservation Calendar"
      description={restaurant ? `Calendar view for ${restaurant.name}` : 'Calendar view'}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.push(`/restaurants/${restaurantId}/reservations`)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Reservations
        </Button>
      }
    >
      {view === 'timeline' ? (
        <ReservationTimeline
          reservations={reservations ?? []}
          date={today}
          onReservationClick={handleEventClick}
          className="mt-4"
        />
      ) : (
        <ReservationCalendar
          reservations={reservations ?? []}
          loading={isLoading}
          error={error?.message ?? null}
          view={view}
          onViewChange={handleViewChange}
          onDateChange={() => {}}
          onEventClick={handleEventClick}
          onDateSelect={handleDateSelect}
          className="mt-4"
        />
      )}
    </PageWrapper>
  );
}
