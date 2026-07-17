'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Table2 } from 'lucide-react';
import { useTables, useUpdateTablePosition } from '@/hooks/use-tables';
import { useDiningAreas } from '@/hooks/use-dining-areas';
import { useRestaurant } from '@/hooks/use-restaurants';
import { FloorPlanCanvas } from '@/components/tables/floor-plan-canvas';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default function FloorPlanPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = params?.['id'] as string | undefined;
  const selectedParam = searchParams?.get('selected');

  const { data: restaurant } = useRestaurant(restaurantId);
  const { data: diningAreas } = useDiningAreas(restaurantId);
  const { data: tables, isLoading } = useTables(restaurantId);
  const updatePositionMutation = useUpdateTablePosition();

  const [selectedTableId, setSelectedTableId] = useState<string | null>(selectedParam ?? null);
  const [selectedDiningArea, setSelectedDiningArea] = useState<string>('all');

  const handleSelectTable = useCallback((tableId: string | null) => {
    setSelectedTableId(tableId);
  }, []);

  const handleMoveTable = useCallback((tableId: string, positionX: number, positionY: number) => {
    if (!restaurantId) return;
    updatePositionMutation.mutate({ restaurantId, tableId, positionX, positionY });
  }, [restaurantId, updatePositionMutation]);

  const filteredTables = useMemo(() => {
    if (!tables) return [];
    if (selectedDiningArea === 'all') return tables;
    if (selectedDiningArea === 'unassigned') return tables.filter((t) => !t.diningAreaId);
    return tables.filter((t) => t.diningAreaId === selectedDiningArea);
  }, [tables, selectedDiningArea]);

  const selectedDiningAreaName = useMemo(() => {
    if (selectedDiningArea === 'all') return 'All Areas';
    if (selectedDiningArea === 'unassigned') return 'Unassigned';
    return diningAreas?.find((a) => a.id === selectedDiningArea)?.name;
  }, [selectedDiningArea, diningAreas]);

  return (
    <PageWrapper
      title="Floor Plan"
      description={restaurant ? `Interactive floor plan for ${restaurant.name}` : 'Interactive floor plan'}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/restaurants/${restaurantId}/tables`)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Tables
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/restaurants/${restaurantId}/tables/create`)}>
            <Table2 className="h-4 w-4 mr-1.5" />
            New Table
          </Button>
        </div>
      }
    >
      <div className="flex flex-col h-[calc(100vh-12rem)] rounded-lg border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b bg-background">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Area:</span>
            <Select value={selectedDiningArea} onValueChange={setSelectedDiningArea}>
              <SelectTrigger className="w-[180px] h-8" aria-label="Filter by dining area">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {diningAreas?.map((area) => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <FloorPlanCanvas
          tables={filteredTables}
          selectedTableId={selectedTableId}
          onSelectTable={handleSelectTable}
          onMoveTable={handleMoveTable}
          isLoading={isLoading}
          diningAreaName={selectedDiningAreaName}
        />
      </div>
    </PageWrapper>
  );
}
