'use client';
import { t } from '@/lib/i18n';

import { useState, useCallback } from 'react';
import type { KitchenTicket, KitchenStationInfo, KitchenStats } from '@/lib/order-types';
import type { TicketStatus } from '@/lib/order-types';
import { OrderBoard } from './order-board';
import { StationSelector } from './station-selector';
import { KdsHeader } from './kds-header';
import { KdsLayout } from './kds-layout';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ChefHat } from 'lucide-react';

interface KdsDashboardProps {
  restaurantId: string;
  tickets: KitchenTicket[] | undefined;
  stations: KitchenStationInfo[] | undefined;
  stats: KitchenStats | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
  title?: string;
}

export function KdsDashboard({
  tickets,
  stations,
  stats,
  isLoading,
  isError,
  error,
  onRetry,
  onStatusChange,
  title = 'Kitchen Display',
}: KdsDashboardProps) {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const handleStatusChange = useCallback(
    (ticketId: string, newStatus: string) => {
      onStatusChange(ticketId, newStatus as TicketStatus);
    },
    [onStatusChange],
  );

  if (isError) {
    return (
      <KdsLayout>
        <KdsHeader title={title} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorState
            title={t("Failed to load orders")}
            message={error?.message ?? 'Unable to connect to the kitchen server.'}
            onRetry={onRetry}
          />
        </div>
      </KdsLayout>
    );
  }

  if (isLoading) {
    return (
      <KdsLayout>
        <KdsHeader title={title} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState message={t("Loading orders...")} size="lg" />
        </div>
      </KdsLayout>
    );
  }

  const filteredTickets = selectedStationId
    ? (tickets ?? []).filter((t) => t.stationId === selectedStationId)
    : (tickets ?? []);

  const stationTicketCounts: Record<string, number> = {};
  if (stations) {
    for (const station of stations) {
      stationTicketCounts[station.id] = (tickets ?? []).filter(
        (t) => t.stationId === station.id,
      ).length;
    }
  }

  return (
    <KdsLayout>
      <KdsHeader title={title} stats={stats ?? null}>
        {stations && stations.length > 0 && (
          <StationSelector
            stations={stations}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
            ticketCounts={stationTicketCounts}
          />
        )}
      </KdsHeader>

      <main className="p-4" role="main" aria-label={t("Kitchen orders")}>
        {filteredTickets.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <EmptyState
              icon={<ChefHat className="h-12 w-12" />}
              title={t("No active orders")}
              description={
                selectedStationId
                  ? 'This station has no orders. All caught up!'
                  : 'The kitchen is clear. No orders to display.'
              }
            />
          </div>
        ) : (
          <OrderBoard
            tickets={filteredTickets}
            onStatusChange={handleStatusChange}
            compact={!!selectedStationId}
          />
        )}
      </main>
    </KdsLayout>
  );
}
