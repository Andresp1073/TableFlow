'use client';

import { Badge } from '@/components/ui/badge';
import { getStatusColor } from '@/lib/inventory-types';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={getStatusColor(status)}>{status}</Badge>;
}

interface MovementTypeBadgeProps {
  type: string;
}

const movementColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  Purchase: 'success',
  Consumption: 'danger',
  Adjustment: 'warning',
  Waste: 'danger',
  Return: 'info',
  Transfer: 'secondary',
};

export function MovementTypeBadge({ type }: MovementTypeBadgeProps) {
  return <Badge variant={movementColors[type] ?? 'secondary'}>{type}</Badge>;
}
