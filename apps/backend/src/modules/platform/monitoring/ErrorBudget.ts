import type { ErrorBudgetResult } from "./types.js";

export class ErrorBudget {
  readonly sloName: string;
  readonly totalBudget: number;
  readonly budgetTarget: number;

  private remaining: number;
  private consumed: number;
  private consumptionHistory: number[] = [];
  private lastUpdated: Date;

  constructor(sloName: string, sloTarget: number) {
    this.sloName = sloName;
    this.totalBudget = 100 - sloTarget;
    this.budgetTarget = sloTarget;
    this.remaining = this.totalBudget;
    this.consumed = 0;
    this.lastUpdated = new Date();
  }

  consume(amount: number): ErrorBudgetResult {
    this.consumed = Math.min(this.totalBudget, this.consumed + amount);
    this.remaining = Math.max(0, this.totalBudget - this.consumed);
    this.consumptionHistory.push(amount);
    this.lastUpdated = new Date();

    return this.toResult();
  }

  getRemaining(): number {
    return this.remaining;
  }

  getConsumed(): number {
    return this.consumed;
  }

  getConsumptionRate(): number {
    if (this.consumptionHistory.length === 0) {
      return 0;
    }
    const sum = this.consumptionHistory.reduce((a, b) => a + b, 0);
    return sum / this.consumptionHistory.length;
  }

  isExhausted(): boolean {
    return this.remaining <= 0;
  }

  isWarning(): boolean {
    const warningThreshold = this.totalBudget * 0.5;
    return this.consumed >= warningThreshold && !this.isExhausted();
  }

  getStatus(): "healthy" | "warning" | "exhausted" {
    if (this.isExhausted()) {
      return "exhausted";
    }
    if (this.isWarning()) {
      return "warning";
    }
    return "healthy";
  }

  reset(): void {
    this.remaining = this.totalBudget;
    this.consumed = 0;
    this.consumptionHistory = [];
    this.lastUpdated = new Date();
  }

  toResult(): ErrorBudgetResult {
    return {
      sloName: this.sloName,
      totalBudget: this.totalBudget,
      remaining: this.remaining,
      consumed: this.consumed,
      consumptionRate: this.getConsumptionRate(),
      status: this.getStatus(),
      lastUpdated: this.lastUpdated,
    };
  }
}
