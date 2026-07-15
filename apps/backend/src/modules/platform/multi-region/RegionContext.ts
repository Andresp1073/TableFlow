import type { RegionConfig, RegionHealth, RegionRole, RegionStatus } from "./types.js";
import { REGION_ROLES } from "./types.js";
import { MultiRegionValidationError } from "./errors.js";

export class RegionContext {
  readonly config: RegionConfig;
  private health: RegionHealth;

  constructor(config: RegionConfig, health?: Partial<RegionHealth>) {
    RegionContext.validate(config);

    this.config = {
      id: config.id,
      name: config.name,
      role: config.role,
      priority: config.priority,
      weight: config.weight,
      latitude: config.latitude,
      longitude: config.longitude,
      tags: [...config.tags],
      capabilities: Object.freeze([...config.capabilities]),
    };

    const now = new Date();
    this.health = {
      status: health?.status ?? "active",
      latencyMs: health?.latencyMs ?? 0,
      errorRate: health?.errorRate ?? 0,
      uptimePercent: health?.uptimePercent ?? 100,
      lastCheckedAt: health?.lastCheckedAt ?? now,
      details: { ...(health?.details ?? {}) },
    };
  }

  private static validate(config: RegionConfig): void {
    const errors: string[] = [];

    if (!config.id || config.id.trim().length === 0) {
      errors.push("Region ID is required");
    }

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Region name is required");
    }

    if (!REGION_ROLES.includes(config.role)) {
      errors.push(`Invalid region role: ${config.role}`);
    }

    if (config.priority < 0) {
      errors.push("Region priority must be non-negative");
    }

    if (config.weight < 0) {
      errors.push("Region weight must be non-negative");
    }

    if (config.latitude < -90 || config.latitude > 90) {
      errors.push("Latitude must be between -90 and 90");
    }

    if (config.longitude < -180 || config.longitude > 180) {
      errors.push("Longitude must be between -180 and 180");
    }

    if (errors.length > 0) {
      throw new MultiRegionValidationError("Invalid region configuration", errors);
    }
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get role(): RegionRole {
    return this.config.role;
  }

  get status(): RegionStatus {
    return this.health.status;
  }

  getHealth(): RegionHealth {
    return {
      ...this.health,
      details: { ...this.health.details },
    };
  }

  updateHealth(health: Partial<RegionHealth>): void {
    if (health.status) {
      this.health.status = health.status;
    }
    if (health.latencyMs !== undefined) {
      this.health.latencyMs = health.latencyMs;
    }
    if (health.errorRate !== undefined) {
      this.health.errorRate = health.errorRate;
    }
    if (health.uptimePercent !== undefined) {
      this.health.uptimePercent = health.uptimePercent;
    }
    this.health.lastCheckedAt = health.lastCheckedAt ?? new Date();
    if (health.details) {
      this.health.details = { ...this.health.details, ...health.details };
    }
  }

  setStatus(status: RegionStatus): void {
    this.health.status = status;
    this.health.lastCheckedAt = new Date();
  }

  isActive(): boolean {
    return this.health.status === "active";
  }

  isAvailable(): boolean {
    return this.health.status === "active" || this.health.status === "degraded";
  }

  canAcceptTraffic(): boolean {
    return this.health.status === "active" || this.health.status === "degraded" || this.health.status === "draining";
  }

  toResult(): RegionConfig & { status: RegionStatus; latencyMs: number } {
    return {
      ...this.config,
      status: this.health.status,
      latencyMs: this.health.latencyMs,
    };
  }

  static createPrimary(id: string, name: string, latitude: number, longitude: number): RegionContext {
    return new RegionContext({
      id, name, role: "primary", priority: 100, weight: 100,
      latitude, longitude, tags: ["primary"], capabilities: ["read", "write"],
    });
  }

  static createSecondary(id: string, name: string, latitude: number, longitude: number): RegionContext {
    return new RegionContext({
      id, name, role: "secondary", priority: 50, weight: 50,
      latitude, longitude, tags: ["secondary"], capabilities: ["read", "write"],
    });
  }

  static createReadOnly(id: string, name: string, latitude: number, longitude: number): RegionContext {
    return new RegionContext({
      id, name, role: "read_only", priority: 30, weight: 30,
      latitude, longitude, tags: ["read-only"], capabilities: ["read"],
    });
  }

  static createDisasterRecovery(id: string, name: string, latitude: number, longitude: number): RegionContext {
    return new RegionContext({
      id, name, role: "disaster_recovery", priority: 10, weight: 0,
      latitude, longitude, tags: ["dr"], capabilities: ["read", "write"],
    });
  }
}
