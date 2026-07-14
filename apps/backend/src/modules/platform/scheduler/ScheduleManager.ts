import type {
  Scheduler as SchedulerInterface,
  Schedule,
  ScheduleExecutionResult,
  TriggerEvaluationContext,
  PolicyEvaluationContext,
  ScheduleState,
} from "./types.js";
import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";
import type { JobScheduler } from "../jobs/types.js";
import type { ScheduleRegistry as ScheduleRegistryInterface } from "./types.js";
import type { TriggerResolver as TriggerResolverInterface } from "./types.js";
import type { SchedulePolicyEngine as SchedulePolicyEngineInterface } from "./types.js";
import { buildScheduleResult } from "./ScheduleResult.js";
import { createScheduleContext } from "./ScheduleContext.js";
import { publishScheduleEvent } from "./events.js";
import {
  ScheduleNotFoundError,
  ScheduleAlreadyExistsError,
  ScheduleStateTransitionError,
} from "./errors.js";

let scheduleIdCounter = 0;

function generateScheduleId(): string {
  const timestamp = Date.now().toString(36);
  const counter = (scheduleIdCounter++).toString(36).padStart(4, "0");
  return `sched_${timestamp}${counter}`;
}

export class ScheduleManager implements SchedulerInterface {
  private logger?: Logger;
  private eventPublisher?: EventPublisher;
  private jobScheduler?: JobScheduler;

  constructor(
    private readonly registry: ScheduleRegistryInterface,
    private readonly triggerResolver: TriggerResolverInterface,
    private readonly policyEngine: SchedulePolicyEngineInterface,
  ) {}

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  setEventPublisher(publisher: EventPublisher): void {
    this.eventPublisher = publisher;
  }

  setJobScheduler(scheduler: JobScheduler): void {
    this.jobScheduler = scheduler;
  }

  registerSchedule(schedule: Schedule): void {
    if (this.registry.get(schedule.name)) {
      throw new ScheduleAlreadyExistsError(schedule.name);
    }

    const complete: Schedule = {
      ...schedule,
      id: schedule.id || generateScheduleId(),
      state: schedule.state ?? "enabled",
      tags: schedule.tags ?? [],
      metadata: schedule.metadata ?? {},
      createdAt: schedule.createdAt ?? new Date(),
      updatedAt: new Date(),
      executionCount: schedule.executionCount ?? 0,
      misfireCount: schedule.misfireCount ?? 0,
    };

    this.registry.register(complete);
    publishScheduleEvent(this.eventPublisher, this.logger, "schedule.created", complete);
  }

  unregisterSchedule(name: string): boolean {
    return this.registry.unregister(name);
  }

  getSchedule(name: string): Schedule | null {
    return this.registry.get(name);
  }

  listSchedules(): Schedule[] {
    return this.registry.getAll();
  }

  async triggerSchedule(name: string): Promise<ScheduleExecutionResult | null> {
    const schedule = this.registry.get(name);

    if (!schedule) {
      return null;
    }

    return this.executeSchedule(schedule);
  }

  pauseSchedule(name: string): boolean {
    return this.transitionState(name, "paused");
  }

  resumeSchedule(name: string): boolean {
    const schedule = this.registry.get(name);

    if (!schedule) {
      return false;
    }

    if (schedule.state !== "paused") {
      return false;
    }

    schedule.state = "enabled";
    this.registry.update(schedule);
    publishScheduleEvent(this.eventPublisher, this.logger, "schedule.resumed", schedule);
    return true;
  }

  enableSchedule(name: string): boolean {
    const schedule = this.registry.get(name);

    if (!schedule) {
      return false;
    }

    if (schedule.state === "enabled") {
      return true;
    }

    const from = schedule.state;
    if (from === "completed" || from === "failed") {
      schedule.executionCount = 0;
      schedule.misfireCount = 0;
      schedule.lastTriggeredAt = undefined;
      schedule.lastCompletedAt = undefined;
    }

    schedule.state = "enabled";
    this.registry.update(schedule);
    return true;
  }

  disableSchedule(name: string): boolean {
    return this.transitionState(name, "disabled");
  }

  async checkSchedules(): Promise<ScheduleExecutionResult[]> {
    const results: ScheduleExecutionResult[] = [];
    const schedules = this.registry.getByState("enabled");
    const now = new Date();

    for (const schedule of schedules) {
      const evalContext: TriggerEvaluationContext = {
        lastTriggeredAt: schedule.lastTriggeredAt,
        lastCompletedAt: schedule.lastCompletedAt,
        executionCount: schedule.executionCount,
        misfireCount: schedule.misfireCount,
        state: schedule.state,
        now,
      };

      const triggerResult = this.triggerResolver.evaluate(schedule.trigger, evalContext);

      if (triggerResult.shouldFire) {
        const policyContext: PolicyEvaluationContext = {
          executionCount: schedule.executionCount,
          hasActiveExecution: false,
          state: schedule.state,
        };

        const policyResult = this.policyEngine.canExecute(schedule, policyContext);

        if (policyResult.allowed) {
          this.logger?.info(`Schedule "${schedule.name}" triggered`, {
            triggerType: schedule.trigger.type,
            executionCount: schedule.executionCount,
          });

          const result = await this.executeSchedule(schedule);
          results.push(result);
        } else {
          const misfireAction = this.policyEngine.handleMisfire(schedule.policy.misfirePolicy);

          if (misfireAction === "execute_now") {
            this.logger?.warn(`Schedule "${schedule.name}" misfiring — executing now`, {
              policy: schedule.policy.misfirePolicy,
            });

            schedule.misfireCount++;
            this.registry.update(schedule);
            const result = await this.executeSchedule(schedule);
            results.push(result);
          } else if (misfireAction === "skip") {
            schedule.misfireCount++;
            this.registry.update(schedule);
            results.push(
              buildScheduleResult(schedule, "misfired", {
                error: `Misfired: ${policyResult.reason}`,
              }),
            );
          }
        }
      }
    }

    return results;
  }

  private async executeSchedule(schedule: Schedule): Promise<ScheduleExecutionResult> {
    const context = createScheduleContext(schedule);

    schedule.lastTriggeredAt = context.triggeredAt;
    schedule.executionCount++;
    this.registry.update(schedule);

    publishScheduleEvent(this.eventPublisher, this.logger, "schedule.triggered", schedule);

    if (!this.jobScheduler) {
      this.logger?.warn(`Schedule "${schedule.name}" skipped: no job scheduler configured`);
      return buildScheduleResult(schedule, "skipped", {
        error: "No job scheduler configured",
        triggeredAt: context.triggeredAt,
      });
    }

    try {
      await this.jobScheduler.schedule({
        name: schedule.jobName,
        data: {
          ...schedule.jobData,
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          executionId: context.executionId,
          triggeredAt: context.triggeredAt.toISOString(),
        },
        type: "scheduled",
        metadata: {
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          executionId: context.executionId,
          triggerType: schedule.trigger.type,
        },
        tags: schedule.tags,
      });

      schedule.lastCompletedAt = new Date();
      this.registry.update(schedule);

      return buildScheduleResult(schedule, "completed", {
        triggeredAt: context.triggeredAt,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger?.error(`Schedule "${schedule.name}" execution failed`, {
        executionId: context.executionId,
        error: errorMessage,
      });

      publishScheduleEvent(this.eventPublisher, this.logger, "schedule.failed", schedule, {
        executionId: context.executionId,
        error: errorMessage,
      });

      return buildScheduleResult(schedule, "failed", {
        error: errorMessage,
        triggeredAt: context.triggeredAt,
      });
    }
  }

  private transitionState(name: string, target: ScheduleState): boolean {
    const schedule = this.registry.get(name);

    if (!schedule) {
      return false;
    }

    const validTransitions: Record<ScheduleState, ScheduleState[]> = {
      enabled: ["disabled", "paused", "completed", "failed"],
      disabled: ["enabled", "paused"],
      paused: ["enabled"],
      completed: ["enabled"],
      failed: ["enabled"],
    };

    const allowed = validTransitions[schedule.state] ?? [];

    if (!allowed.includes(target)) {
      throw new ScheduleStateTransitionError(
        name,
        schedule.state,
        target,
        `Cannot transition from ${schedule.state} to ${target}`,
      );
    }

    schedule.state = target;
    this.registry.update(schedule);

    if (target === "paused") {
      publishScheduleEvent(this.eventPublisher, this.logger, "schedule.paused", schedule);
    }

    return true;
  }
}
