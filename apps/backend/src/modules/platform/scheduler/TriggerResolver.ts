import type {
  TriggerResolver as TriggerResolverInterface,
  ScheduleTriggerConfig,
  TriggerEvaluationContext,
  TriggerEvaluationResult,
  FixedIntervalTriggerConfig,
  CronTriggerConfig,
  OneTimeTriggerConfig,
  StartupTriggerConfig,
} from "./types.js";

export class TriggerResolver implements TriggerResolverInterface {
  evaluate(
    trigger: ScheduleTriggerConfig,
    context: TriggerEvaluationContext,
  ): TriggerEvaluationResult {
    if (context.state !== "enabled") {
      return { shouldFire: false, reason: "Schedule is not enabled" };
    }

    switch (trigger.type) {
      case "fixed-interval":
        return this.evaluateFixedInterval(trigger, context);
      case "cron":
        return this.evaluateCron(trigger, context);
      case "one-time":
        return this.evaluateOneTime(trigger, context);
      case "startup":
        return this.evaluateStartup(trigger, context);
      case "manual":
        return { shouldFire: false, reason: "Manual trigger requires explicit invocation" };
      case "event":
        return { shouldFire: false, reason: "Event trigger requires event matching" };
      case "custom":
        return { shouldFire: false, reason: `Custom trigger "${trigger.customType}" requires explicit evaluation` };
      default:
        return { shouldFire: false, reason: `Unknown trigger type: ${(trigger as ScheduleTriggerConfig).type}` };
    }
  }

  getNextFireTime(trigger: ScheduleTriggerConfig, after?: Date): Date | null {
    const reference = after ?? new Date();

    switch (trigger.type) {
      case "fixed-interval":
        return this.getNextFixedIntervalFireTime(trigger, reference);
      case "one-time":
        return trigger.runAt > reference ? trigger.runAt : null;
      case "cron":
        return null;
      case "startup":
      case "manual":
      case "event":
      case "custom":
        return null;
      default:
        return null;
    }
  }

  private evaluateFixedInterval(
    trigger: FixedIntervalTriggerConfig,
    context: TriggerEvaluationContext,
  ): TriggerEvaluationResult {
    if (!context.lastTriggeredAt) {
      if (trigger.delayStartMs && trigger.delayStartMs > 0) {
        const elapsed = context.now.getTime() - context.now.getTime();
        if (elapsed < trigger.delayStartMs) {
          return {
            shouldFire: false,
            reason: `Waiting for delay start of ${trigger.delayStartMs}ms`,
            nextFireTime: new Date(context.now.getTime() + trigger.delayStartMs - elapsed),
          };
        }
      }
      return {
        shouldFire: true,
        reason: "Fixed-interval trigger: never fired before",
        nextFireTime: new Date(context.now.getTime() + trigger.intervalMs),
      };
    }

    const nextFire = new Date(context.lastTriggeredAt.getTime() + trigger.intervalMs);

    if (context.now >= nextFire) {
      const nextNext = new Date(context.now.getTime() + trigger.intervalMs);
      return {
        shouldFire: true,
        reason: "Fixed-interval trigger: interval elapsed",
        nextFireTime: nextNext,
      };
    }

    return {
      shouldFire: false,
      reason: `Fixed-interval trigger: next fire at ${nextFire.toISOString()}`,
      nextFireTime: nextFire,
    };
  }

  private evaluateCron(
    trigger: CronTriggerConfig,
    context: TriggerEvaluationContext,
  ): TriggerEvaluationResult {
    return {
      shouldFire: false,
      reason: `Cron expression "${trigger.expression}" requires a cron provider`,
    };
  }

  private evaluateOneTime(
    trigger: OneTimeTriggerConfig,
    context: TriggerEvaluationContext,
  ): TriggerEvaluationResult {
    if (context.executionCount >= 1) {
      return {
        shouldFire: false,
        reason: "One-time trigger already fired",
      };
    }

    if (context.now >= trigger.runAt) {
      return {
        shouldFire: true,
        reason: "One-time trigger: scheduled time reached",
      };
    }

    return {
      shouldFire: false,
      reason: `One-time trigger: scheduled at ${trigger.runAt.toISOString()}`,
      nextFireTime: trigger.runAt,
    };
  }

  private evaluateStartup(
    trigger: StartupTriggerConfig,
    context: TriggerEvaluationContext,
  ): TriggerEvaluationResult {
    if (context.executionCount >= 1) {
      return {
        shouldFire: false,
        reason: "Startup trigger already fired",
      };
    }

    return {
      shouldFire: true,
      reason: "Startup trigger: ready to fire",
    };
  }

  private getNextFixedIntervalFireTime(
    trigger: FixedIntervalTriggerConfig,
    after: Date,
  ): Date | null {
    return new Date(after.getTime() + trigger.intervalMs);
  }
}
