export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  lastError?: string;
}

export interface JobHandler<T = unknown> {
  (job: Job<T>): Promise<void>;
}

export class JobQueue {
  private handlers = new Map<string, JobHandler>();
  private queue: Job[] = [];
  private processing = false;
  private concurrency: number;

  constructor(concurrency = 1) {
    this.concurrency = concurrency;
  }

  public register<T>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  public add<T>(type: string, payload: T, maxAttempts = 3): void {
    const job: Job<T> = {
      id: crypto.randomUUID(),
      type,
      payload,
      attempts: 0,
      maxAttempts,
      createdAt: new Date(),
    };

    this.queue.push(job as Job);
    void this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();

      if (!job) continue;

      const handler = this.handlers.get(job.type);

      if (!handler) {
        console.warn(`[JobQueue] No handler registered for job type: "${job.type}"`);
        continue;
      }

      try {
        job.attempts += 1;
        await handler(job);
      } catch (error) {
        job.lastError = error instanceof Error ? error.message : String(error);

        if (job.attempts < job.maxAttempts) {
          this.queue.push(job);
          console.warn(
            `[JobQueue] Job "${job.type}" failed (attempt ${job.attempts}/${job.maxAttempts}). Retrying...`,
          );
        } else {
          console.error(
            `[JobQueue] Job "${job.type}" failed after ${job.maxAttempts} attempts:`,
            job.lastError,
          );
        }
      }
    }

    this.processing = false;
  }

  public get pending(): number {
    return this.queue.length;
  }
}

export const jobQueue = new JobQueue(3);
