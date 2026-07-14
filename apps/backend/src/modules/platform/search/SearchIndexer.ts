import type {
  SearchDocument,
  SearchIndexConfig,
  IndexOperationResult,
  BulkIndexResult,
} from "./types.js";
import type { SearchIndex } from "./SearchIndex.js";
import {
  IndexNotFoundError,
  DocumentNotFoundError,
} from "./errors.js";

interface IndexDocumentStore {
  [documentId: string]: SearchDocument;
}

export class SearchIndexer {
  private readonly store = new Map<string, IndexDocumentStore>();

  constructor(private readonly indexManager: SearchIndex) {}

  index(index: string, document: SearchDocument): IndexOperationResult {
    const indexName = this.resolveIndex(index);

    if (!this.indexManager.exists(indexName)) {
      throw new IndexNotFoundError(indexName);
    }

    const docStore = this.getOrCreateStore(indexName);
    const version = document.version || 1;

    const stored: SearchDocument = {
      ...document,
      id: document.id,
      version,
    };

    docStore[document.id] = stored;

    return {
      index: indexName,
      documentId: document.id,
      success: true,
      version,
    };
  }

  update(index: string, document: Partial<SearchDocument> & { id: string }): IndexOperationResult {
    const indexName = this.resolveIndex(index);
    const docStore = this.store.get(indexName);

    if (!docStore || !docStore[document.id]) {
      throw new DocumentNotFoundError(indexName, document.id);
    }

    const existing = docStore[document.id];
    const newVersion = existing.version + 1;

    docStore[document.id] = {
      ...existing,
      ...document,
      payload: { ...existing.payload, ...(document.payload ?? {}) },
      metadata: { ...existing.metadata, ...(document.metadata ?? {}) },
      version: newVersion,
    };

    return {
      index: indexName,
      documentId: document.id,
      success: true,
      version: newVersion,
    };
  }

  delete(index: string, documentId: string): IndexOperationResult {
    const indexName = this.resolveIndex(index);
    const docStore = this.store.get(indexName);

    if (!docStore || !docStore[documentId]) {
      throw new DocumentNotFoundError(indexName, documentId);
    }

    delete docStore[documentId];

    return {
      index: indexName,
      documentId,
      success: true,
      version: 0,
    };
  }

  bulkIndex(index: string, documents: SearchDocument[]): BulkIndexResult {
    const startTime = Date.now();
    const errors: IndexOperationResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const doc of documents) {
      try {
        this.index(index, doc);
        successCount++;
      } catch (error) {
        failureCount++;
        errors.push({
          index,
          documentId: doc.id,
          success: false,
          version: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      successCount,
      failureCount,
      errors,
      tookMs: Date.now() - startTime,
    };
  }

  getDocument(index: string, documentId: string): SearchDocument | null {
    const indexName = this.resolveIndex(index);
    const docStore = this.store.get(indexName);
    return docStore?.[documentId] ?? null;
  }

  listDocuments(index: string): SearchDocument[] {
    const indexName = this.resolveIndex(index);
    const docStore = this.store.get(indexName);
    return docStore ? Object.values(docStore) : [];
  }

  countDocuments(index: string): number {
    const indexName = this.resolveIndex(index);
    const docStore = this.store.get(indexName);
    return docStore ? Object.keys(docStore).length : 0;
  }

  clearIndex(index: string): void {
    const indexName = this.resolveIndex(index);
    this.store.delete(indexName);
  }

  clearAll(): void {
    this.store.clear();
  }

  private getOrCreateStore(index: string): IndexDocumentStore {
    if (!this.store.has(index)) {
      this.store.set(index, {});
    }
    return this.store.get(index)!;
  }

  private resolveIndex(index: string): string {
    const prefix = this.indexManager.prefix;
    if (index.startsWith(prefix)) {
      return index;
    }
    return `${prefix}${index}`;
  }
}
