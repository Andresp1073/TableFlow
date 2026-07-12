import type { TableTypeName } from "./TableTypeName.js";
import type { TableTypeCode } from "./TableTypeCode.js";
import type { TableCapacity } from "./TableCapacity.js";
import type { TableShape } from "./TableShape.js";
import type { DisplayOrder } from "./DisplayOrder.js";
import type { TableTypeStatus } from "./TableTypeStatus.js";

export interface TableType {
  id: string;
  restaurantId: string;
  name: TableTypeName;
  code: TableTypeCode;
  description: string | null;
  defaultCapacity: TableCapacity;
  minimumCapacity: TableCapacity;
  maximumCapacity: TableCapacity;
  shape: TableShape;
  isReservable: boolean;
  displayOrder: DisplayOrder;
  status: TableTypeStatus;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
