export interface UpdateTableCommand {
  id: string;
  restaurantId: string;
  branchId?: string;
  diningAreaId?: string | null;
  tableTypeId?: string | null;
  tableNumber: string;
  name?: string | null;
  description?: string | null;
  minimumCapacity: number;
  maximumCapacity: number;
  currentCapacity?: number;
  shape?: string;
  width?: number;
  height?: number;
  positionX?: number | null;
  positionY?: number | null;
  rotation?: number | null;
  qrIdentifier?: string | null;
  isReservable?: boolean;
  isAccessible?: boolean;
  isActive?: boolean;
  status?: string;
  metadata?: Record<string, unknown> | null;
}
