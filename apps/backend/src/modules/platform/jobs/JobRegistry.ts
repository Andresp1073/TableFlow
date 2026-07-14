import type { JobRegistry as JobRegistryInterface, JobHandler, JobName } from "./types.js";

export class JobRegistry implements JobRegistryInterface {
  private readonly handlers = new Map<JobName, JobHandler>();

  register(handler: JobHandler): void {
    this.handlers.set(handler.jobName, handler);
  }

  unregister(jobName: JobName): void {
    this.handlers.delete(jobName);
  }

  getHandler(jobName: JobName): JobHandler | null {
    return this.handlers.get(jobName) ?? null;
  }

  hasHandler(jobName: JobName): boolean {
    return this.handlers.has(jobName);
  }

  listHandlers(): JobName[] {
    return Array.from(this.handlers.keys());
  }

  clear(): void {
    this.handlers.clear();
  }

  count(): number {
    return this.handlers.size;
  }
}
