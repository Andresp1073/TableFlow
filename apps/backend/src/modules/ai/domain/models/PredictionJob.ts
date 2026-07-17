export type JobStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";
export type JobType = "forecast" | "recommendation" | "analysis" | "batch_inference";

export interface PredictionJobConfig {
  id: string;
  restaurantId: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  progress: number;
  retryCount: number;
  maxRetries: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export class PredictionJob {
  private constructor(private readonly config: PredictionJobConfig) {}

  static create(config: Omit<PredictionJobConfig, "status" | "progress" | "retryCount" | "createdAt" | "updatedAt">): PredictionJob {
    const now = new Date();
    return new PredictionJob({
      ...config, status: "queued", progress: 0, retryCount: 0, createdAt: now, updatedAt: now,
    });
  }

  static reconstitute(config: PredictionJobConfig): PredictionJob {
    return new PredictionJob(config);
  }

  get id(): string { return this.config.id; }
  get restaurantId(): string { return this.config.restaurantId; }
  get type(): JobType { return this.config.type; }
  get status(): JobStatus { return this.config.status; }
  get priority(): number { return this.config.priority; }
  get payload(): Record<string, unknown> { return this.config.payload; }
  get result(): Record<string, unknown> | undefined { return this.config.result; }
  get error(): string | undefined { return this.config.error; }
  get progress(): number { return this.config.progress; }
  get retryCount(): number { return this.config.retryCount; }
  get maxRetries(): number { return this.config.maxRetries; }
  get scheduledAt(): Date | undefined { return this.config.scheduledAt; }
  get startedAt(): Date | undefined { return this.config.startedAt; }
  get completedAt(): Date | undefined { return this.config.completedAt; }
  get createdBy(): string { return this.config.createdBy; }
  get createdAt(): Date { return this.config.createdAt; }

  start(): PredictionJob {
    return PredictionJob.reconstitute({
      ...this.config, status: "processing", progress: 0, startedAt: new Date(), updatedAt: new Date(),
    });
  }

  updateProgress(progress: number): PredictionJob {
    return PredictionJob.reconstitute({ ...this.config, progress, updatedAt: new Date() });
  }

  complete(result: Record<string, unknown>): PredictionJob {
    return PredictionJob.reconstitute({
      ...this.config, status: "completed", progress: 100, result, completedAt: new Date(), updatedAt: new Date(),
    });
  }

  fail(error: string): PredictionJob {
    return PredictionJob.reconstitute({
      ...this.config, status: "failed", error, completedAt: new Date(), updatedAt: new Date(),
    });
  }

  retry(): PredictionJob {
    return PredictionJob.reconstitute({
      ...this.config, status: "queued", retryCount: this.config.retryCount + 1, updatedAt: new Date(),
    });
  }

  cancel(): PredictionJob {
    return PredictionJob.reconstitute({ ...this.config, status: "cancelled", updatedAt: new Date() });
  }

  canRetry(): boolean {
    return this.config.retryCount < this.config.maxRetries && this.config.status === "failed";
  }

  isTerminal(): boolean {
    return this.config.status === "completed" || this.config.status === "cancelled";
  }
}
