import type { TableGroupId } from "./TableGroupId.js";
import type { TableGroupStatus } from "./TableGroupStatus.js";
import type { TableGroupName } from "./TableGroupName.js";
import type { TableGroupMember } from "./TableGroupMember.js";

export interface TableGroup {
  id: TableGroupId;
  restaurantId: string;
  name: TableGroupName;
  description: string | null;
  status: TableGroupStatus;
  isActive: boolean;
  createdBy: string;
  members: TableGroupMember[];
  createdAt: Date;
  updatedAt: Date;
  releasedAt: Date | null;
}
