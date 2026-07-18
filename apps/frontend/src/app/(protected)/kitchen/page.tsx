'use client';

import { useSearchParams } from 'next/navigation';
import { useKitchenTickets, useKitchenStations, useKitchenStats, useUpdateTicketStatus } from '@/hooks/use-kitchen';
import { KdsDashboard } from '@/components/kitchen/kds-dashboard';

export default function KitchenPage() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('restaurantId') ?? 'demo-restaurant';

  const { data: tickets, isLoading: ticketsLoading, isError: ticketsError, error: ticketsErrorObj, refetch: refetchTickets } = useKitchenTickets(restaurantId);
  const { data: stations, isLoading: stationsLoading } = useKitchenStations(restaurantId);
  const { data: stats, isLoading: statsLoading } = useKitchenStats(restaurantId);
  const updateStatus = useUpdateTicketStatus();

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    updateStatus.mutate({
      restaurantId,
      ticketId,
      status: newStatus as Parameters<typeof updateStatus.mutate>[0]['status'],
    });
  };

  return (
    <KdsDashboard
      restaurantId={restaurantId}
      tickets={tickets}
      stations={stations}
      stats={stats ?? null}
      isLoading={ticketsLoading || stationsLoading || statsLoading}
      isError={ticketsError}
      error={ticketsErrorObj as Error | null}
      onRetry={() => refetchTickets()}
      onStatusChange={handleStatusChange}
    />
  );
}
