import type { DisplayOrder } from "./DisplayOrder.js";

export interface TableGroupMember {
  tableId: string;
  displayOrder: DisplayOrder;
  joinedAt: Date;
}

export interface CreateTableGroupMemberData {
  tableId: string;
  displayOrder: number;
}
