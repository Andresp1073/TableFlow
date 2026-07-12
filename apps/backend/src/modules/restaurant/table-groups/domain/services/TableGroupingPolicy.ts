import type { TableGroupStatus } from "../models/TableGroupStatus.js";
import type { TableGroupMember } from "../models/TableGroupMember.js";
import { InsufficientTablesError } from "../../errors/InsufficientTablesError.js";
import { DuplicateTableInGroupError } from "../../errors/DuplicateTableInGroupError.js";
import { InvalidRestaurantGroupError } from "../../errors/InvalidRestaurantGroupError.js";
import { InvalidTableGroupError } from "../../errors/InvalidTableGroupError.js";

export interface TableSnapshot {
  id: string;
  restaurantId: string;
  status: { value: string; isArchived?(): boolean };
}

export class TableGroupingPolicy {
  validateMinimumMembers(members: TableGroupMember[]): void {
    if (members.length < 2) {
      throw new InsufficientTablesError(members.length);
    }
  }

  validateNoDuplicateTables(members: TableGroupMember[]): void {
    const tableIds = new Set<string>();
    for (const member of members) {
      if (tableIds.has(member.tableId)) {
        throw new DuplicateTableInGroupError(member.tableId);
      }
      tableIds.add(member.tableId);
    }
  }

  validateSameRestaurant(tables: TableSnapshot[], restaurantId: string): void {
    for (const table of tables) {
      if (table.restaurantId !== restaurantId) {
        throw new InvalidRestaurantGroupError(table.id, table.restaurantId, restaurantId);
      }
    }
  }

  validateNoArchivedTables(tables: TableSnapshot[]): void {
    for (const table of tables) {
      const isArchived = typeof table.status.isArchived === "function"
        ? table.status.isArchived()
        : table.status.value === "archived";
      if (isArchived) {
        throw new InvalidTableGroupError(
          `Table "${table.id}" is archived and cannot be grouped`,
        );
      }
    }
  }

  validateTablesNotInActiveGroup(
    tables: TableSnapshot[],
    activeGroupTableIds: string[],
  ): void {
    for (const table of tables) {
      if (activeGroupTableIds.includes(table.id)) {
        throw new InvalidTableGroupError(
          `Table "${table.id}" is already part of an active group`,
        );
      }
    }
  }

  validateNotTerminal(status: TableGroupStatus): void {
    if (status.isTerminal()) {
      throw new InvalidTableGroupError(
        `Cannot modify a table group in '${status.value}' state`,
      );
    }
  }

  validateForCreation(
    members: TableGroupMember[],
    tables: TableSnapshot[],
    restaurantId: string,
    activeGroupTableIds: string[],
  ): void {
    this.validateMinimumMembers(members);
    this.validateNoDuplicateTables(members);
    this.validateSameRestaurant(tables, restaurantId);
    this.validateNoArchivedTables(tables);
    this.validateTablesNotInActiveGroup(tables, activeGroupTableIds);
  }
}
