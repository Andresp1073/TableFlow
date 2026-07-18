'use client';
import { t } from '@/lib/i18n';

import type { KitchenStationInfo } from '@/lib/order-types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/cn';

interface StationSelectorProps {
  stations: KitchenStationInfo[];
  selectedStationId: string | null;
  onSelectStation: (stationId: string | null) => void;
  ticketCounts?: Record<string, number>;
  className?: string;
}

export function StationSelector({
  stations,
  selectedStationId,
  onSelectStation,
  ticketCounts = {},
  className,
}: StationSelectorProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)} role="tablist" aria-label={t("Kitchen stations")}>
      <Button
        key="all"
        variant={selectedStationId === null ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onSelectStation(null)}
        role="tab"
        aria-selected={selectedStationId === null}
      >
        All Stations
        {Object.values(ticketCounts).reduce((a, b) => a + b, 0) > 0 && (
          <span className="ml-1.5 text-xs opacity-70">
            ({Object.values(ticketCounts).reduce((a, b) => a + b, 0)})
          </span>
        )}
      </Button>
      {stations.map((station) => {
        const count = ticketCounts[station.id] ?? 0;
        const workload = station.maxConcurrentTickets > 0
          ? Math.round((station.currentTickets / station.maxConcurrentTickets) * 100)
          : 0;

        return (
          <Button
            key={station.id}
            variant={selectedStationId === station.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onSelectStation(station.id)}
            role="tab"
            aria-selected={selectedStationId === station.id}
            aria-label={`${station.name} station${count > 0 ? `, ${count} orders` : ''}`}
            className="relative"
          >
            <span>{station.name}</span>
            {count > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            )}
            {workload > 80 && (
              <span className="ml-1 h-2 w-2 rounded-full bg-destructive animate-pulse" aria-label={t("High workload")} />
            )}
          </Button>
        );
      })}
    </div>
  );
}

interface StationWorkloadProps {
  station: KitchenStationInfo;
  className?: string;
}

export function StationWorkload({ station, className }: StationWorkloadProps) {
  const workload = station.maxConcurrentTickets > 0
    ? Math.round((station.currentTickets / station.maxConcurrentTickets) * 100)
    : 0;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{station.name}</span>
        <span className="text-muted-foreground">
          {station.currentTickets}/{station.maxConcurrentTickets}
        </span>
      </div>
      <Progress
        value={Math.min(workload, 100)}
        className={cn(
          'h-2',
          workload > 90 && '[&>div]:bg-destructive',
          workload > 70 && workload <= 90 && '[&>div]:bg-warning',
          workload <= 70 && '[&>div]:bg-success',
        )}
        aria-label={`${station.name} workload: ${workload}%`}
      />
    </div>
  );
}
