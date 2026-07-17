export type ExecutionMode = "sync" | "async" | "scheduled";
export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface IntegrationContextConfig {
  id: string;
  integrationId: string;
  restaurantId: string;
  mode: ExecutionMode;
  status: ExecutionStatus;
  capability: string;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export class IntegrationContext {
  private constructor(private readonly config: IntegrationContextConfig) {}

  static create(config: Omit<IntegrationContextConfig, "status" | "progress" | "createdAt">): IntegrationContext {
    return new IntegrationContext({
      ...config,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
    });
  }

  static reconstitute(config: IntegrationContextConfig): IntegrationContext {
    return new IntegrationContext(config);
  }

  get id(): string { return this.config.id; }
  get integrationId(): string { return this.config.integrationId; }
  get restaurantId(): string { return this.config.restaurantId; }
  get mode(): ExecutionMode { return this.config.mode; }
  get status(): ExecutionStatus { return this.config.status; }
  get capability(): string { return this.config.capability; }
  get payload(): Record<string, unknown> { return this.config.payload; }
  get result(): Record<string, unknown> | undefined { return this.config.result; }
  get error(): string | undefined { return this.config.error; }
  get progress(): number { return this.config.progress; }
  get startedAt(): Date | undefined { return this.config.startedAt; }
  get completedAt(): Date | undefined { return this.config.completedAt; }
  get createdAt(): Date { return this.config.createdAt; }

  start(): IntegrationContext {
    return IntegrationContext.reconstitute({
      ...this.config, status: "running", progress: 0, startedAt: new Date(),
    });
  }

  updateProgress(progress: number): IntegrationContext {
    return IntegrationContext.reconstitute({ ...this.config, progress });
  }

  complete(result: Record<string, unknown>): IntegrationContext {
    return IntegrationContext.reconstitute({
      ...this.config, status: "completed", progress: 100, result, completedAt: new Date(),
    });
  }

  fail(error: string): IntegrationContext {
    return IntegrationContext.reconstitute({
      ...this.config, status: "failed", error, completedAt: new Date(),
    });
  }

  cancel(): IntegrationContext {
    return IntegrationContext.reconstitute({ ...this.config, status: "cancelled" });
  }

  isTerminal(): boolean {
    return this.config.status === "completed" || this.config.status === "failed" || this.config.status === "cancelled";
  }
}
