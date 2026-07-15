import type {
  Bottleneck,
  OptimizationRecommendation,
  OptimizationArea,
  OptimizationImpact,
  OptimizationEffort,
  AnalysisSeverity,
  OptimizeOptions,
  PerformanceProfile,
  OptimizationEngine,
} from "./types.js";
import { OPTIMIZATION_AREAS, BOTTLENECK_TYPES } from "./types.js";
import { generateEventId } from "../event-bus/EventMetadata.js";
import { OptimizationError, PerformanceValidationError } from "./errors.js";

interface AreaConfig {
  area: OptimizationArea;
  impact: OptimizationImpact;
  effort: OptimizationEffort;
  expectedImprovement: string;
  implementation: readonly string[];
  prerequisites: readonly string[];
  autoResolve: boolean;
}

const AREA_CONFIGS: Record<OptimizationArea, AreaConfig> = {
  caching: {
    area: "caching",
    impact: "high",
    effort: "days",
    expectedImprovement: "Reduces latency by 60-80% and backend load by 40-60%",
    implementation: [
      "Implement in-memory cache layer",
      "Set appropriate TTL policies",
      "Add cache-aside or read-through pattern",
      "Configure cache invalidation strategy",
    ],
    prerequisites: ["Cache Foundation module", "Data access layer"],
    autoResolve: false,
  },
  parallel_execution: {
    area: "parallel_execution",
    impact: "high",
    effort: "days",
    expectedImprovement: "Reduces execution time by 50-70% for parallelizable operations",
    implementation: [
      "Identify independent operations in the hot path",
      "Use Promise.all for concurrent execution",
      "Implement proper error handling for parallel branches",
      "Add concurrency limits to prevent resource exhaustion",
    ],
    prerequisites: ["Async runtime support"],
    autoResolve: true,
  },
  batch_processing: {
    area: "batch_processing",
    impact: "medium",
    effort: "hours",
    expectedImprovement: "Reduces per-item overhead by 70-90% for bulk operations",
    implementation: [
      "Group individual operations into batches",
      "Implement batch size limits and throttling",
      "Add retry logic for partial batch failures",
      "Monitor batch processing latency",
    ],
    prerequisites: ["Data access layer", "Queue infrastructure"],
    autoResolve: true,
  },
  connection_pooling: {
    area: "connection_pooling",
    impact: "high",
    effort: "hours",
    expectedImprovement: "Reduces connection overhead by 80-95% and improves throughput",
    implementation: [
      "Configure connection pool with min/max limits",
      "Set idle timeout and max lifetime",
      "Add connection acquisition timeout",
      "Monitor pool utilization metrics",
    ],
    prerequisites: ["Database or service connection layer"],
    autoResolve: false,
  },
  compression: {
    area: "compression",
    impact: "medium",
    effort: "hours",
    expectedImprovement: "Reduces payload size by 60-85% and network transfer time",
    implementation: [
      "Enable gzip/brotli compression for HTTP responses",
      "Compress large stored payloads",
      "Use efficient serialization formats",
      "Configure compression level for CPU/latency trade-off",
    ],
    prerequisites: ["HTTP middleware", "Storage layer"],
    autoResolve: true,
  },
  lazy_loading: {
    area: "lazy_loading",
    impact: "medium",
    effort: "hours",
    expectedImprovement: "Reduces initial load time by 30-50% for deferred operations",
    implementation: [
      "Identify non-critical data that can be deferred",
      "Implement lazy loading proxies or placeholders",
      "Add loading state indicators",
      "Configure pre-fetch for anticipated operations",
    ],
    prerequisites: ["Data access layer"],
    autoResolve: true,
  },
  asynchronous_execution: {
    area: "asynchronous_execution",
    impact: "high",
    effort: "days",
    expectedImprovement: "Improves responsiveness by 40-60% by moving blocking operations off critical path",
    implementation: [
      "Identify blocking operations in request path",
      "Move to background job processing",
      "Implement event-driven callbacks",
      "Add monitoring for async job completion",
    ],
    prerequisites: ["Background Jobs Framework", "Event Bus"],
    autoResolve: false,
  },
};

const SEVERITY_IMPACT_HINT: Record<AnalysisSeverity, OptimizationImpact> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
  info: "low",
};

export class OptimizationEngineImpl implements OptimizationEngine {
  private readonly recommendations: Map<string, OptimizationRecommendation> = new Map();

  suggest(
    bottlenecks: Bottleneck[],
    profile: PerformanceProfile,
    options?: OptimizeOptions,
  ): OptimizationRecommendation[] {
    const errors: string[] = [];
    if (!bottlenecks || bottlenecks.length === 0) {
      errors.push("At least one bottleneck is required");
    }
    if (errors.length > 0) {
      throw new PerformanceValidationError("Invalid bottleneck data", errors);
    }

    const result: OptimizationRecommendation[] = [];
    const seen = new Set<string>();

    for (const bottleneck of bottlenecks) {
      for (const area of bottleneck.suggestedOptimizations) {
        if (options?.areas && !options.areas.includes(area)) {
          continue;
        }

        const key = `${bottleneck.id}:${area}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        const config = AREA_CONFIGS[area];
        if (!config) {
          continue;
        }

        if (options?.maxEffort && this.effortPriority(config.effort) > this.effortPriority(options.maxEffort)) {
          continue;
        }

        if (options?.minImpact && this.impactPriority(config.impact) < this.impactPriority(options.minImpact)) {
          continue;
        }

        const recommendation = this.buildRecommendation(bottleneck, config);
        this.recommendations.set(recommendation.id, recommendation);
        result.push(recommendation);
      }
    }

    return result;
  }

  private impactPriority(impact: OptimizationImpact): number {
    const priorities: Record<OptimizationImpact, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorities[impact];
  }

  private effortPriority(effort: OptimizationEffort): number {
    const priorities: Record<OptimizationEffort, number> = { hours: 1, days: 2, weeks: 3, months: 4 };
    return priorities[effort];
  }

  private buildRecommendation(
    bottleneck: Bottleneck,
    config: AreaConfig,
  ): OptimizationRecommendation {
    const impact = SEVERITY_IMPACT_HINT[bottleneck.severity];
    const improvement = config.expectedImprovement;
    const expectedValue = Math.round(bottleneck.currentValue * 0.4);

    return {
      id: generateEventId(),
      area: config.area,
      severity: bottleneck.severity,
      title: `Optimize ${config.area.replace(/_/g, " ")} for ${bottleneck.resource}`,
      description: improvement,
      currentValue: bottleneck.currentValue,
      expectedValue,
      expectedImpact: improvement,
      effort: config.effort,
      implementation: [...config.implementation],
      prerequisites: [...config.prerequisites],
      autoResolve: config.autoResolve,
      createdAt: new Date(),
      status: "pending",
    };
  }

  apply(recommendation: OptimizationRecommendation): OptimizationRecommendation {
    if (recommendation.status === "applied") {
      throw new OptimizationError(recommendation.area, `Recommendation ${recommendation.id} is already applied`);
    }

    const updated: OptimizationRecommendation = {
      ...recommendation,
      status: "applied",
      appliedAt: new Date(),
    };
    this.recommendations.set(updated.id, updated);
    return updated;
  }

  dismiss(recommendation: OptimizationRecommendation): OptimizationRecommendation {
    if (recommendation.status === "applied") {
      throw new OptimizationError(recommendation.area, `Cannot dismiss an already applied recommendation ${recommendation.id}`);
    }

    const updated: OptimizationRecommendation = {
      ...recommendation,
      status: "dismissed",
    };
    this.recommendations.set(updated.id, updated);
    return updated;
  }

  getRecommendation(id: string): OptimizationRecommendation | undefined {
    return this.recommendations.get(id);
  }

  listRecommendations(status?: "pending" | "applied" | "dismissed"): OptimizationRecommendation[] {
    const all = Array.from(this.recommendations.values());
    if (status) {
      return all.filter((r) => r.status === status);
    }
    return all;
  }
}
