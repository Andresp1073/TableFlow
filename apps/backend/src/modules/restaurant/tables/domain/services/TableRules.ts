import { TableStatus } from "../models/TableStatus.js";
import type { TableCapacity } from "../models/TableCapacity.js";

export class TableRules {
  static validateCapacityRange(min: TableCapacity, max: TableCapacity): void {
    if (min.value > max.value) {
      throw new Error("Minimum capacity must not exceed maximum capacity");
    }
  }

  static validateCurrentCapacity(
    current: TableCapacity,
    min: TableCapacity,
    max: TableCapacity,
  ): void {
    if (current.value < min.value) {
      throw new Error("Current capacity must not be less than minimum capacity");
    }
    if (current.value > max.value) {
      throw new Error("Current capacity must not exceed maximum capacity");
    }
  }

  static validateStatusTransition(currentStatus: string, newStatus: string): void {
    if (currentStatus === newStatus) return;
    const current = TableStatus.reconstitute(currentStatus);
    if (!current.isTransitionValid(newStatus as any)) {
      throw new Error(
        `Cannot transition table from '${currentStatus}' to '${newStatus}'`,
      );
    }
  }

  static validateNotDeleted(deletedAt: Date | null): void {
    if (deletedAt) {
      throw new Error("Cannot modify a deleted table");
    }
  }

  static validateNotArchived(status: string): void {
    if (status === "archived") {
      throw new Error("Cannot modify an archived table");
    }
  }

  static validateTransitionOnTerminal(status: string): void {
    const current = TableStatus.reconstitute(status);
    if (current.isTerminal()) {
      throw new Error(`Table is in terminal state '${status}' and cannot be modified`);
    }
  }
}
