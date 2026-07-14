import type {
  SearchProvider as SearchProviderInterface,
  SearchQuery,
  SearchDocument,
  SearchResult,
  SearchIndexConfig,
  IndexOperationResult,
  BulkIndexResult,
  SearchAutocompleteOptions,
  FacetedSearchRequest,
  SearchProviderConfig,
  Logger,
  EventPublisher,
} from "./types.js";
import type { SearchQueryBuilder } from "./SearchQueryBuilder.js";
import type { SearchIndex } from "./SearchIndex.js";
import type { SearchIndexer } from "./SearchIndexer.js";
import { buildSearchResult, buildEmptySearchResult } from "./SearchResult.js";
import { publishSearchEvent, publishDocumentSearchEvent } from "./events.js";
import { IndexNotFoundError } from "./errors.js";

export class SearchManager implements SearchProviderInterface {
  private logger?: Logger;
  private eventPublisher?: EventPublisher;

  constructor(
    private readonly indexManager: SearchIndex,
    private readonly indexer: SearchIndexer,
    private readonly config: SearchProviderConfig,
  ) {}

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  setEventPublisher(publisher: EventPublisher): void {
    this.eventPublisher = publisher;
  }

  async search(index: string, query: SearchQuery): Promise<SearchResult> {
    const indexName = this.indexManager.resolveName(index);
    this.logger?.info(`Search executed on index "${indexName}"`, { query: query.query });

    const startTime = Date.now();

    if (!this.indexManager.exists(indexName)) {
      publishSearchEvent(this.eventPublisher, this.logger, "search.executed", indexName, {
        query: query.query,
        tookMs: 0,
        total: 0,
      });
      return buildEmptySearchResult(query.query, {
        offset: query.pagination?.offset,
        limit: query.pagination?.limit,
      });
    }

    const allDocs = this.indexer.listDocuments(indexName);
    const limit = Math.min(query.pagination?.limit ?? this.config.defaultLimit, this.config.maxLimit);
    const offset = query.pagination?.offset ?? 0;

    let filtered = this.applyQueryFilter(allDocs, query);
    let sorted = this.applySorting(filtered, query);
    const total = sorted.length;

    const page = sorted.slice(offset, offset + limit);
    const tookMs = Date.now() - startTime;

    const result = buildSearchResult(query.query, page, total, offset, limit, {
      tookMs,
      maxScore: page.length > 0 ? (page[0].score ?? 1) : undefined,
    });

    publishSearchEvent(this.eventPublisher, this.logger, "search.executed", indexName, {
      query: query.query,
      tookMs,
      total,
    });

    return result;
  }

  async autocomplete(index: string, prefix: string, options?: SearchAutocompleteOptions): Promise<string[]> {
    const indexName = this.indexManager.resolveName(index);
    this.logger?.info(`Autocomplete on index "${indexName}"`, { prefix });

    if (!this.indexManager.exists(indexName)) {
      return [];
    }

    const allDocs = this.indexer.listDocuments(indexName);
    const suggestions = new Set<string>();

    for (const doc of allDocs) {
      if (options?.type && doc.type !== options.type) {
        continue;
      }

      for (const [, value] of Object.entries(doc.payload)) {
        if (typeof value === "string" && value.toLowerCase().startsWith(prefix.toLowerCase())) {
          suggestions.add(value);
        }
      }
    }

    const size = options?.size ?? 10;
    return Array.from(suggestions).slice(0, size);
  }

  async facetedSearch(index: string, request: FacetedSearchRequest): Promise<SearchResult> {
    const baseResult = await this.search(index, request.query);

    const facets: Record<string, Array<{ value: string; count: number }>> = {};

    if (!this.indexManager.exists(this.indexManager.resolveName(index))) {
      return baseResult;
    }

    const allDocs = this.indexer.listDocuments(this.indexManager.resolveName(index));
    const filtered = this.applyQueryFilter(allDocs, request.query);

    for (const facetReq of request.facets) {
      const counts = new Map<string, number>();

      for (const doc of filtered) {
        const value = doc.payload[facetReq.field];
        if (value !== undefined && value !== null) {
          const key = String(value);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }

      let entries = Array.from(counts.entries()).map(([value, count]) => ({ value, count }));

      if (facetReq.order === "count") {
        entries.sort((a, b) => b.count - a.count);
      } else {
        entries.sort((a, b) => a.value.localeCompare(b.value));
      }

      if (facetReq.size) {
        entries = entries.slice(0, facetReq.size);
      }

      facets[facetReq.field] = entries;
    }

    return {
      ...baseResult,
      facets,
    };
  }

  async indexDocument(index: string, document: SearchDocument): Promise<IndexOperationResult> {
    const indexName = this.indexManager.resolveName(index);
    this.logger?.info(`Indexing document in "${indexName}"`, { documentId: document.id });

    const result = this.indexer.index(indexName, document);

    publishDocumentSearchEvent(this.eventPublisher, this.logger, "search.document_indexed", indexName, document, {
      version: result.version,
    });

    return result;
  }

  async updateDocument(
    index: string,
    document: Partial<SearchDocument> & { id: string },
  ): Promise<IndexOperationResult> {
    const indexName = this.indexManager.resolveName(index);
    this.logger?.info(`Updating document in "${indexName}"`, { documentId: document.id });

    const result = this.indexer.update(indexName, document);

    publishDocumentSearchEvent(this.eventPublisher, this.logger, "search.document_updated", indexName, document, {
      version: result.version,
    });

    return result;
  }

  async deleteDocument(index: string, documentId: string): Promise<IndexOperationResult> {
    const indexName = this.indexManager.resolveName(index);
    this.logger?.info(`Deleting document from "${indexName}"`, { documentId });

    const result = this.indexer.delete(indexName, documentId);

    publishDocumentSearchEvent(this.eventPublisher, this.logger, "search.document_removed", indexName, { id: documentId }, {
      version: result.version,
    });

    return result;
  }

  async bulkIndex(index: string, documents: SearchDocument[]): Promise<BulkIndexResult> {
    const indexName = this.indexManager.resolveName(index);
    this.logger?.info(`Bulk indexing ${documents.length} documents in "${indexName}"`);

    return this.indexer.bulkIndex(indexName, documents);
  }

  async createIndex(config: SearchIndexConfig): Promise<boolean> {
    const result = this.indexManager.create(config);

    if (result) {
      publishSearchEvent(this.eventPublisher, this.logger, "search.index_created", config.name, {
        version: config.version,
      });
    }

    return result;
  }

  async deleteIndex(index: string): Promise<boolean> {
    const indexName = this.indexManager.resolveName(index);

    const result = this.indexManager.delete(indexName);

    if (result) {
      this.indexer.clearIndex(indexName);
      publishSearchEvent(this.eventPublisher, this.logger, "search.index_deleted", indexName);
    }

    return result;
  }

  async rebuildIndex(index: string): Promise<boolean> {
    const indexName = this.indexManager.resolveName(index);

    const result = this.indexManager.rebuild(indexName);

    if (result) {
      publishSearchEvent(this.eventPublisher, this.logger, "search.index_rebuilt", indexName, {
        version: this.indexManager.getVersion(indexName),
      });
    }

    return result;
  }

  async refreshIndex(index: string): Promise<boolean> {
    const indexName = this.indexManager.resolveName(index);

    const result = this.indexManager.refresh(indexName);

    if (result) {
      publishSearchEvent(this.eventPublisher, this.logger, "search.index_refreshed", indexName);
    }

    return result;
  }

  async getIndex(index: string): Promise<SearchIndexConfig | null> {
    return this.indexManager.get(index);
  }

  async listIndexes(): Promise<string[]> {
    return this.indexManager.list();
  }

  async indexExists(index: string): Promise<boolean> {
    return this.indexManager.exists(index);
  }

  private applyQueryFilter(docs: SearchDocument[], query: SearchQuery): SearchDocument[] {
    let filtered = docs;

    if (query.type) {
      filtered = filtered.filter((d) => d.type === query.type);
    }

    if (query.filters && query.filters.length > 0) {
      for (const filter of query.filters) {
        filtered = filtered.filter((doc) => {
          const fieldValue = doc.payload[filter.field];
          return this.evaluateFilter(fieldValue, filter.operator, filter.value);
        });
      }
    }

    if (query.query && query.query.trim().length > 0) {
      const searchTerms = query.query.toLowerCase().split(/\s+/);
      filtered = filtered.filter((doc) => {
        const searchableFields = query.fields ?? Object.keys(doc.payload);
        return searchableFields.some((field) => {
          const value = doc.payload[field];
          if (typeof value === "string") {
            const lower = value.toLowerCase();
            return searchTerms.every((term) => lower.includes(term));
          }
          if (typeof value === "number" || typeof value === "boolean") {
            return searchTerms.some((term) => String(value).toLowerCase().includes(term));
          }
          return false;
        });
      });
    }

    if (query.boost && query.boost.length > 0) {
      filtered = filtered.map((doc) => {
        let score = 1;
        for (const b of query.boost!) {
          const fieldValue = doc.payload[b.field];
          if (typeof fieldValue === "string" && fieldValue.toLowerCase().includes(query.query.toLowerCase())) {
            score += b.value;
          }
        }
        return { ...doc, score };
      });
    }

    return filtered;
  }

  private evaluateFilter(fieldValue: unknown, operator: string, filterValue: unknown): boolean {
    switch (operator) {
      case "eq":
        return fieldValue === filterValue;
      case "neq":
        return fieldValue !== filterValue;
      case "gt":
        return typeof fieldValue === "number" && typeof filterValue === "number" && fieldValue > filterValue;
      case "gte":
        return typeof fieldValue === "number" && typeof filterValue === "number" && fieldValue >= filterValue;
      case "lt":
        return typeof fieldValue === "number" && typeof filterValue === "number" && fieldValue < filterValue;
      case "lte":
        return typeof fieldValue === "number" && typeof filterValue === "number" && fieldValue <= filterValue;
      case "in":
        return Array.isArray(filterValue) && filterValue.includes(fieldValue);
      case "not_in":
        return Array.isArray(filterValue) && !filterValue.includes(fieldValue);
      case "exists":
        return fieldValue !== undefined && fieldValue !== null;
      case "not_exists":
        return fieldValue === undefined || fieldValue === null;
      case "between":
        return Array.isArray(filterValue) && filterValue.length === 2 &&
          typeof fieldValue === "number" && typeof filterValue[0] === "number" && typeof filterValue[1] === "number" &&
          fieldValue >= filterValue[0] && fieldValue <= filterValue[1];
      case "prefix":
        return typeof fieldValue === "string" && typeof filterValue === "string" &&
          fieldValue.toLowerCase().startsWith(filterValue.toLowerCase());
      case "wildcard":
        return typeof fieldValue === "string" && typeof filterValue === "string" &&
          this.matchWildcard(fieldValue.toLowerCase(), filterValue.toLowerCase());
      case "regexp":
        return typeof fieldValue === "string" && typeof filterValue === "string" &&
          new RegExp(filterValue).test(fieldValue);
      default:
        return true;
    }
  }

  private matchWildcard(value: string, pattern: string): boolean {
    const regex = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    return new RegExp(`^${regex}$`).test(value);
  }

  private applySorting(docs: SearchDocument[], query: SearchQuery): SearchDocument[] {
    if (!query.sort) {
      return docs;
    }

    const { field, order } = query.sort;
    const multiplier = order === "asc" ? 1 : -1;

    return [...docs].sort((a, b) => {
      const aVal = a.payload[field];
      const bVal = b.payload[field];

      if (aVal === undefined && bVal === undefined) return 0;
      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * multiplier;
      }

      return String(aVal).localeCompare(String(bVal)) * multiplier;
    });
  }
}
