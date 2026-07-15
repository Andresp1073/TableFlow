import type { DisasterRecoveryProfileConfig, DisasterRecoveryProfileResult, DisasterRecoveryExecution, DisasterRecoveryStepResult } from "./types.js";
import { MultiRegionValidationError } from "./errors.js";

export class DisasterRecoveryProfile {
  readonly name: string;
  readonly description: string;
  readonly rtoSeconds: number;
  readonly rpoSeconds: number;
  readonly primaryRegionId: string;
  readonly backupRegionIds: readonly string[];
  readonly recoveryPriority: number;
  readonly validationSteps: readonly string[];
  readonly autoFailover: boolean;
  readonly notificationChannels: readonly string[];
  readonly tags: Record<string, string>;

  private validated: boolean = false;
  private lastValidatedAt: Date | undefined;
  private lastDrillAt: Date | undefined;

  constructor(config: DisasterRecoveryProfileConfig) {
    DisasterRecoveryProfile.validate(config);

    this.name = config.name;
    this.description = config.description;
    this.rtoSeconds = config.rtoSeconds;
    this.rpoSeconds = config.rpoSeconds;
    this.primaryRegionId = config.primaryRegionId;
    this.backupRegionIds = Object.freeze([...config.backupRegionIds]);
    this.recoveryPriority = config.recoveryPriority;
    this.validationSteps = Object.freeze([...config.validationSteps]);
    this.autoFailover = config.autoFailover;
    this.notificationChannels = Object.freeze([...config.notificationChannels]);
    this.tags = { ...config.tags };
  }

  private static validate(config: DisasterRecoveryProfileConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("DR profile name is required");
    }

    if (config.rtoSeconds <= 0) {
      errors.push("RTO must be positive");
    }

    if (config.rpoSeconds <= 0) {
      errors.push("RPO must be positive");
    }

    if (config.rpoSeconds > config.rtoSeconds) {
      errors.push("RPO must be less than or equal to RTO");
    }

    if (!config.primaryRegionId || config.primaryRegionId.trim().length === 0) {
      errors.push("Primary region ID is required");
    }

    if (!config.backupRegionIds || config.backupRegionIds.length === 0) {
      errors.push("At least one backup region is required");
    }

    if (config.backupRegionIds.includes(config.primaryRegionId)) {
      errors.push("Backup regions must not include the primary region");
    }

    if (config.recoveryPriority < 0) {
      errors.push("Recovery priority must be non-negative");
    }

    if (!config.validationSteps || config.validationSteps.length === 0) {
      errors.push("At least one validation step is required");
    }

    if (errors.length > 0) {
      throw new MultiRegionValidationError("Invalid DR profile configuration", errors);
    }
  }

  markValidated(): void {
    this.validated = true;
    this.lastValidatedAt = new Date();
  }

  markDrillPerformed(): void {
    this.lastDrillAt = new Date();
  }

  toResult(): DisasterRecoveryProfileResult {
    return {
      name: this.name,
      description: this.description,
      rtoSeconds: this.rtoSeconds,
      rpoSeconds: this.rpoSeconds,
      primaryRegionId: this.primaryRegionId,
      backupRegionIds: [...this.backupRegionIds],
      recoveryPriority: this.recoveryPriority,
      validationSteps: [...this.validationSteps],
      autoFailover: this.autoFailover,
      notificationChannels: [...this.notificationChannels],
      tags: { ...this.tags },
      validated: this.validated,
      lastValidatedAt: this.lastValidatedAt,
      lastDrillAt: this.lastDrillAt,
    };
  }

  async execute(regionId: string): Promise<DisasterRecoveryExecution> {
    const errors: string[] = [];

    if (!this.backupRegionIds.includes(regionId)) {
      errors.push(`Region ${regionId} is not a configured backup region`);
    }

    if (regionId === this.primaryRegionId) {
      errors.push("Cannot fail over to the primary region");
    }

    if (errors.length > 0) {
      throw new MultiRegionValidationError("Invalid DR execution", errors);
    }

    const steps: DisasterRecoveryStepResult[] = [];

    for (const stepName of this.validationSteps) {
      const startedAt = new Date();
      await new Promise((resolve) => setTimeout(resolve, Math.min(100, 10)));
      const completedAt = new Date();

      steps.push({
        stepName,
        success: true,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      });
    }

    const switchStepStart = new Date();
    await new Promise((resolve) => setTimeout(resolve, Math.min(100, 10)));
    const switchStepEnd = new Date();

    steps.push({
      stepName: "switch_traffic",
      success: true,
      startedAt: switchStepStart,
      completedAt: switchStepEnd,
      durationMs: switchStepEnd.getTime() - switchStepStart.getTime(),
    });

    this.lastDrillAt = new Date();

    return {
      profileName: this.name,
      state: "completed",
      startedAt: new Date(),
      completedAt: new Date(),
      sourceRegionId: this.primaryRegionId,
      targetRegionId: regionId,
      steps,
    };
  }

  isRTOAchievable(estimatedRecoveryTimeMs: number): boolean {
    return estimatedRecoveryTimeMs <= this.rtoSeconds * 1000;
  }

  isRPOWithinThreshold(dataLossMs: number): boolean {
    return dataLossMs <= this.rpoSeconds * 1000;
  }
}
