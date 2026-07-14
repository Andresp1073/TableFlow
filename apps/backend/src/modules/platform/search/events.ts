import type { EventPublisher, Event } from "../event-bus/types.js";
import type { Logger } from "../observability/types.js";
import type { SearchEventType, SearchDocument } from "./types.js";
import { generateEventId, generateCorrelationId } from "../event-bus/EventMetadata.js";

export function createSearchEvent(
  type: SearchEventType,
  index: string,
  additionalPayload?: Record<string, unknown>,
): Event {
  return {
    id: generateEventId(),
    type,
    occurredAt: new Date(),
    metadata: {
      correlationId: generateCorrelationId(),
      version: 1,
      timestamp: new Date().toISOString(),
      source: "SearchManager",
      custom: {
        index,
        eventType: type,
      },
    },
    payload: {
      index,
      ...additionalPayload,
    },
  };
}

export function createDocumentSearchEvent(
  type: "search.document_indexed" | "search.document_updated" | "search.document_removed",
  index: string,
  document: SearchDocument | { id: string; type?: string },
  additionalPayload?: Record<string, unknown>,
): Event {
  return {
    id: generateEventId(),
    type,
    occurredAt: new Date(),
    metadata: {
      correlationId: generateCorrelationId(),
      version: 1,
      timestamp: new Date().toISOString(),
      source: "SearchManager",
      custom: {
        index,
        documentId: document.id,
        documentType: "type" in document ? document.type : undefined,
      },
    },
    payload: {
      index,
      documentId: document.id,
      documentType: "type" in document ? document.type : undefined,
      ...additionalPayload,
    },
  };
}

export async function publishSearchEvent(
  publisher: EventPublisher | undefined,
  logger: Logger | undefined,
  type: SearchEventType,
  index: string,
  additionalPayload?: Record<string, unknown>,
): Promise<void> {
  if (!publisher) {
    return;
  }

  try {
    const event = createSearchEvent(type, index, additionalPayload);
    await publisher.publish(event);
  } catch (error) {
    logger?.error("Failed to publish search event", {
      eventType: type,
      index,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function publishDocumentSearchEvent(
  publisher: EventPublisher | undefined,
  logger: Logger | undefined,
  type: "search.document_indexed" | "search.document_updated" | "search.document_removed",
  index: string,
  document: SearchDocument | { id: string; type?: string },
  additionalPayload?: Record<string, unknown>,
): Promise<void> {
  if (!publisher) {
    return;
  }

  try {
    const event = createDocumentSearchEvent(type, index, document, additionalPayload);
    await publisher.publish(event);
  } catch (error) {
    logger?.error("Failed to publish document search event", {
      eventType: type,
      index,
      documentId: document.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
