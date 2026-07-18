'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORY_OPTIONS, PO_STATUS_OPTIONS, MOVEMENT_TYPE_OPTIONS } from '@/lib/inventory-types';

interface InventoryFiltersProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  category?: string;
  onCategoryChange?: (value: string) => void;
  status?: string;
  onStatusChange?: (value: string) => void;
  movementType?: string;
  onMovementTypeChange?: (value: string) => void;
  showCategory?: boolean;
  showStatus?: boolean;
  showMovementType?: boolean;
}

export function InventoryFilters({
  search, onSearchChange,
  category, onCategoryChange,
  status, onStatusChange,
  movementType, onMovementTypeChange,
  showCategory, showStatus, showMovementType,
}: InventoryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {onSearchChange && (
        <Input
          placeholder="Search..."
          value={search ?? ''}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
          aria-label="Search"
        />
      )}
      {showCategory && onCategoryChange && (
        <Select value={category ?? 'all'} onValueChange={(v) => onCategoryChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showStatus && onStatusChange && (
        <Select value={status ?? 'all'} onValueChange={(v) => onStatusChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PO_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showMovementType && onMovementTypeChange && (
        <Select value={movementType ?? 'all'} onValueChange={(v) => onMovementTypeChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {MOVEMENT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
