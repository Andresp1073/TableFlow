import type { SearchDocument as SearchDocumentInterface } from "./types.js";

let documentIdCounter = 0;

export function generateDocumentId(): string {
  const timestamp = Date.now().toString(36);
  const counter = (documentIdCounter++).toString(36).padStart(4, "0");
  const random = Math.random().toString(36).slice(2, 8);
  return `doc_${timestamp}${counter}${random}`;
}

export function buildSearchDocument(
  type: string,
  payload: Record<string, unknown>,
  options?: {
    id?: string;
    metadata?: Record<string, string>;
    score?: number;
  },
): SearchDocumentInterface {
  return {
    id: options?.id ?? generateDocumentId(),
    type,
    payload,
    metadata: options?.metadata ?? {},
    indexedAt: new Date(),
    version: 1,
    score: options?.score,
  };
}

export function cloneSearchDocument(
  document: SearchDocumentInterface,
  overrides?: Partial<SearchDocumentInterface>,
): SearchDocumentInterface {
  return {
    ...document,
    payload: { ...document.payload, ...(overrides?.payload ?? {}) },
    metadata: { ...document.metadata, ...(overrides?.metadata ?? {}) },
    ...overrides,
  };
}
