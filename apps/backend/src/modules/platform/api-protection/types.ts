import type { SecurityContext } from "../security/types.js";
import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";

export type ProtectionAction = "allow" | "reject" | "warn" | "continue";

export type ThreatCategory =
  | "malformed_request"
  | "header_injection"
  | "invalid_content_type"
  | "oversized_payload"
  | "unexpected_method"
  | "suspicious_origin"
  | "malicious_user_agent"
  | "sql_injection"
  | "xss"
  | "path_traversal"
  | "request_anomaly";

export type ProtectionEventType = "api_threat_detected" | "api_request_rejected" | "api_protection_warning";

export interface ProtectionContext {
  requestId: string;
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body: unknown;
  contentType?: string;
  contentLength?: number;
  ipAddress?: string;
  userAgent?: string;
  origin?: string;
  referer?: string;
  securityContext?: SecurityContext;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface ProtectionDecision {
  action: ProtectionAction;
  ruleName: string;
  reason: string;
  threatCategory?: ThreatCategory;
  severity?: "low" | "medium" | "high" | "critical";
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface ProtectionRule {
  readonly name: string;
  readonly priority: number;
  readonly enabled: boolean;
  evaluate(context: ProtectionContext): Promise<ProtectionDecision>;
}

export interface ProtectionPipeline {
  readonly name: string;
  addRule(rule: ProtectionRule): void;
  addRules(rules: ProtectionRule[]): void;
  removeRule(name: string): void;
  getRule(name: string): ProtectionRule | undefined;
  execute(context: ProtectionContext): Promise<PipelineResult>;
  clear(): void;
  ruleCount(): number;
}

export interface PipelineResult {
  passed: boolean;
  decisions: ProtectionDecision[];
  finalDecision: ProtectionDecision;
  duration: number;
}

export interface ThreatAnalyzer {
  analyze(context: ProtectionContext): Promise<ThreatAnalysis>;
}

export interface ThreatAnalysis {
  threats: ThreatFinding[];
  riskScore: number;
}

export interface ThreatFinding {
  category: ThreatCategory;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ApiProtectionMetricsCollector {
  incrementRejected(ruleName: string, category?: string): void;
  incrementWarnings(ruleName: string, category?: string): void;
  incrementThreatCategory(category: string): void;
  recordPipelineDuration(durationMs: number): void;
  incrementRuleDuration(ruleName: string, durationMs: number): void;
}

export interface ApiProtectionEngine {
  readonly name: string;
  evaluate(context: ProtectionContext): Promise<ProtectionDecision>;
  getPipeline(): ProtectionPipeline;
  registerRule(rule: ProtectionRule): void;
  registerRules(rules: ProtectionRule[]): void;
}

export interface ApiProtectionEngineOptions {
  pipeline: ProtectionPipeline;
  threatAnalyzer?: ThreatAnalyzer;
  logger?: Logger;
  eventPublisher?: EventPublisher;
  metrics?: ApiProtectionMetricsCollector;
  escalationThreshold?: "low" | "medium" | "high" | "critical";
}

export interface ApiProtectionEvent {
  type: ProtectionEventType;
  context: ProtectionContext;
  decision: ProtectionDecision;
  threatAnalysis?: ThreatAnalysis;
  timestamp: Date;
  metadata: Record<string, unknown>;
}
