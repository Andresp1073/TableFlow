'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { RestaurantTable } from '@/lib/table-types';
import { TABLE_STATUS_LABELS, TABLE_STATUS_OPTIONS } from '@/lib/table-types';
import { useArchiveTable, useChangeTableStatus } from '@/hooks/use-tables';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Archive,
  Edit,
  RotateCcw,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { ConfirmActionDialog } from '@/components/restaurants/confirm-action-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface TableActionsProps {
  table: RestaurantTable;
  restaurantId?: string;
  allowedTransitions?: string[];
  showViewOnFloorPlan?: boolean;
  onViewOnFloorPlan?: () => void;
}

export function TableActions({
  table,
  restaurantId: propRestaurantId,
  allowedTransitions,
  showViewOnFloorPlan,
  onViewOnFloorPlan,
}: TableActionsProps) {
  const router = useRouter();
  const params = useParams();
  const restaurantId = propRestaurantId ?? (params?.['id'] as string);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const archiveMutation = useArchiveTable();
  const statusMutation = useChangeTableStatus();

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync({ restaurantId, tableId: table.id });
      setShowArchiveDialog(false);
      router.refresh();
    } catch {
      // handled by mutation
    }
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    try {
      await statusMutation.mutateAsync({
        restaurantId,
        tableId: table.id,
        data: { status: selectedStatus },
      });
      setShowStatusDialog(false);
      setSelectedStatus('');
      router.refresh();
    } catch {
      // handled by mutation
    }
  };

  const transitions = useMemo(() => {
    if (allowedTransitions && allowedTransitions.length > 0) {
      return allowedTransitions;
    }
    const defaultTransitions: Record<string, string[]> = {
      available: ['occupied', 'reserved', 'cleaning', 'out_of_service', 'blocked', 'maintenance'],
      occupied: ['available', 'cleaning', 'out_of_service'],
      reserved: ['available', 'occupied', 'cancelled'],
      cleaning: ['available', 'occupied', 'out_of_service'],
      out_of_service: ['available', 'maintenance'],
      blocked: ['available', 'out_of_service'],
      maintenance: ['available', 'out_of_service'],
    };
    return defaultTransitions[table.status] ?? ['available'];
  }, [allowedTransitions, table.status]);

  const availableStatusOptions = useMemo(() => {
    return TABLE_STATUS_OPTIONS.filter(
      (opt) => opt.value !== '' && opt.value !== table.status && transitions.includes(opt.value),
    );
  }, [transitions, table.status]);

  const isArchived = table.status === 'archived' || !table.isActive;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/restaurants/${restaurantId}/tables/${table.id}/edit`)}
        >
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>

        {!isArchived && availableStatusOptions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatusDialog(true)}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Change Status
          </Button>
        )}

        {showViewOnFloorPlan && onViewOnFloorPlan && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewOnFloorPlan}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View on Floor Plan
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isArchived ? (
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
              onClick={() => router.push(`/restaurants/${restaurantId}/tables/${table.id}/edit`)}
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
        title="Archive Table"
        description={`Are you sure you want to archive Table ${table.tableNumber}${table.name ? ` (${table.name})` : ''}? It will be removed from the floor plan.`}
        confirmLabel="Archive"
        confirmVariant="danger"
        loading={archiveMutation.isPending}
        onConfirm={handleArchive}
      />

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Table Status</DialogTitle>
            <DialogDescription>
              Change the status of Table {table.tableNumber} from{' '}
              {TABLE_STATUS_LABELS[table.status]} to:
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger aria-label="New status">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} disabled={statusMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} loading={statusMutation.isPending} disabled={!selectedStatus}>
              {statusMutation.isPending ? 'Changing...' : 'Change Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
