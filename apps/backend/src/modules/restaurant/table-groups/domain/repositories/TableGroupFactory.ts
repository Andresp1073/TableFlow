import type { TableGroup } from "../models/TableGroup.js";
import type { TableGroupId } from "../models/TableGroupId.js";
import type { TableGroupName } from "../models/TableGroupName.js";
import type { TableGroupStatus } from "../models/TableGroupStatus.js";
import type { DisplayOrder } from "../models/DisplayOrder.js";

export interface CreateTableGroupData {
  restaurantId: string;
  name: TableGroupName;
  description?: string | null;
  status?: TableGroupStatus;
  createdBy: string;
  members: Array<{
    tableId: string;
    displayOrder: DisplayOrder;
    joinedAt: Date;
  }>;
}

export interface ReconstituteTableGroupData {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  status: string;
  isActive: boolean;
  createdBy: string;
  members: Array<{
    tableId: string;
    displayOrder: number;
    joinedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  releasedAt: Date | null;
}

export interface TableGroupFactory {
  create(data: CreateTableGroupData): TableGroup;
  reconstitute(data: ReconstituteTableGroupData): TableGroup;
}
