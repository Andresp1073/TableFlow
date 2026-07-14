import type { EventMetadata as EventMetadataInterface } from "./types.js";

let nextCounter = 0;

export function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const counter = (nextCounter++).toString(36).padStart(4, "0");
  const random = Math.random().toString(36).slice(2, 8);

  return `evt_${timestamp}${counter}${random}`;
}

export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);

  return `corr_${timestamp}${random}`;
}

export class EventMetadataFactory {
  static create(options?: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    tenantId?: string;
    source?: string;
    version?: number;
    custom?: Record<string, unknown>;
  }): EventMetadataInterface {
    return {
      correlationId: options?.correlationId ?? generateCorrelationId(),
      causationId: options?.causationId,
      userId: options?.userId,
      tenantId: options?.tenantId,
      source: options?.source ?? "unknown",
      version: options?.version ?? 1,
      timestamp: new Date().toISOString(),
      custom: options?.custom,
    };
  }

  static fromEvent(
    event: { metadata: EventMetadataInterface },
    overrides?: { userId?: string; tenantId?: string; source?: string; custom?: Record<string, unknown> },
  ): EventMetadataInterface {
    return {
      correlationId: event.metadata.correlationId,
      causationId: event.metadata.causationId ?? event.metadata.correlationId,
      userId: overrides?.userId ?? event.metadata.userId,
      tenantId: overrides?.tenantId ?? event.metadata.tenantId,
      source: overrides?.source ?? event.metadata.source,
      version: event.metadata.version + 1,
      timestamp: new Date().toISOString(),
      custom: overrides?.custom ?? event.metadata.custom,
    };
  }
}
