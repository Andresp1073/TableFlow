import type {
  JobScheduler as JobSchedulerInterface,
  Job,
  JobId,
  JobStatus,
  JobFilter,
  JobScheduleRequest,
  JobQueueProvider,
} from "./types.js";
import type { JobDispatcher } from "./JobDispatcher.js";
import { RetryPolicy } from "./RetryPolicy.js";

let nextId = 0;

function generateJobId(): JobId {
  const timestamp = Date.now().toString(36);
  const counter = (nextId++).toString(36).padStart(4, "0");
  const random = Math.random().toString(36).slice(2, 6);

  return `job_${timestamp}${counter}${random}`;
}

export class JobScheduler implements JobSchedulerInterface {
  private readonly jobs = new Map<JobId, Job>();

  constructor(
    private readonly dispatcher: JobDispatcher,
    private readonly provider: JobQueueProvider,
  ) {}

  async schedule(request: JobScheduleRequest): Promise<Job> {
    const resolvedType = request.type ?? "immediate";
    const now = new Date();
    let scheduledAt: Date | null = null;

    if (request.delayMs && request.delayMs > 0) {
      scheduledAt = new Date(now.getTime() + request.delayMs);
    } else if (request.scheduledAt) {
      scheduledAt = request.scheduledAt;
    }

    if (resolvedType === "immediate" || resolvedType === "retryable") {
      scheduledAt = null;
    }

    const retryPolicy = request.retryPolicy
      ? RetryPolicy.custom(request.retryPolicy)
      : RetryPolicy.default();

    const job: Job = {
      id: generateJobId(),
      name: request.name,
      type: resolvedType,
      data: request.data,
      status: "pending",
      priority: request.priority ?? "normal",
      createdAt: now,
      scheduledAt,
      retryCount: 0,
      maxRetries: retryPolicy.maxRetries,
      tags: request.tags ?? [],
      metadata: {
        ...(request.metadata ?? {}),
        retryPolicy,
      },
    };

    this.jobs.set(job.id, job);
    await this.dispatcher.dispatch(job);

    return job;
  }

  async cancel(jobId: JobId): Promise<boolean> {
    const job = this.jobs.get(jobId);

    if (!job) {
      return false;
    }

    if (job.status === "running") {
      return false;
    }

    job.status = "cancelled";

    return true;
  }

  async pause(jobId: JobId): Promise<boolean> {
    const job = this.jobs.get(jobId);

    if (!job || job.status !== "pending") {
      return false;
    }

    job.status = "cancelled";

    return true;
  }

  async resume(jobId: JobId): Promise<boolean> {
    const job = this.jobs.get(jobId);

    if (!job || job.status !== "cancelled") {
      return false;
    }

    job.status = "pending";

    await this.provider.enqueue(job);

    return true;
  }

  async getStatus(jobId: JobId): Promise<JobStatus | null> {
    const job = this.jobs.get(jobId);

    return job?.status ?? null;
  }

  async getJob(jobId: JobId): Promise<Job | null> {
    return this.jobs.get(jobId) ?? null;
  }

  async list(filter?: JobFilter): Promise<Job[]> {
    let results = Array.from(this.jobs.values());

    if (filter) {
      if (filter.status && filter.status.length > 0) {
        results = results.filter((j) => filter.status!.includes(j.status));
      }

      if (filter.name) {
        results = results.filter((j) => j.name === filter.name);
      }

      if (filter.type) {
        results = results.filter((j) => j.type === filter.type);
      }

      if (filter.priority) {
        results = results.filter((j) => j.priority === filter.priority);
      }

      if (filter.tags && filter.tags.length > 0) {
        results = results.filter((j) => filter.tags!.some((t) => j.tags.includes(t)));
      }

      if (filter.createdAfter) {
        results = results.filter((j) => j.createdAt >= filter.createdAfter!);
      }

      if (filter.createdBefore) {
        results = results.filter((j) => j.createdAt <= filter.createdBefore!);
      }
    }

    return results;
  }
}
