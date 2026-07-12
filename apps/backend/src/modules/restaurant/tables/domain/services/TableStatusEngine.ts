import { TableStatus, type TableStatusValue } from "../models/TableStatus.js";
import type { Table } from "../models/Table.js";
import { TableStateMachine } from "./TableStateMachine.js";
import { TableTransitionValidator } from "./TableTransitionValidator.js";
import { TableStatusPolicy } from "./TableStatusPolicy.js";

export interface StatusChangeResult {
  table: Table;
  previousStatus: TableStatusValue;
  newStatus: TableStatusValue;
}

export class TableStatusEngine {
  private readonly stateMachine: TableStateMachine;
  private readonly transitionValidator: TableTransitionValidator;
  private readonly statusPolicy: TableStatusPolicy;

  constructor() {
    this.stateMachine = new TableStateMachine();
    this.transitionValidator = new TableTransitionValidator();
    this.statusPolicy = new TableStatusPolicy();
  }

  getStateMachine(): TableStateMachine {
    return this.stateMachine;
  }

  getTransitionValidator(): TableTransitionValidator {
    return this.transitionValidator;
  }

  getStatusPolicy(): TableStatusPolicy {
    return this.statusPolicy;
  }

  changeStatus(table: Table, newStatusValue: string): StatusChangeResult {
    const previousStatus = table.status.value;
    const newStatus = TableStatus.create(newStatusValue);

    const deletedCheck = this.transitionValidator.validateTransitionOnDeleted(table.deletedAt);
    if (!deletedCheck.valid) {
      throw new Error(deletedCheck.error);
    }

    const terminalCheck = this.transitionValidator.validateTransitionOnTerminal(previousStatus);
    if (!terminalCheck.valid) {
      throw new Error(terminalCheck.error);
    }

    const transitionCheck = this.transitionValidator.validate(previousStatus, newStatus.value);
    if (!transitionCheck.valid) {
      throw new Error(transitionCheck.error);
    }

    const policyCheck = this.statusPolicy.canTransitionOnTable(newStatus.value);
    if (!policyCheck.allowed) {
      throw new Error(policyCheck.reason);
    }

    const updatedTable: Table = {
      ...table,
      status: newStatus,
      updatedAt: new Date(),
      isActive: newStatus.value !== "archived",
    };

    return {
      table: updatedTable,
      previousStatus: previousStatus as TableStatusValue,
      newStatus: newStatus.value as TableStatusValue,
    };
  }

  getAvailableTransitions(status: string): TableStatusValue[] {
    const current = TableStatus.reconstitute(status as TableStatusValue);
    return current.getAllowedTransitions();
  }
}
