import { TableStatus, type TableStatusValue } from "../models/TableStatus.js";

export interface PolicyValidationResult {
  allowed: boolean;
  reason?: string;
}

export class TableStatusPolicy {
  canTransitionOnTable(tableStatus: TableStatusValue): PolicyValidationResult {
    const status = TableStatus.reconstitute(tableStatus);
    if (status.isTerminal()) {
      return { allowed: false, reason: `Table is archived and cannot change status` };
    }
    return { allowed: true };
  }

  canServeGuests(status: TableStatusValue): PolicyValidationResult {
    const availableStatuses: TableStatusValue[] = ["available"];
    if (availableStatuses.includes(status)) {
      return { allowed: true };
    }
    return { allowed: false, reason: `Table in status '${status}' cannot serve guests` };
  }

  canBeReserved(status: TableStatusValue): PolicyValidationResult {
    const reservableStatuses: TableStatusValue[] = ["available"];
    if (reservableStatuses.includes(status)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `Table in status '${status}' cannot be reserved; only 'available' tables can be reserved`,
    };
  }

  isAvailableTransition(from: TableStatusValue, to: TableStatusValue): boolean {
    return to === "available";
  }

  requiresCleaning(status: TableStatusValue): boolean {
    return status === "cleaning";
  }

  isMaintenanceRequired(status: TableStatusValue): boolean {
    return status === "maintenance" || status === "out_of_service";
  }

  canBeMerged(status: TableStatusValue): PolicyValidationResult {
    if (status === "available") {
      return { allowed: true };
    }
    return { allowed: false, reason: `Cannot merge a table with status '${status}'; only 'available' tables can be merged` };
  }
}
