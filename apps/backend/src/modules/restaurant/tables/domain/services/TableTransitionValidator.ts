import { TableStatus, type TableStatusValue } from "../models/TableStatus.js";
import { TableStateMachine } from "./TableStateMachine.js";

export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
}

export class TableTransitionValidator {
  private readonly stateMachine: TableStateMachine;

  constructor() {
    this.stateMachine = new TableStateMachine();
  }

  validate(from: string, to: string): TransitionValidationResult {
    if (from === to) {
      return { valid: false, error: "Table is already in this status" };
    }

    let fromStatus: TableStatus;
    let toStatus: TableStatus;

    try {
      fromStatus = TableStatus.create(from);
    } catch {
      return { valid: false, error: `Invalid source status: '${from}'` };
    }

    try {
      toStatus = TableStatus.create(to);
    } catch {
      return { valid: false, error: `Invalid target status: '${to}'` };
    }

    if (!this.stateMachine.canTransition(fromStatus.value, toStatus.value)) {
      return {
        valid: false,
        error: `Cannot transition table from '${fromStatus.value}' to '${toStatus.value}'`,
      };
    }

    return { valid: true };
  }

  validateTransitionOnDeleted(deletedAt: Date | null): TransitionValidationResult {
    if (deletedAt) {
      return { valid: false, error: "Cannot modify a deleted table" };
    }
    return { valid: true };
  }

  validateTransitionOnTerminal(status: string): TransitionValidationResult {
    const tableStatus = TableStatus.reconstitute(status as TableStatusValue);
    if (this.stateMachine.isTerminal(tableStatus.value)) {
      return { valid: false, error: `Table is in terminal state '${status}' and cannot be modified` };
    }
    return { valid: true };
  }
}
