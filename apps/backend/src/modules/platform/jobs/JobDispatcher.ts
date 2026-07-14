import type {
  JobDispatcher as JobDispatcherInterface,
  Job,
  JobQueueProvider,
  JobResult,
} from "./types.js";
import type { JobExecutor } from "./JobExecutor.js";

export class JobDispatcher implements JobDispatcherInterface {
  private provider: JobQueueProvider | null = null;
  private readonly executor: JobExecutor;

  constructor(executor: JobExecutor) {
    this.executor = executor;
  }

  registerProvider(provider: JobQueueProvider): void {
    this.provider = provider;
  }

  async dispatch(job: Job): Promise<void> {
    if (!this.provider) {
      throw new Error("No queue provider registered. Call registerProvider() first.");
    }

    await this.provider.enqueue(job);
  }

  async processNext(): Promise<boolean> {
    if (!this.provider) {
      throw new Error("No queue provider registered. Call registerProvider() first.");
    }

    const job = await this.provider.dequeue();

    if (!job) {
      return false;
    }

    try {
      job.status = "running";
      job.startedAt = new Date();

      const result = await this.executor.execute(job);

      if (result.status === "completed") {
        job.status = "completed";
        job.completedAt = new Date();
        await this.provider.acknowledge(job.id);
      } else if (result.status === "retry") {
        job.retryCount++;
        job.status = "retrying";
        await this.provider.requeue(job, result.retryDelay);
      } else {
        job.status = "failed";
        job.failedAt = new Date();
        await this.provider.acknowledge(job.id);
      }
    } catch (error) {
      job.status = "failed";
      job.failedAt = new Date();
      job.error = error instanceof Error ? error.message : String(error);
      await this.provider.acknowledge(job.id);
    }

    return true;
  }

  async processAll(): Promise<number> {
    let count = 0;

    while (await this.processNext()) {
      count++;
    }

    return count;
  }
}
