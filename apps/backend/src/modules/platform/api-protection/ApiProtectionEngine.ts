import type {
  ApiProtectionEngine as ApiProtectionEngineInterface,
  ApiProtectionEngineOptions,
  ProtectionContext,
  ProtectionDecision,
  ProtectionRule,
  ProtectionPipeline,
  ThreatAnalysis,
  ApiProtectionEvent,
} from "./types.js";
import { isRejected, isWarning } from "./ProtectionDecision.js";

const ESALATION_SEVERITY_ORDER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export class ApiProtectionEngine implements ApiProtectionEngineInterface {
  readonly name: string;
  private readonly pipeline: ProtectionPipeline;
  private readonly logger?: ApiProtectionEngineOptions["logger"];
  private readonly eventPublisher?: ApiProtectionEngineOptions["eventPublisher"];
  private readonly metrics?: ApiProtectionEngineOptions["metrics"];
  private readonly escalationThreshold: number;

  constructor(options: ApiProtectionEngineOptions) {
    this.name = options.pipeline.name;
    this.pipeline = options.pipeline;
    this.logger = options.logger;
    this.eventPublisher = options.eventPublisher;
    this.metrics = options.metrics;
    this.escalationThreshold = ESALATION_SEVERITY_ORDER[options.escalationThreshold ?? "medium"] ?? 2;
  }

  async evaluate(context: ProtectionContext): Promise<ProtectionDecision> {
    const pipelineStart = performance.now();

    this.logger?.debug("API Protection: evaluating request", {
      requestId: context.requestId,
      method: context.method,
      path: context.path,
    });

    const result = await this.pipeline.execute(context);

    this.metrics?.recordPipelineDuration(result.duration);

    const decision = result.finalDecision;

    if (isRejected(decision)) {
      this.metrics?.incrementRejected(decision.ruleName, decision.threatCategory);

      this.logger?.warn("API Protection: request rejected", {
        requestId: context.requestId,
        ruleName: decision.ruleName,
        reason: decision.reason,
        threatCategory: decision.threatCategory,
        duration: result.duration,
      });

      await this.publishEvent("api_request_rejected", context, decision, undefined, result.duration);
    } else if (isWarning(decision)) {
      this.metrics?.incrementWarnings(decision.ruleName, decision.threatCategory);

      this.logger?.info("API Protection: request warned", {
        requestId: context.requestId,
        ruleName: decision.ruleName,
        reason: decision.reason,
        duration: result.duration,
      });

      await this.publishEvent("api_protection_warning", context, decision, undefined, result.duration);
    }

    const threatDecisions = result.decisions.filter((d) => d.threatCategory);

    for (const td of threatDecisions) {
      if (td.threatCategory) {
        this.metrics?.incrementThreatCategory(td.threatCategory);
      }

      if (td.action !== "reject") {
        const threatSeverity = ESALATION_SEVERITY_ORDER[td.severity ?? "low"] ?? 1;

        if (threatSeverity >= this.escalationThreshold) {
          await this.publishEvent("api_threat_detected", context, td, undefined, result.duration);
        }
      }
    }

    return decision;
  }

  getPipeline(): ProtectionPipeline {
    return this.pipeline;
  }

  registerRule(rule: ProtectionRule): void {
    this.pipeline.addRule(rule);
  }

  registerRules(rules: ProtectionRule[]): void {
    this.pipeline.addRules(rules);
  }

  private async publishEvent(
    type: ApiProtectionEvent["type"],
    context: ProtectionContext,
    decision: ProtectionDecision,
    threatAnalysis?: ThreatAnalysis,
    duration?: number,
  ): Promise<void> {
    if (!this.eventPublisher) {
      return;
    }

    try {
      const event: ApiProtectionEvent = {
        type,
        context,
        decision,
        threatAnalysis,
        timestamp: new Date(),
        metadata: {
          source: `ApiProtectionEngine:${this.name}`,
          ruleName: decision.ruleName,
          reason: decision.reason,
          threatCategory: decision.threatCategory,
          severity: decision.severity,
          duration,
          pipelineDuration: duration,
        },
      };

      await this.eventPublisher.publish({
        id: `ap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        occurredAt: new Date(),
        metadata: {
          correlationId: context.requestId ?? "",
          version: 1,
          timestamp: new Date().toISOString(),
          source: `ApiProtectionEngine:${this.name}`,
          custom: event.metadata,
        },
        payload: {
          context,
          decision,
          threatAnalysis,
        },
      });
    } catch (error) {
      this.logger?.error("Failed to publish API protection event", {
        error: error instanceof Error ? error.message : String(error),
        eventType: type,
      });
    }
  }
}
