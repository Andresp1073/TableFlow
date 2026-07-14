import { describe, it, expect } from "vitest";
import { RetryPolicy } from "../RetryPolicy.js";
import type { RetryPolicy as RetryPolicyInterface } from "../types.js";

describe("RetryPolicy", () => {
  describe("default", () => {
    it("creates a policy with 3 max retries", () => {
      const policy = RetryPolicy.default();

      expect(policy.maxRetries).toBe(3);
      expect(policy.initialDelayMs).toBe(1_000);
      expect(policy.backoffMultiplier).toBe(2);
      expect(policy.maxDelayMs).toBe(30_000);
      expect(policy.deadLetterEnabled).toBe(false);
    });
  });

  describe("exponentialBackoff", () => {
    it("creates a policy with exponential backoff", () => {
      const policy = RetryPolicy.exponentialBackoff(5, 2_000, 120_000);

      expect(policy.maxRetries).toBe(5);
      expect(policy.initialDelayMs).toBe(2_000);
      expect(policy.backoffMultiplier).toBe(2);
      expect(policy.maxDelayMs).toBe(120_000);
      expect(policy.deadLetterEnabled).toBe(true);
    });

    it("uses defaults when not specified", () => {
      const policy = RetryPolicy.exponentialBackoff();

      expect(policy.maxRetries).toBe(5);
      expect(policy.initialDelayMs).toBe(1_000);
      expect(policy.maxDelayMs).toBe(60_000);
    });
  });

  describe("fixedDelay", () => {
    it("creates a policy with fixed delay", () => {
      const policy = RetryPolicy.fixedDelay(3, 10_000);

      expect(policy.maxRetries).toBe(3);
      expect(policy.initialDelayMs).toBe(10_000);
      expect(policy.backoffMultiplier).toBe(1);
      expect(policy.maxDelayMs).toBe(10_000);
    });
  });

  describe("custom", () => {
    it("merges provided fields with defaults", () => {
      const policy = RetryPolicy.custom({ maxRetries: 10, deadLetterEnabled: true });

      expect(policy.maxRetries).toBe(10);
      expect(policy.initialDelayMs).toBe(1_000);
      expect(policy.backoffMultiplier).toBe(2);
      expect(policy.deadLetterEnabled).toBe(true);
    });

    it("accepts deadLetterQueue", () => {
      const policy = RetryPolicy.custom({ deadLetterQueue: "dlq-jobs" });

      expect(policy.deadLetterQueue).toBe("dlq-jobs");
    });

    it("accepts retryableErrors", () => {
      const policy = RetryPolicy.custom({ retryableErrors: ["TimeoutError", "NetworkError"] });

      expect(policy.retryableErrors).toHaveLength(2);
      expect(policy.retryableErrors).toContain("TimeoutError");
    });
  });

  describe("computeNextDelay", () => {
    it("computes exponential backoff delay", () => {
      const policy: RetryPolicyInterface = {
        maxRetries: 5,
        initialDelayMs: 1_000,
        backoffMultiplier: 2,
        maxDelayMs: 60_000,
        deadLetterEnabled: false,
        retryableErrors: [],
      };

      expect(RetryPolicy.computeNextDelay(policy, 0)).toBe(1_000);
      expect(RetryPolicy.computeNextDelay(policy, 1)).toBe(2_000);
      expect(RetryPolicy.computeNextDelay(policy, 2)).toBe(4_000);
      expect(RetryPolicy.computeNextDelay(policy, 3)).toBe(8_000);
    });

    it("caps delay at maxDelayMs", () => {
      const policy: RetryPolicyInterface = {
        maxRetries: 10,
        initialDelayMs: 10_000,
        backoffMultiplier: 2,
        maxDelayMs: 30_000,
        deadLetterEnabled: false,
        retryableErrors: [],
      };

      // 10K * 2^4 = 160K but capped at 30K
      expect(RetryPolicy.computeNextDelay(policy, 4)).toBe(30_000);
    });

    it("fixed delay returns the same value", () => {
      const policy: RetryPolicyInterface = {
        maxRetries: 3,
        initialDelayMs: 5_000,
        backoffMultiplier: 1,
        maxDelayMs: 5_000,
        deadLetterEnabled: false,
        retryableErrors: [],
      };

      expect(RetryPolicy.computeNextDelay(policy, 0)).toBe(5_000);
      expect(RetryPolicy.computeNextDelay(policy, 1)).toBe(5_000);
      expect(RetryPolicy.computeNextDelay(policy, 2)).toBe(5_000);
    });
  });

  describe("shouldRetry", () => {
    it("returns true when retryCount < maxRetries", () => {
      const policy: RetryPolicyInterface = {
        maxRetries: 3,
        initialDelayMs: 1_000,
        backoffMultiplier: 2,
        maxDelayMs: 30_000,
        deadLetterEnabled: false,
        retryableErrors: [],
      };

      expect(RetryPolicy.shouldRetry(policy, 0)).toBe(true);
      expect(RetryPolicy.shouldRetry(policy, 1)).toBe(true);
      expect(RetryPolicy.shouldRetry(policy, 2)).toBe(true);
    });

    it("returns false when retryCount >= maxRetries", () => {
      const policy: RetryPolicyInterface = {
        maxRetries: 3,
        initialDelayMs: 1_000,
        backoffMultiplier: 2,
        maxDelayMs: 30_000,
        deadLetterEnabled: false,
        retryableErrors: [],
      };

      expect(RetryPolicy.shouldRetry(policy, 3)).toBe(false);
      expect(RetryPolicy.shouldRetry(policy, 4)).toBe(false);
    });
  });

  describe("isRetryableError", () => {
    it("returns true when retryableErrors is empty", () => {
      const policy: RetryPolicyInterface = {
        maxRetries: 3,
        initialDelayMs: 1_000,
        backoffMultiplier: 2,
        maxDelayMs: 30_000,
        deadLetterEnabled: false,
        retryableErrors: [],
      };

      expect(RetryPolicy.isRetryableError(policy, "any error")).toBe(true);
    });

    it("returns true when error matches a retryable error", () => {
      const policy: RetryPolicyInterface = {
        maxRetries: 3,
        initialDelayMs: 1_000,
        backoffMultiplier: 2,
        maxDelayMs: 30_000,
        deadLetterEnabled: false,
        retryableErrors: ["Timeout", "Network"],
      };

      expect(RetryPolicy.isRetryableError(policy, "TimeoutError")).toBe(true);
      expect(RetryPolicy.isRetryableError(policy, "NetworkError")).toBe(true);
    });

    it("returns false when error does not match", () => {
      const policy: RetryPolicyInterface = {
        maxRetries: 3,
        initialDelayMs: 1_000,
        backoffMultiplier: 2,
        maxDelayMs: 30_000,
        deadLetterEnabled: false,
        retryableErrors: ["Timeout"],
      };

      expect(RetryPolicy.isRetryableError(policy, "ValidationError")).toBe(false);
    });
  });

  describe("toDeadLetter", () => {
    it("returns true when deadLetterEnabled", () => {
      const policy: RetryPolicyInterface = RetryPolicy.exponentialBackoff();

      expect(RetryPolicy.toDeadLetter(policy)).toBe(true);
    });

    it("returns false when deadLetterDisabled", () => {
      const policy: RetryPolicyInterface = RetryPolicy.default();

      expect(RetryPolicy.toDeadLetter(policy)).toBe(false);
    });
  });
});
