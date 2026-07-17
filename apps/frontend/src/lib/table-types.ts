export type TableShape = 'square' | 'rectangle' | 'round' | 'oval' | 'custom';

export type TableStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'cleaning'
  | 'out_of_service'
  | 'blocked'
  | 'maintenance'
  | 'archived';

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  branchId: string;
  diningAreaId: string | null;
  tableTypeId: string | null;
  tableNumber: string;
  name: string | null;
  description: string | null;
  minimumCapacity: number;
  maximumCapacity: number;
  currentCapacity: number;
  shape: TableShape;
  width: number;
  height: number;
  positionX: number | null;
  positionY: number | null;
  rotation: number | null;
  qrIdentifier: string | null;
  isReservable: boolean;
  isAccessible: boolean;
  isActive: boolean;
  status: TableStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TableCreateInput {
  branchId: string;
  diningAreaId?: string | null;
  tableTypeId?: string | null;
  tableNumber: string;
  name?: string | null;
  description?: string | null;
  minimumCapacity: number;
  maximumCapacity: number;
  currentCapacity?: number;
  shape?: TableShape;
  width?: number;
  height?: number;
  positionX?: number | null;
  positionY?: number | null;
  rotation?: number | null;
  qrIdentifier?: string | null;
  isReservable?: boolean;
  isAccessible?: boolean;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface TableUpdateInput {
  diningAreaId?: string | null;
  tableTypeId?: string | null;
  tableNumber?: string;
  name?: string | null;
  description?: string | null;
  minimumCapacity?: number;
  maximumCapacity?: number;
  currentCapacity?: number;
  shape?: TableShape;
  width?: number;
  height?: number;
  positionX?: number | null;
  positionY?: number | null;
  rotation?: number | null;
  qrIdentifier?: string | null;
  isReservable?: boolean;
  isAccessible?: boolean;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface TableListParams {
  diningAreaId?: string;
  tableTypeId?: string;
  status?: TableStatus;
  isReservable?: boolean;
  isActive?: boolean;
  minCapacity?: number;
}

export interface StatusChangeInput {
  status: string;
  reason?: string;
}

export interface StatusChangeResult {
  id: string;
  tableNumber: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: string;
}

export interface StatusTransition {
  status: string;
  allowedTransitions: string[];
}

export interface TableAvailabilityInfo {
  tableId: string;
  available: boolean;
  reason: string | null;
  metadata?: Record<string, unknown>;
}

export interface ListAvailableTablesResult {
  availableTables: TableAvailabilityInfo[];
  totalTables: number;
  availableCount: number;
}

export const TABLE_STATUS_OPTIONS: { value: TableStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'out_of_service', label: 'Out of Service' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const TABLE_SHAPE_OPTIONS: { value: TableShape; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'round', label: 'Round' },
  { value: 'oval', label: 'Oval' },
];

export const TABLE_STATUS_VARIANTS: Record<TableStatus, 'success' | 'warning' | 'danger' | 'info' | 'default' | 'secondary'> = {
  available: 'success',
  occupied: 'danger',
  reserved: 'warning',
  cleaning: 'info',
  out_of_service: 'default',
  blocked: 'secondary',
  maintenance: 'default',
  archived: 'default',
};

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  cleaning: 'Cleaning',
  out_of_service: 'Out of Service',
  blocked: 'Blocked',
  maintenance: 'Maintenance',
  archived: 'Archived',
};

export const TABLE_STATUS_COLORS: Record<TableStatus, string> = {
  available: '#22c55e',
  occupied: '#ef4444',
  reserved: '#f59e0b',
  cleaning: '#3b82f6',
  out_of_service: '#6b7280',
  blocked: '#8b5cf6',
  maintenance: '#f97316',
  archived: '#9ca3af',
};
