export type {
  ProtectionAction,
  ThreatCategory,
  ProtectionEventType,
  ProtectionContext,
  ProtectionDecision,
  ProtectionRule as ProtectionRuleInterface,
  ProtectionPipeline as ProtectionPipelineInterface,
  PipelineResult,
  ThreatAnalyzer as ThreatAnalyzerInterface,
  ThreatAnalysis,
  ThreatFinding,
  ApiProtectionMetricsCollector,
  ApiProtectionEngine as ApiProtectionEngineInterface,
  ApiProtectionEngineOptions,
  ApiProtectionEvent,
} from "./types.js";

export { createAllowedDecision, createRejectedDecision, createWarningDecision, createContinueDecision, isAllowed, isRejected, isWarning, isContinue, isTerminal, severityScore } from "./ProtectionDecision.js";
export { ProtectionContextBuilder, createProtectionContext } from "./ProtectionContext.js";
export { ProtectionPipeline } from "./ProtectionPipeline.js";
export { ThreatAnalyzer } from "./ThreatAnalyzer.js";
export { ApiProtectionEngine } from "./ApiProtectionEngine.js";
export {
  BaseRule,
  ContentTypeValidationRule,
  PayloadSizeValidationRule,
  HeaderValidationRule,
  HttpMethodValidationRule,
  OriginValidationRule,
  UserAgentValidationRule,
  ThreatDetectionRule,
  FutureExtensionRule,
} from "./rules/index.js";
