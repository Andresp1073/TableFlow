import type { TableGroup } from "../../domain/models/TableGroup.js";
import type { TableGroupDTO, TableGroupMemberDTO } from "./TableGroupDTO.js";
import type { TableGroupSummary } from "./TableGroupSummary.js";
import { GroupCapacityCalculator } from "../../domain/services/GroupCapacityCalculator.js";

export class TableGroupMapper {
  static toDTO(group: TableGroup): TableGroupDTO {
    const calculator = new GroupCapacityCalculator();
    const totalCapacity = calculator.calculate(
      group.members.map((m) => ({
        maximumCapacity: { value: 0 },
      })),
    );

    return {
      id: group.id.value,
      restaurantId: group.restaurantId,
      name: group.name.value,
      description: group.description,
      status: group.status.value,
      isActive: group.isActive,
      createdBy: group.createdBy,
      members: group.members.map(TableGroupMapper.memberToDTO),
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      releasedAt: group.releasedAt?.toISOString() ?? null,
    };
  }

  static toSummary(group: TableGroup): TableGroupSummary {
    return {
      id: group.id.value,
      restaurantId: group.restaurantId,
      name: group.name.value,
      description: group.description,
      status: group.status.value,
      isActive: group.isActive,
      memberCount: group.members.length,
      totalCapacity: 0,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    };
  }

  static toDTOList(groups: TableGroup[]): TableGroupDTO[] {
    return groups.map(TableGroupMapper.toDTO);
  }

  static toSummaryList(groups: TableGroup[]): TableGroupSummary[] {
    return groups.map(TableGroupMapper.toSummary);
  }

  private static memberToDTO(member: TableGroup["members"][number]): TableGroupMemberDTO {
    return {
      tableId: member.tableId,
      displayOrder: member.displayOrder.value,
      joinedAt: member.joinedAt.toISOString(),
    };
  }
}
