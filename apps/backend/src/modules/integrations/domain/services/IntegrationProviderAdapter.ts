import type { IntegrationContext } from "../models/IntegrationContext.js";
import type { ConnectionProfile } from "../models/ConnectionProfile.js";
import type { IntegrationDefinition } from "../models/IntegrationDefinition.js";

export interface ProviderExecutionResult {
  success: boolean;
  data?: Record<string, unknown>;
  recordsProcessed: number;
  processingTimeMs: number;
  error?: string;
}

export interface ProviderCapabilities {
  maxBatchSize: number;
  supportsStreaming: boolean;
  supportsBulkOperations: boolean;
  rateLimit: number;
}

export interface IntegrationProviderAdapter {
  readonly providerType: string;
  execute(context: IntegrationContext, definition: IntegrationDefinition, profile: ConnectionProfile): Promise<ProviderExecutionResult>;
  validate(definition: IntegrationDefinition, profile: ConnectionProfile): Promise<boolean>;
  checkHealth(profile: ConnectionProfile): Promise<{ isOnline: boolean; responseTimeMs: number; message?: string }>;
  getCapabilities(): ProviderCapabilities;
}

export class ERPAdapter implements IntegrationProviderAdapter {
  readonly providerType = "erp";

  async execute(context: IntegrationContext, _definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      success: true,
      data: { simulated: true, capability: context.capability, items: [] },
      recordsProcessed: 0,
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(_definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<boolean> { return true; }

  async checkHealth(_profile: ConnectionProfile): Promise<{ isOnline: boolean; responseTimeMs: number; message?: string }> {
    return { isOnline: true, responseTimeMs: 45, message: "ERP system reachable" };
  }

  getCapabilities(): ProviderCapabilities {
    return { maxBatchSize: 1000, supportsStreaming: false, supportsBulkOperations: true, rateLimit: 100 };
  }
}

export class CRMAdapter implements IntegrationProviderAdapter {
  readonly providerType = "crm";

  async execute(context: IntegrationContext, _definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      success: true,
      data: { simulated: true, capability: context.capability, records: [] },
      recordsProcessed: 0,
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(_definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<boolean> { return true; }

  async checkHealth(_profile: ConnectionProfile): Promise<{ isOnline: boolean; responseTimeMs: number; message?: string }> {
    return { isOnline: true, responseTimeMs: 120, message: "CRM API reachable" };
  }

  getCapabilities(): ProviderCapabilities {
    return { maxBatchSize: 500, supportsStreaming: true, supportsBulkOperations: true, rateLimit: 60 };
  }
}

export class POSAdapter implements IntegrationProviderAdapter {
  readonly providerType = "pos";

  async execute(context: IntegrationContext, _definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      success: true,
      data: { simulated: true, capability: context.capability, transactions: [] },
      recordsProcessed: 0,
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(_definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<boolean> { return true; }

  async checkHealth(_profile: ConnectionProfile): Promise<{ isOnline: boolean; responseTimeMs: number; message?: string }> {
    return { isOnline: true, responseTimeMs: 30, message: "POS system connected" };
  }

  getCapabilities(): ProviderCapabilities {
    return { maxBatchSize: 200, supportsStreaming: true, supportsBulkOperations: false, rateLimit: 200 };
  }
}

export class AccountingAdapter implements IntegrationProviderAdapter {
  readonly providerType = "accounting";

  async execute(context: IntegrationContext, _definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      success: true,
      data: { simulated: true, capability: context.capability, entries: [] },
      recordsProcessed: 0,
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(_definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<boolean> { return true; }

  async checkHealth(_profile: ConnectionProfile): Promise<{ isOnline: boolean; responseTimeMs: number; message?: string }> {
    return { isOnline: true, responseTimeMs: 80, message: "Accounting API reachable" };
  }

  getCapabilities(): ProviderCapabilities {
    return { maxBatchSize: 500, supportsStreaming: false, supportsBulkOperations: true, rateLimit: 50 };
  }
}

export class PaymentsAdapter implements IntegrationProviderAdapter {
  readonly providerType = "payments";

  async execute(context: IntegrationContext, _definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      success: true,
      data: { simulated: true, capability: context.capability, payments: [] },
      recordsProcessed: 0,
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(_definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<boolean> { return true; }

  async checkHealth(_profile: ConnectionProfile): Promise<{ isOnline: boolean; responseTimeMs: number; message?: string }> {
    return { isOnline: true, responseTimeMs: 60, message: "Payment gateway reachable" };
  }

  getCapabilities(): ProviderCapabilities {
    return { maxBatchSize: 100, supportsStreaming: false, supportsBulkOperations: false, rateLimit: 30 };
  }
}

export class MarketingAdapter implements IntegrationProviderAdapter {
  readonly providerType = "marketing";

  async execute(context: IntegrationContext, _definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      success: true,
      data: { simulated: true, capability: context.capability, campaigns: [] },
      recordsProcessed: 0,
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(_definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<boolean> { return true; }

  async checkHealth(_profile: ConnectionProfile): Promise<{ isOnline: boolean; responseTimeMs: number; message?: string }> {
    return { isOnline: true, responseTimeMs: 90, message: "Marketing API reachable" };
  }

  getCapabilities(): ProviderCapabilities {
    return { maxBatchSize: 1000, supportsStreaming: false, supportsBulkOperations: true, rateLimit: 40 };
  }
}

export class MessagingAdapter implements IntegrationProviderAdapter {
  readonly providerType = "messaging";

  async execute(context: IntegrationContext, _definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      success: true,
      data: { simulated: true, capability: context.capability, messages: [] },
      recordsProcessed: 0,
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(_definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<boolean> { return true; }

  async checkHealth(_profile: ConnectionProfile): Promise<{ isOnline: boolean; responseTimeMs: number; message?: string }> {
    return { isOnline: true, responseTimeMs: 35, message: "Messaging service reachable" };
  }

  getCapabilities(): ProviderCapabilities {
    return { maxBatchSize: 500, supportsStreaming: true, supportsBulkOperations: false, rateLimit: 150 };
  }
}

export class AnalyticsAdapter implements IntegrationProviderAdapter {
  readonly providerType = "analytics";

  async execute(context: IntegrationContext, _definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      success: true,
      data: { simulated: true, capability: context.capability, reports: [] },
      recordsProcessed: 0,
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(_definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<boolean> { return true; }

  async checkHealth(_profile: ConnectionProfile): Promise<{ isOnline: boolean; responseTimeMs: number; message?: string }> {
    return { isOnline: true, responseTimeMs: 150, message: "Analytics API reachable" };
  }

  getCapabilities(): ProviderCapabilities {
    return { maxBatchSize: 2000, supportsStreaming: true, supportsBulkOperations: true, rateLimit: 20 };
  }
}

export class IdentityAdapter implements IntegrationProviderAdapter {
  readonly providerType = "identity";

  async execute(context: IntegrationContext, _definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      success: true,
      data: { simulated: true, capability: context.capability, identities: [] },
      recordsProcessed: 0,
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(_definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<boolean> { return true; }

  async checkHealth(_profile: ConnectionProfile): Promise<{ isOnline: boolean; responseTimeMs: number; message?: string }> {
    return { isOnline: true, responseTimeMs: 55, message: "Identity provider reachable" };
  }

  getCapabilities(): ProviderCapabilities {
    return { maxBatchSize: 100, supportsStreaming: false, supportsBulkOperations: false, rateLimit: 100 };
  }
}

export class CustomAdapter implements IntegrationProviderAdapter {
  readonly providerType = "custom";

  async execute(context: IntegrationContext, _definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      success: true,
      data: { simulated: true, capability: context.capability, custom: true },
      recordsProcessed: 0,
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(_definition: IntegrationDefinition, _profile: ConnectionProfile): Promise<boolean> { return true; }

  async checkHealth(_profile: ConnectionProfile): Promise<{ isOnline: boolean; responseTimeMs: number; message?: string }> {
    return { isOnline: true, responseTimeMs: 25, message: "Custom integration reachable" };
  }

  getCapabilities(): ProviderCapabilities {
    return { maxBatchSize: 100, supportsStreaming: false, supportsBulkOperations: false, rateLimit: 60 };
  }
}
