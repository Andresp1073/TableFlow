import type { JobQueueProvider, Job, JobId, JobPriority } from "./types.js";

const PRIORITY_ORDER: Record<JobPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

interface QueueEntry {
  job: Job;
  enqueuedAt: Date;
  visibleAt: Date;
}

export class InMemoryJobQueue implements JobQueueProvider {
  readonly name = "in-memory";
  private readonly queue: QueueEntry[] = [];
  private readonly processing = new Set<JobId>();
  private readonly delayed: QueueEntry[] = [];

  async enqueue(job: Job): Promise<void> {
    const entry: QueueEntry = {
      job: { ...job },
      enqueuedAt: new Date(),
      visibleAt: job.scheduledAt ?? new Date(),
    };

    this.queue.push(entry);
    this.sortByPriority();
  }

  async dequeue(): Promise<Job | null> {
    this.moveReadyDelayed();

    const now = Date.now();

    const index = this.queue.findIndex(
      (entry) => entry.visibleAt.getTime() <= now && !this.processing.has(entry.job.id),
    );

    if (index === -1) {
      return null;
    }

    const entry = this.queue[index]!;

    this.queue.splice(index, 1);
    this.processing.add(entry.job.id);

    return { ...entry.job };
  }

  async acknowledge(jobId: JobId): Promise<void> {
    this.processing.delete(jobId);
  }

  async nack(jobId: JobId, delayMs?: number): Promise<void> {
    this.processing.delete(jobId);

    const entry = this.findEntry(jobId);

    if (entry) {
      entry.visibleAt = new Date(Date.now() + (delayMs ?? 1_000));
      this.queue.push(entry);
      this.sortByPriority();
    }
  }

  async requeue(job: Job, delayMs?: number): Promise<void> {
    this.processing.delete(job.id);

    const entry: QueueEntry = {
      job: { ...job },
      enqueuedAt: new Date(),
      visibleAt: new Date(Date.now() + (delayMs ?? 0)),
    };

    this.queue.push(entry);
    this.sortByPriority();
  }

  async length(): Promise<number> {
    this.moveReadyDelayed();

    return this.queue.length;
  }

  async pendingCount(): Promise<number> {
    this.moveReadyDelayed();

    return this.queue.length;
  }

  async processingCount(): Promise<number> {
    return this.processing.size;
  }

  async clear(): Promise<void> {
    this.queue.length = 0;
    this.processing.clear();
    this.delayed.length = 0;
  }

  private sortByPriority(): void {
    this.queue.sort((a, b) => {
      const pa = PRIORITY_ORDER[a.job.priority] ?? 2;
      const pb = PRIORITY_ORDER[b.job.priority] ?? 2;

      if (pa !== pb) {
        return pa - pb;
      }

      return a.enqueuedAt.getTime() - b.enqueuedAt.getTime();
    });
  }

  private moveReadyDelayed(): void {
    const now = Date.now();
    const ready: QueueEntry[] = [];

    for (let i = this.delayed.length - 1; i >= 0; i--) {
      const entry = this.delayed[i];

      if (entry && entry.visibleAt.getTime() <= now) {
        this.delayed.splice(i, 1);
        ready.push(entry);
      }
    }

    if (ready.length > 0) {
      this.queue.push(...ready);
      this.sortByPriority();
    }
  }

  private findEntry(jobId: JobId): QueueEntry | undefined {
    return this.queue.find((e) => e.job.id === jobId);
  }
}
