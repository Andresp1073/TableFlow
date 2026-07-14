import type {
  SchedulePolicyEngine as SchedulePolicyEngineInterface,
  Schedule,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  RetryPolicyConfig,
  MisfirePolicy,
} from "./types.js";

export class SchedulePolicyEngine implements SchedulePolicyEngineInterface {
  canExecute(schedule: Schedule, context: PolicyEvaluationContext): PolicyEvaluationResult {
    if (context.state === "disabled") {
      return { allowed: false, reason: "Schedule is disabled" };
    }

    if (context.state === "paused") {
      return { allowed: false, reason: "Schedule is paused" };
    }

    if (context.state === "completed") {
      return { allowed: false, reason: "Schedule is completed" };
    }

    if (context.state === "failed") {
      return { allowed: false, reason: "Schedule is in failed state" };
    }

    if (schedule.policy.maxExecutions !== undefined) {
      if (context.executionCount >= schedule.policy.maxExecutions) {
        return {
          allowed: false,
          reason: `Max executions (${schedule.policy.maxExecutions}) reached`,
        };
      }
    }

    if (context.hasActiveExecution) {
      switch (schedule.policy.overlapPolicy) {
        case "skip":
          return { allowed: false, reason: "Overlap policy: skip — previous execution still active" };
        case "queue":
          return { allowed: true, reason: "Overlap policy: queue — will execute after previous completes", delayMs: 0 };
        case "parallel":
          return { allowed: true, reason: "Overlap policy: parallel — concurrent execution allowed" };
        case "terminate_previous":
          return { allowed: true, reason: "Overlap policy: terminate previous — new execution started" };
      }
    }

    return { allowed: true, reason: "Execution allowed" };
  }

  shouldRetry(attempt: number, maxRetries: number, _lastError?: string): boolean {
    return attempt <= maxRetries;
  }

  getRetryDelay(attempt: number, config: RetryPolicyConfig): number {
    if (attempt <= 1) {
      return config.delayMs;
    }

    const delay = config.delayMs * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, 30 * 60 * 1000);
  }

  handleMisfire(policy: MisfirePolicy): "skip" | "execute_now" | "execute_next" {
    switch (policy) {
      case "skip":
        return "skip";
      case "execute_now":
        return "execute_now";
      case "execute_next":
        return "execute_next";
      default:
        return "skip";
    }
  }
}
