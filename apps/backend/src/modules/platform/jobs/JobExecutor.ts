import type {
  JobExecutor as JobExecutorInterface,
  Job,
  JobResult,
  JobContext,
  RetryPolicy as RetryPolicyInterface,
  Logger,
  CacheProvider,
} from "./types.js";
import type { JobRegistry } from "./JobRegistry.js";
import { RetryPolicy as RetryPolicyFactory } from "./RetryPolicy.js";

export interface JobExecutorOptions {
  registry: JobRegistry;
  logger?: Logger;
  cache?: CacheProvider;
  retryPolicy?: RetryPolicyInterface;
  defaultRetryPolicy?: RetryPolicyInterface;
}

export class JobExecutor implements JobExecutorInterface {
  private readonly registry: JobRegistry;
  private readonly logger: Logger | null;
  private readonly cache: CacheProvider | null;
  private readonly defaultRetryPolicy: RetryPolicyInterface;

  constructor(options: JobExecutorOptions) {
    this.registry = options.registry;
    this.logger = options.logger ?? null;
    this.cache = options.cache ?? null;
    this.defaultRetryPolicy = options.defaultRetryPolicy ?? RetryPolicyFactory.default();
  }

  canExecute(job: Job): boolean {
    return this.registry.hasHandler(job.name);
  }

  async execute(job: Job): Promise<JobResult> {
    const handler = this.registry.getHandler(job.name);

    if (!handler) {
      return {
        status: "failed",
        error: `No handler registered for job: ${job.name}`,
      };
    }

    const abortController = new AbortController();
    const context = this.createContext(job, abortController.signal);

    try {
      const result = await handler.execute(context);

      if (result.status === "retry") {
        const retryPolicy = this.resolveRetryPolicy(job);

        if (RetryPolicyFactory.shouldRetry(retryPolicy, job.retryCount)) {
          job.status = "retrying";
        } else {
          job.status = "failed";
        }
      } else if (result.status === "completed") {
        job.status = "completed";
      } else {
        job.status = "failed";
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      job.error = errorMessage;

      const retryPolicy = this.resolveRetryPolicy(job);

      if (RetryPolicyFactory.shouldRetry(retryPolicy, job.retryCount)) {
        job.status = "retrying";

        return {
          status: "retry",
          error: errorMessage,
          retryDelay: RetryPolicyFactory.computeNextDelay(retryPolicy, job.retryCount),
        };
      }

      job.status = "failed";

      return {
        status: "failed",
        error: errorMessage,
      };
    }
  }

  private createContext(job: Job, abortSignal: AbortSignal): JobContext {
    let progress = 0;
    const metadata = { ...job.metadata };

    return {
      job,
      logger: this.logger ?? createNoopLogger(),
      cache: this.cache ?? createNoopCache(),
      abortSignal,
      metadata,
      setProgress(p: number): void {
        progress = Math.max(0, Math.min(100, p));
      },
      setMetadata(key: string, value: unknown): void {
        metadata[key] = value;
      },
      getMetadata(key: string): unknown {
        return metadata[key];
      },
      getProgress(): number {
        return progress;
      },
    };
  }

  private resolveRetryPolicy(job: Job): RetryPolicyInterface {
    const jobRetryPolicy = job.metadata?.retryPolicy as Partial<RetryPolicyInterface> | undefined;

    if (jobRetryPolicy) {
      return RetryPolicyFactory.custom(jobRetryPolicy);
    }

    return this.defaultRetryPolicy;
  }
}

function createNoopLogger(): Logger {
  return {
    debug(): void {},
    info(): void {},
    warn(): void {},
    error(): void {},
    fatal(): void {},
    log(): void {},
    child(): Logger {
      return this;
    },
  };
}

function createNoopCache(): CacheProvider {
  return {
    async get(): Promise<null> { return null; },
    async set(): Promise<void> {},
    async delete(): Promise<boolean> { return false; },
    async exists(): Promise<boolean> { return false; },
    async expire(): Promise<boolean> { return false; },
    async clearByPrefix(): Promise<number> { return 0; },
    async mget(): Promise<Array<null>> { return []; },
    async mset(): Promise<void> {},
    async mdelete(): Promise<number> { return 0; },
    async clear(): Promise<void> {},
  };
}
