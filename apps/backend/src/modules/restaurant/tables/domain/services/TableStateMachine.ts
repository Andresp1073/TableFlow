import { TableStatus, type TableStatusValue } from "../models/TableStatus.js";

export interface StateTransition {
  from: TableStatusValue;
  to: TableStatusValue;
}

export class TableStateMachine {
  private readonly transitionMatrix: Record<string, string[]>;

  constructor() {
    this.transitionMatrix = TableStatus.TRANSITION_MATRIX;
  }

  canTransition(from: TableStatusValue, to: TableStatusValue): boolean {
    const allowed = this.transitionMatrix[from];
    if (!allowed) return false;
    if (from === to) return true;
    return allowed.includes(to);
  }

  getAllowedTransitionsFrom(status: TableStatusValue): TableStatusValue[] {
    return [...(this.transitionMatrix[status] ?? [])];
  }

  getAllowedTransitions(): StateTransition[] {
    const transitions: StateTransition[] = [];
    for (const [from, toList] of Object.entries(this.transitionMatrix)) {
      for (const to of toList) {
        transitions.push({ from: from as TableStatusValue, to: to as TableStatusValue });
      }
    }
    return transitions;
  }

  isTerminal(status: TableStatusValue): boolean {
    return this.transitionMatrix[status]?.length === 0;
  }

  getStates(): TableStatusValue[] {
    return Object.keys(this.transitionMatrix) as TableStatusValue[];
  }
}
