import { randomUUID } from "node:crypto";
import type { TableGroup } from "../../domain/models/TableGroup.js";
import type { TableGroupMember } from "../../domain/models/TableGroupMember.js";
import { TableGroupId } from "../../domain/models/TableGroupId.js";
import { TableGroupName } from "../../domain/models/TableGroupName.js";
import { TableGroupStatus } from "../../domain/models/TableGroupStatus.js";
import { DisplayOrder } from "../../domain/models/DisplayOrder.js";
import type {
  TableGroupFactory,
  CreateTableGroupData,
  ReconstituteTableGroupData,
} from "../../domain/repositories/TableGroupFactory.js";

export class ConcreteTableGroupFactory implements TableGroupFactory {
  create(data: CreateTableGroupData): TableGroup {
    const now = new Date();
    const members: TableGroupMember[] = data.members.map((m) => ({
      tableId: m.tableId,
      displayOrder: m.displayOrder,
      joinedAt: m.joinedAt ?? now,
    }));

    return {
      id: TableGroupId.create(randomUUID()),
      restaurantId: data.restaurantId,
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? TableGroupStatus.create("active"),
      isActive: true,
      createdBy: data.createdBy,
      members,
      createdAt: now,
      updatedAt: now,
      releasedAt: null,
    };
  }

  reconstitute(data: ReconstituteTableGroupData): TableGroup {
    const members: TableGroupMember[] = (data.members ?? []).map((m) => ({
      tableId: m.tableId,
      displayOrder: DisplayOrder.reconstitute(m.displayOrder),
      joinedAt: m.joinedAt,
    }));

    return {
      id: TableGroupId.reconstitute(data.id),
      restaurantId: data.restaurantId,
      name: TableGroupName.reconstitute(data.name),
      description: data.description,
      status: TableGroupStatus.reconstitute(data.status),
      isActive: data.isActive,
      createdBy: data.createdBy,
      members,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      releasedAt: data.releasedAt,
    };
  }
}
