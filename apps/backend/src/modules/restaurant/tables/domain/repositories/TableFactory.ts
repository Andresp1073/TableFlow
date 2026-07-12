import type { Table } from "../models/Table.js";
import type { TableNumber } from "../models/TableNumber.js";
import type { TableName } from "../models/TableName.js";
import type { TableCapacity } from "../models/TableCapacity.js";
import type { TableStatus } from "../models/TableStatus.js";
import type { TablePosition } from "../models/TablePosition.js";
import type { TableRotation } from "../models/TableRotation.js";
import type { QrIdentifier } from "../models/QrIdentifier.js";

export interface CreateTableData {
  restaurantId: string;
  branchId: string;
  diningAreaId?: string | null;
  tableTypeId?: string | null;
  tableNumber: TableNumber;
  name?: TableName | null;
  description?: string | null;
  minimumCapacity: TableCapacity;
  maximumCapacity: TableCapacity;
  currentCapacity?: TableCapacity;
  shape?: string;
  width?: number;
  height?: number;
  position?: TablePosition | null;
  rotation?: TableRotation | null;
  qrIdentifier?: QrIdentifier | null;
  isReservable?: boolean;
  isAccessible?: boolean;
  isActive?: boolean;
  status?: TableStatus;
  metadata?: Record<string, unknown> | null;
}

export interface ReconstituteTableData {
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
  shape: string;
  width: number;
  height: number;
  positionX: number | null;
  positionY: number | null;
  rotation: number | null;
  qrIdentifier: string | null;
  isReservable: boolean;
  isAccessible: boolean;
  isActive: boolean;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TableFactory {
  create(data: CreateTableData): Table;
  reconstitute(data: ReconstituteTableData): Table;
}
