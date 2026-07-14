import { BaseHealthCheck } from "../HealthCheck.js";
import type { HealthCheckResult } from "../../types.js";
import { healthy } from "../HealthStatus.js";

export interface ApplicationHealthOptions {
  name?: string;
  version?: string;
  uptime?: boolean;
  memory?: boolean;
}

export class ApplicationHealthCheck extends BaseHealthCheck {
  readonly name: string;
  private readonly version?: string;
  private readonly checkUptime: boolean;
  private readonly checkMemory: boolean;
  private readonly startTime: number;

  constructor(options: ApplicationHealthOptions = {}) {
    super();
    this.name = options.name ?? "application";
    this.version = options.version;
    this.checkUptime = options.uptime ?? true;
    this.checkMemory = options.memory ?? true;
    this.startTime = Date.now();
  }

  override async check(): Promise<HealthCheckResult> {
    const start = performance.now();
    const metadata: Record<string, unknown> = {};

    metadata["status"] = "running";

    if (this.version) {
      metadata["version"] = this.version;
    }

    if (this.checkUptime) {
      metadata["uptime"] = Date.now() - this.startTime;
    }

    if (this.checkMemory && typeof process !== "undefined" && process.memoryUsage) {
      const mem = process.memoryUsage();

      metadata["memory"] = {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: mem.external,
      };
    }

    const duration = performance.now() - start;

    return healthy(this.name, "Application is running", duration, metadata);
  }
}
