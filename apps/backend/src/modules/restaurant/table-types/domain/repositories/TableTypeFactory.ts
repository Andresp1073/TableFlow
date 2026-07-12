import type { TableType } from "../models/TableType.js";
import type { TableTypeName } from "../models/TableTypeName.js";
import type { TableTypeCode } from "../models/TableTypeCode.js";
import type { TableCapacity } from "../models/TableCapacity.js";
import type { TableShape } from "../models/TableShape.js";
import type { DisplayOrder } from "../models/DisplayOrder.js";
import type { TableTypeStatus } from "../models/TableTypeStatus.js";

export interface CreateTableTypeData {
  restaurantId: string;
  name: TableTypeName;
  code: TableTypeCode;
  description?: string | null;
  defaultCapacity: TableCapacity;
  minimumCapacity: TableCapacity;
  maximumCapacity: TableCapacity;
  shape: TableShape;
  isReservable?: boolean;
  displayOrder: DisplayOrder;
  status?: TableTypeStatus;
  metadata?: Record<string, unknown> | null;
}

export interface ReconstituteTableTypeData {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  description: string | null;
  defaultCapacity: number;
  minimumCapacity: number;
  maximumCapacity: number;
  shape: string;
  isReservable: boolean;
  displayOrder: number;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableTypeFactory {
  create(data: CreateTableTypeData): TableType;
  reconstitute(data: ReconstituteTableTypeData): TableType;
}
