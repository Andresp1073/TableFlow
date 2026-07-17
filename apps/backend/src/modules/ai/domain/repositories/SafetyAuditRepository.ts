import type { SafetyConfig } from "../models/SafetyConfig.js";

export interface SafetyAuditEvent {
  id: string;
  restaurantId: string;
  requestId: string;
  eventType: "prompt_validation" | "output_validation" | "pii_masked" | "rate_limit_hit" | "audit_log";
  details: Record<string, unknown>;
  createdAt: Date;
}

export interface SafetyAuditRepository {
  saveConfig(config: SafetyConfig): Promise<void>;
  findConfigByRestaurant(restaurantId: string): Promise<SafetyConfig | null>;
  logEvent(event: SafetyAuditEvent): Promise<void>;
  findEventsByRestaurant(restaurantId: string, limit?: number): Promise<SafetyAuditEvent[]>;
}
