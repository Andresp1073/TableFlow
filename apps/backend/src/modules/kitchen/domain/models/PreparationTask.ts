export enum TaskStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
  Skipped = "skipped",
}

export interface PreparationTaskConfig {
  id: string;
  ticketId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  status: TaskStatus;
  stationId: string;
  modifiers: string[];
  notes?: string;
  startedAt: Date | null;
  completedAt: Date | null;
  estimatedPrepTimeSeconds: number;
}

export class PreparationTask {
  private constructor(public readonly value: PreparationTaskConfig) {}

  static create(config: Omit<PreparationTaskConfig, "status" | "startedAt" | "completedAt">): PreparationTask {
    return new PreparationTask({
      ...config,
      status: TaskStatus.Pending,
      startedAt: null,
      completedAt: null,
    });
  }

  static reconstitute(config: PreparationTaskConfig): PreparationTask {
    return new PreparationTask(config);
  }

  equals(other: PreparationTask): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get ticketId(): string {
    return this.value.ticketId;
  }

  get menuItemId(): string {
    return this.value.menuItemId;
  }

  get menuItemName(): string {
    return this.value.menuItemName;
  }

  get quantity(): number {
    return this.value.quantity;
  }

  get status(): TaskStatus {
    return this.value.status;
  }

  get stationId(): string {
    return this.value.stationId;
  }

  get modifiers(): readonly string[] {
    return this.value.modifiers;
  }

  get notes(): string | undefined {
    return this.value.notes;
  }

  get startedAt(): Date | null {
    return this.value.startedAt;
  }

  get completedAt(): Date | null {
    return this.value.completedAt;
  }

  get estimatedPrepTimeSeconds(): number {
    return this.value.estimatedPrepTimeSeconds;
  }

  start(): PreparationTask {
    if (this.value.status !== TaskStatus.Pending) {
      throw new Error(`Cannot start task in status: ${this.value.status}`);
    }
    return PreparationTask.reconstitute({
      ...this.value,
      status: TaskStatus.InProgress,
      startedAt: new Date(),
    });
  }

  complete(): PreparationTask {
    if (this.value.status !== TaskStatus.InProgress) {
      throw new Error(`Cannot complete task in status: ${this.value.status}`);
    }
    return PreparationTask.reconstitute({
      ...this.value,
      status: TaskStatus.Completed,
      completedAt: new Date(),
    });
  }

  skip(): PreparationTask {
    return PreparationTask.reconstitute({
      ...this.value,
      status: TaskStatus.Skipped,
    });
  }

  getElapsedSeconds(): number | null {
    if (!this.value.startedAt) return null;
    const end = this.value.completedAt ?? new Date();
    return (end.getTime() - this.value.startedAt.getTime()) / 1000;
  }

  isOverdue(): boolean {
    const elapsed = this.getElapsedSeconds();
    if (elapsed === null) return false;
    return elapsed > this.value.estimatedPrepTimeSeconds * 1.5;
  }
}
