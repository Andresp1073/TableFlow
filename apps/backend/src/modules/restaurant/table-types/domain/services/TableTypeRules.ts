import { TableCapacity } from "../models/TableCapacity.js";

export class TableTypeRules {
  static validateCapacityRange(min: TableCapacity, def: TableCapacity, max: TableCapacity): void {
    if (min.value > def.value) {
      throw new Error("Minimum capacity must not exceed default capacity");
    }
    if (def.value > max.value) {
      throw new Error("Default capacity must not exceed maximum capacity");
    }
    if (min.value > max.value) {
      throw new Error("Minimum capacity must not exceed maximum capacity");
    }
  }

  static validateStatusTransition(currentStatus: string, newStatus: string): void {
    if (currentStatus === "archived") {
      throw new Error("Cannot modify an archived table type");
    }
    if (currentStatus === newStatus) {
      return;
    }
    if (currentStatus === "active" && newStatus !== "archived") {
      throw new Error("Active table types can only be transitioned to archived");
    }
  }

  static validateNotArchived(status: string): void {
    if (status === "archived") {
      throw new Error("Cannot modify an archived table type");
    }
  }
}
