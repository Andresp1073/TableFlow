import type { Logger } from "../observability/types.js";
import type { CacheProvider } from "../cache/types.js";

export type JobId = string;
export type JobName = string;

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | "retrying";

export type JobType = "immediate" | "delayed" | "scheduled" | "recurring" | "retryable";

export type JobPriority = "low" | "normal" | "high" | "critical";

export interface Job {
  readonly id: JobId;
  readonly name: JobName;
  readonly type: JobType;
  readonly data: Record<string, unknown>;
  status: JobStatus;
  readonly priority: JobPriority;
  readonly createdAt: Date;
  readonly scheduledAt: Date | null;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  retryCount: number;
  readonly maxRetries: number;
  error?: string;
  readonly tags: string[];
  readonly metadata: Record<string, unknown>;
}

export interface JobContext {
  readonly job: Job;
  readonly logger: Logger;
  readonly cache: CacheProvider;
  readonly abortSignal: AbortSignal;
  readonly metadata: Record<string, unknown>;
  setProgress(progress: number): void;
  setMetadata(key: string, value: unknown): void;
  getMetadata(key: string): unknown;
  getProgress(): number;
}

export interface JobHandler {
  readonly jobName: JobName;
  execute(context: JobContext): Promise<JobResult>;
}

export interface JobResult {
  status: "completed" | "failed" | "retry";
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
  retryDelay?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  deadLetterEnabled: boolean;
  deadLetterQueue?: string;
  retryableErrors: string[];
}

export interface JobScheduleRequest {
  name: JobName;
  data: Record<string, unknown>;
  type?: JobType;
  priority?: JobPriority;
  delayMs?: number;
  scheduledAt?: Date;
  cronExpression?: string;
  retryPolicy?: Partial<RetryPolicy>;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface JobFilter {
  status?: JobStatus[];
  name?: JobName;
  type?: JobType;
  priority?: JobPriority;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface JobScheduler {
  schedule(request: JobScheduleRequest): Promise<Job>;
  cancel(jobId: JobId): Promise<boolean>;
  pause(jobId: JobId): Promise<boolean>;
  resume(jobId: JobId): Promise<boolean>;
  getStatus(jobId: JobId): Promise<JobStatus | null>;
  list(filter?: JobFilter): Promise<Job[]>;
  getJob(jobId: JobId): Promise<Job | null>;
}

export interface JobDispatcher {
  dispatch(job: Job): Promise<void>;
  processNext(): Promise<boolean>;
  processAll(): Promise<number>;
  registerProvider(provider: JobQueueProvider): void;
}

export interface JobQueueProvider {
  readonly name: string;
  enqueue(job: Job): Promise<void>;
  dequeue(): Promise<Job | null>;
  acknowledge(jobId: JobId): Promise<void>;
  nack(jobId: JobId, delayMs?: number): Promise<void>;
  requeue(job: Job, delayMs?: number): Promise<void>;
  length(): Promise<number>;
}

export interface JobExecutor {
  execute(job: Job): Promise<JobResult>;
  canExecute(job: Job): boolean;
}

export interface JobRegistry {
  register(handler: JobHandler): void;
  unregister(jobName: JobName): void;
  getHandler(jobName: JobName): JobHandler | null;
  hasHandler(jobName: JobName): boolean;
  listHandlers(): JobName[];
}

export function isJobFinal(status: JobStatus): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}

export function isJobActive(status: JobStatus): boolean {
  return status === "pending" || status === "running" || status === "retrying";
}
