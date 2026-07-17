export { IntegrationManager } from "./IntegrationManager.js";
export { ConnectionManager } from "./ConnectionManager.js";
export { HealthMonitor } from "./HealthMonitor.js";
export { IntegrationOrchestrator } from "./IntegrationOrchestrator.js";
export {
  ERPAdapter, CRMAdapter, POSAdapter, AccountingAdapter,
  PaymentsAdapter, MarketingAdapter, MessagingAdapter,
  AnalyticsAdapter, IdentityAdapter, CustomAdapter,
} from "./IntegrationProviderAdapter.js";
export type { IntegrationProviderAdapter, ProviderExecutionResult, ProviderCapabilities } from "./IntegrationProviderAdapter.js";
