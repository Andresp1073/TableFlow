import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";
import type { JobScheduler } from "../jobs/index.js";

export type TriggerType =
  | "fixed-interval"
  | "cron"
  | "one-time"
  | "startup"
  | "manual"
  | "event"
  | "custom";

export type ScheduleState = "enabled" | "disabled" | "paused" | "completed" | "failed";

export type OverlapPolicy = "skip" | "queue" | "parallel" | "terminate_previous";

export type MisfirePolicy = "skip" | "execute_now" | "execute_next";

export interface RetryPolicyConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

export interface BaseTriggerConfig {
  readonly type: TriggerType;
  readonly id: string;
}

export interface FixedIntervalTriggerConfig extends BaseTriggerConfig {
  readonly type: "fixed-interval";
  readonly intervalMs: number;
  readonly delayStartMs?: number;
}

export interface CronTriggerConfig extends BaseTriggerConfig {
  readonly type: "cron";
  readonly expression: string;
  readonly timezone?: string;
}

export interface OneTimeTriggerConfig extends BaseTriggerConfig {
  readonly type: "one-time";
  readonly runAt: Date;
}

export interface StartupTriggerConfig extends BaseTriggerConfig {
  readonly type: "startup";
  readonly delayMs?: number;
}

export interface ManualTriggerConfig extends BaseTriggerConfig {
  readonly type: "manual";
}

export interface EventTriggerConfig extends BaseTriggerConfig {
  readonly type: "event";
  readonly eventType: string;
  readonly filter?: Record<string, unknown>;
}

export interface CustomTriggerConfig extends BaseTriggerConfig {
  readonly type: "custom";
  readonly customType: string;
}

export type ScheduleTriggerConfig =
  | FixedIntervalTriggerConfig
  | CronTriggerConfig
  | OneTimeTriggerConfig
  | StartupTriggerConfig
  | ManualTriggerConfig
  | EventTriggerConfig
  | CustomTriggerConfig;

export interface SchedulePolicyConfig {
  readonly maxExecutions?: number;
  readonly executionTimeoutMs: number;
  readonly retryPolicy: RetryPolicyConfig;
  readonly overlapPolicy: OverlapPolicy;
  readonly misfirePolicy: MisfirePolicy;
}

export interface Schedule {
  id: string;
  name: string;
  description?: string;
  trigger: ScheduleTriggerConfig;
  jobName: string;
  jobData: Record<string, unknown>;
  state: ScheduleState;
  policy: SchedulePolicyConfig;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  lastCompletedAt?: Date;
  executionCount: number;
  misfireCount: number;
}

export interface ScheduleContext {
  readonly scheduleId: string;
  readonly scheduleName: string;
  readonly executionId: string;
  readonly triggeredAt: Date;
  readonly triggerType: TriggerType;
  readonly metadata: Record<string, unknown>;
  readonly attempt: number;
}

export interface ScheduleExecutionResult {
  readonly executionId: string;
  readonly scheduleId: string;
  readonly scheduleName: string;
  readonly triggeredAt: Date;
  readonly completedAt: Date;
  readonly durationMs: number;
  readonly status: "completed" | "failed" | "skipped" | "timeout" | "misfired";
  readonly error?: string;
  readonly attempt: number;
}

export interface TriggerEvaluationContext {
  readonly lastTriggeredAt?: Date;
  readonly lastCompletedAt?: Date;
  readonly executionCount: number;
  readonly misfireCount: number;
  readonly state: ScheduleState;
  readonly now: Date;
}

export interface TriggerEvaluationResult {
  readonly shouldFire: boolean;
  readonly reason: string;
  readonly nextFireTime?: Date;
}

export interface PolicyEvaluationContext {
  readonly executionCount: number;
  readonly hasActiveExecution: boolean;
  readonly lastError?: string;
  readonly state: ScheduleState;
}

export interface PolicyEvaluationResult {
  readonly allowed: boolean;
  readonly reason: string;
  readonly delayMs?: number;
}

export interface ScheduleRegistry {
  register(schedule: Schedule): void;
  unregister(name: string): boolean;
  get(name: string): Schedule | null;
  getById(id: string): Schedule | null;
  getAll(): Schedule[];
  getByState(state: ScheduleState): Schedule[];
  getByTriggerType(type: TriggerType): Schedule[];
  update(schedule: Schedule): void;
  clear(): void;
  count(): number;
}

export interface TriggerResolver {
  evaluate(trigger: ScheduleTriggerConfig, context: TriggerEvaluationContext): TriggerEvaluationResult;
  getNextFireTime(trigger: ScheduleTriggerConfig, after?: Date): Date | null;
}

export interface SchedulePolicyEngine {
  canExecute(schedule: Schedule, context: PolicyEvaluationContext): PolicyEvaluationResult;
  shouldRetry(attempt: number, maxRetries: number, lastError?: string): boolean;
  getRetryDelay(attempt: number, config: RetryPolicyConfig): number;
  handleMisfire(policy: MisfirePolicy): "skip" | "execute_now" | "execute_next";
}

export interface Scheduler {
  registerSchedule(schedule: Schedule): void;
  unregisterSchedule(name: string): boolean;
  getSchedule(name: string): Schedule | null;
  listSchedules(): Schedule[];
  triggerSchedule(name: string): Promise<ScheduleExecutionResult | null>;
  pauseSchedule(name: string): boolean;
  resumeSchedule(name: string): boolean;
  enableSchedule(name: string): boolean;
  disableSchedule(name: string): boolean;
  checkSchedules(): Promise<ScheduleExecutionResult[]>;
  setLogger(logger: Logger): void;
  setEventPublisher(publisher: EventPublisher): void;
  setJobScheduler(scheduler: JobScheduler): void;
}

export type ScheduleEventType =
  | "schedule.created"
  | "schedule.triggered"
  | "schedule.paused"
  | "schedule.resumed"
  | "schedule.failed";
