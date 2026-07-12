import type { TableNumber } from "./TableNumber.js";
import type { TableName } from "./TableName.js";
import type { TableCapacity } from "./TableCapacity.js";
import type { TableStatus } from "./TableStatus.js";
import type { TablePosition } from "./TablePosition.js";
import type { TableRotation } from "./TableRotation.js";
import type { QrIdentifier } from "./QrIdentifier.js";

export interface Table {
  id: string;
  restaurantId: string;
  branchId: string;
  diningAreaId: string | null;
  tableTypeId: string | null;
  tableNumber: TableNumber;
  name: TableName | null;
  description: string | null;
  minimumCapacity: TableCapacity;
  maximumCapacity: TableCapacity;
  currentCapacity: TableCapacity;
  shape: string;
  width: number;
  height: number;
  position: TablePosition | null;
  rotation: TableRotation | null;
  qrIdentifier: QrIdentifier | null;
  isReservable: boolean;
  isAccessible: boolean;
  isActive: boolean;
  status: TableStatus;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
