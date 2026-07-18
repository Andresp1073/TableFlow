'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Restaurant } from '@/lib/restaurant-types';
import { useActivateRestaurant, useSuspendRestaurant, useArchiveRestaurant } from '@/hooks/use-restaurants';
import { ConfirmActionDialog } from '@/components/restaurants/confirm-action-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Play, Pause, Archive, Edit } from 'lucide-react';

interface RestaurantActionsProps {
  restaurant: Restaurant;
}

type ActionType = 'activate' | 'suspend' | 'archive' | null;

export function RestaurantActions({ restaurant }: RestaurantActionsProps) {
  const router = useRouter();
  const [action, setAction] = useState<ActionType>(null);
  const activateMutation = useActivateRestaurant();
  const suspendMutation = useSuspendRestaurant();
  const archiveMutation = useArchiveRestaurant();

  const mutation =
    action === 'activate'
      ? activateMutation
      : action === 'suspend'
        ? suspendMutation
        : archiveMutation;

  const actionConfig = {
    activate: {
      title: 'Activate Restaurant',
      description: `Are you sure you want to activate "${restaurant.name}"? It will become fully operational.`,
      confirmLabel: 'Activate',
      confirmVariant: 'primary' as const,
    },
    suspend: {
      title: 'Suspend Restaurant',
      description: `Are you sure you want to suspend "${restaurant.name}"? It will stop accepting operations.`,
      confirmLabel: 'Suspend',
      confirmVariant: 'secondary' as const,
    },
    archive: {
      title: 'Archive Restaurant',
      description: `Are you sure you want to archive "${restaurant.name}"? This action can be reversed later.`,
      confirmLabel: 'Archive',
      confirmVariant: 'danger' as const,
    },
  };

  const handleConfirm = async () => {
    if (!action) return;
    try {
      if (action === 'activate') {
        await activateMutation.mutateAsync(restaurant.id);
      } else if (action === 'suspend') {
        await suspendMutation.mutateAsync({ id: restaurant.id });
      } else {
        await archiveMutation.mutateAsync(restaurant.id);
      }
      setAction(null);
      router.refresh();
    } catch {
      // Error handled by the mutation
    }
  };

  const isActivated = restaurant.status === 'active';

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push(`/restaurants/${restaurant.id}/edit`)}>
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
            {isActivated ? (
              <DropdownMenuItem onClick={() => setAction('suspend')}>
                <Pause className="h-4 w-4 mr-2" />
                Suspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setAction('activate')}>
                <Play className="h-4 w-4 mr-2" />
                Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setAction('archive')} className="text-destructive">
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {action && (
        <ConfirmActionDialog
          open={!!action}
          onOpenChange={(open) => { if (!open) setAction(null); }}
          title={actionConfig[action].title}
          description={actionConfig[action].description}
          confirmLabel={actionConfig[action].confirmLabel}
          confirmVariant={actionConfig[action].confirmVariant}
          loading={mutation.isPending}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
