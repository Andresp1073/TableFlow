'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import type { DiningArea } from '@/lib/dining-area-types';
import { useArchiveDiningArea } from '@/hooks/use-dining-areas';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Archive, Edit, RotateCcw } from 'lucide-react';
import { ConfirmActionDialog } from '@/components/restaurants/confirm-action-dialog';

interface DiningAreaActionsProps {
  area: DiningArea;
  restaurantId?: string;
}

export function DiningAreaActions({ area, restaurantId: propRestaurantId }: DiningAreaActionsProps) {
  const router = useRouter();
  const params = useParams();
  const paramsRestaurantId = params?.['id'] as string;
  const restaurantId = propRestaurantId || paramsRestaurantId;
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const archiveMutation = useArchiveDiningArea();

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync({ restaurantId, diningAreaId: area.id });
      setShowArchiveDialog(false);
      router.refresh();
    } catch {
      // Error handled by the mutation
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/restaurants/${restaurantId}/dining-areas/${area.id}/edit`)}
        >
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {area.status === 'active' ? (
              <DropdownMenuItem onClick={() => setShowArchiveDialog(true)}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push(`/restaurants/${restaurantId}/dining-areas/${area.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmActionDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        title="Archive Dining Area"
        description={`Are you sure you want to archive "${area.name}"? It will no longer be available for reservations.`}
        confirmLabel="Archive"
        confirmVariant="danger"
        loading={archiveMutation.isPending}
        onConfirm={handleArchive}
      />
    </>
  );
}
