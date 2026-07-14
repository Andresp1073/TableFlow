import type { RetryPolicy as RetryPolicyInterface } from "./types.js";

export class RetryPolicy {
  static default(): RetryPolicyInterface {
    return {
      maxRetries: 3,
      initialDelayMs: 1_000,
      backoffMultiplier: 2,
      maxDelayMs: 30_000,
      deadLetterEnabled: false,
      retryableErrors: [],
    };
  }

  static exponentialBackoff(
    maxRetries = 5,
    initialDelayMs = 1_000,
    maxDelayMs = 60_000,
  ): RetryPolicyInterface {
    return {
      maxRetries,
      initialDelayMs,
      backoffMultiplier: 2,
      maxDelayMs,
      deadLetterEnabled: true,
      retryableErrors: [],
    };
  }

  static fixedDelay(
    maxRetries = 3,
    delayMs = 5_000,
  ): RetryPolicyInterface {
    return {
      maxRetries,
      initialDelayMs: delayMs,
      backoffMultiplier: 1,
      maxDelayMs: delayMs,
      deadLetterEnabled: false,
      retryableErrors: [],
    };
  }

  static custom(policy: Partial<RetryPolicyInterface>): RetryPolicyInterface {
    return {
      maxRetries: policy.maxRetries ?? 3,
      initialDelayMs: policy.initialDelayMs ?? 1_000,
      backoffMultiplier: policy.backoffMultiplier ?? 2,
      maxDelayMs: policy.maxDelayMs ?? 30_000,
      deadLetterEnabled: policy.deadLetterEnabled ?? false,
      deadLetterQueue: policy.deadLetterQueue,
      retryableErrors: policy.retryableErrors ?? [],
    };
  }

  static computeNextDelay(policy: RetryPolicyInterface, retryCount: number): number {
    const delay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, retryCount);

    return Math.min(delay, policy.maxDelayMs);
  }

  static shouldRetry(policy: RetryPolicyInterface, retryCount: number): boolean {
    return retryCount < policy.maxRetries;
  }

  static isRetryableError(policy: RetryPolicyInterface, error: string): boolean {
    if (policy.retryableErrors.length === 0) {
      return true;
    }

    return policy.retryableErrors.some((err) => error.includes(err));
  }

  static toDeadLetter(policy: RetryPolicyInterface): boolean {
    return policy.deadLetterEnabled;
  }
}
