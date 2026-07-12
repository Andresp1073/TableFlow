import type { TableGroupStatus } from "../models/TableGroupStatus.js";
import type { CreateTableGroupMemberData } from "../models/TableGroupMember.js";
import { InsufficientTablesError } from "../../errors/InsufficientTablesError.js";
import { DuplicateTableInGroupError } from "../../errors/DuplicateTableInGroupError.js";
import { InvalidRestaurantGroupError } from "../../errors/InvalidRestaurantGroupError.js";
import { InvalidTableGroupError } from "../../errors/InvalidTableGroupError.js";

export interface TableCheck {
  id: string;
  restaurantId: string;
  status: { value: string };
}

export class TableGroupRules {
  static validateMinimumMembers(members: CreateTableGroupMemberData[]): void {
    if (members.length < 2) {
      throw new InsufficientTablesError(members.length);
    }
  }

  static validateNoDuplicateTables(members: CreateTableGroupMemberData[]): void {
    const tableIds = new Set<string>();
    for (const member of members) {
      if (tableIds.has(member.tableId)) {
        throw new DuplicateTableInGroupError(member.tableId);
      }
      tableIds.add(member.tableId);
    }
  }

  static validateAllTablesSameRestaurant(tables: TableCheck[], restaurantId: string): void {
    for (const table of tables) {
      if (table.restaurantId !== restaurantId) {
        throw new InvalidRestaurantGroupError(table.id, table.restaurantId, restaurantId);
      }
    }
  }

  static validateTablesNotInActiveGroup(
    tables: TableCheck[],
    activeGroupTableIds: string[],
  ): void {
    for (const table of tables) {
      if (activeGroupTableIds.includes(table.id)) {
        throw new InvalidTableGroupError(`Table "${table.id}" is already part of an active group`);
      }
    }
  }

  static validateTablesStatus(tables: TableCheck[]): void {
    const invalidStatuses = ["occupied", "maintenance"];
    for (const table of tables) {
      if (invalidStatuses.includes(table.status.value)) {
        throw new InvalidTableGroupError(
          `Table "${table.id}" has status "${table.status.value}" and cannot be grouped`,
        );
      }
    }
  }

  static validateNotTerminal(status: TableGroupStatus): void {
    if (status.isTerminal()) {
      throw new InvalidTableGroupError(
        `Cannot modify a table group in '${status.value}' state`,
      );
    }
  }
}
