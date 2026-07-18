'use client';

import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import { Progress } from '@/components/ui/progress';
import { Users, Sofa } from 'lucide-react';
import type { CurrentOccupancyData } from '@/lib/dashboard-types';

interface CurrentOccupancyWidgetProps {
  data?: CurrentOccupancyData;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefresh?: () => void;
  onRetry?: () => void;
}

function CurrentOccupancyWidget({ data, isLoading, isError, error, onRefresh, onRetry }: CurrentOccupancyWidgetProps) {
  return (
    <DashboardWidget
      title="Current Occupancy"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.totalTables === 0}
      error={error}
      emptyMessage="No tables configured"
      onRefresh={onRefresh}
      onRetry={onRetry}
    >
      {data && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{data.occupancyRate}%</span>
            <span className="text-xs text-muted-foreground">occupied</span>
          </div>
          <Progress value={data.occupancyRate} className="h-2" />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Guests</p>
                <p className="text-sm font-medium">{data.currentGuests}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sofa className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tables</p>
                <p className="text-sm font-medium">{data.occupiedTables}/{data.totalTables}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardWidget>
  );
}

export { CurrentOccupancyWidget };
