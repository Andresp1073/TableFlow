import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";

export type SearchProviderType = "elasticsearch" | "opensearch" | "meilisearch" | "database" | "azure" | "algolia";

export type FieldType = "text" | "keyword" | "integer" | "float" | "boolean" | "date" | "nested" | "object";

export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "not_in" | "exists" | "not_exists" | "between" | "prefix" | "wildcard" | "regexp";

export type SortOrder = "asc" | "desc";

export interface SearchDocument {
  readonly id: string;
  readonly type: string;
  score?: number;
  payload: Record<string, unknown>;
  metadata: Record<string, string>;
  readonly indexedAt: Date;
  version: number;
}

export interface SearchIndexSettings {
  readonly numberOfShards?: number;
  readonly numberOfReplicas?: number;
  readonly analysis?: Record<string, unknown>;
}

export interface SearchFieldMapping {
  readonly name: string;
  readonly type: FieldType;
  readonly searchable?: boolean;
  readonly filterable?: boolean;
  readonly sortable?: boolean;
  readonly boost?: number;
  readonly analyzer?: string;
}

export interface SearchIndexConfig {
  readonly name: string;
  readonly settings: SearchIndexSettings;
  readonly mapping: SearchFieldMapping[];
  readonly version: number;
}

export interface SearchFilter {
  readonly field: string;
  readonly operator: FilterOperator;
  readonly value: unknown;
}

export interface SearchSort {
  readonly field: string;
  readonly order: SortOrder;
}

export interface SearchPagination {
  readonly offset: number;
  readonly limit: number;
}

export interface SearchBoost {
  readonly field: string;
  readonly value: number;
}

export interface SearchHighlight {
  readonly fields: string[];
  readonly preTag?: string;
  readonly postTag?: string;
}

export interface SearchAutocompleteOptions {
  readonly size?: number;
  readonly type?: string;
  readonly filters?: SearchFilter[];
}

export interface SearchQuery {
  query: string;
  fields?: string[];
  filters?: SearchFilter[];
  sort?: SearchSort;
  pagination?: SearchPagination;
  boost?: SearchBoost[];
  highlight?: SearchHighlight;
  type?: string;
  minimumShouldMatch?: string;
  analyzers?: string[];
}

export interface SearchFacet {
  readonly value: string;
  readonly count: number;
}

export interface SearchResult {
  readonly documents: SearchDocument[];
  readonly total: number;
  readonly offset: number;
  readonly limit: number;
  readonly query: string;
  readonly tookMs: number;
  readonly maxScore?: number;
  readonly facets?: Record<string, SearchFacet[]>;
  readonly highlights?: Record<string, string[]>;
}

export interface FacetedSearchRequest {
  readonly query: SearchQuery;
  readonly facets: SearchFacetRequest[];
}

export interface SearchFacetRequest {
  readonly field: string;
  readonly size?: number;
  readonly order?: "count" | "value";
}

export interface IndexOperationResult {
  readonly index: string;
  readonly documentId: string;
  readonly success: boolean;
  readonly version: number;
  readonly error?: string;
}

export interface BulkIndexResult {
  readonly successCount: number;
  readonly failureCount: number;
  readonly errors: IndexOperationResult[];
  readonly tookMs: number;
}

export interface SearchProvider {
  search(index: string, query: SearchQuery): Promise<SearchResult>;
  autocomplete(index: string, prefix: string, options?: SearchAutocompleteOptions): Promise<string[]>;
  facetedSearch(index: string, request: FacetedSearchRequest): Promise<SearchResult>;
  indexDocument(index: string, document: SearchDocument): Promise<IndexOperationResult>;
  updateDocument(index: string, document: Partial<SearchDocument> & { id: string }): Promise<IndexOperationResult>;
  deleteDocument(index: string, documentId: string): Promise<IndexOperationResult>;
  bulkIndex(index: string, documents: SearchDocument[]): Promise<BulkIndexResult>;
  createIndex(config: SearchIndexConfig): Promise<boolean>;
  deleteIndex(index: string): Promise<boolean>;
  rebuildIndex(index: string): Promise<boolean>;
  refreshIndex(index: string): Promise<boolean>;
  getIndex(index: string): Promise<SearchIndexConfig | null>;
  listIndexes(): Promise<string[]>;
  indexExists(index: string): Promise<boolean>;
}

export type SearchEventType =
  | "search.document_indexed"
  | "search.document_updated"
  | "search.document_removed"
  | "search.index_rebuilt"
  | "search.executed"
  | "search.index_created"
  | "search.index_deleted"
  | "search.index_refreshed";

export interface SearchProviderConfig {
  type: SearchProviderType;
  indexPrefix?: string;
  defaultLimit: number;
  maxLimit: number;
}

export const DEFAULT_SEARCH_CONFIG: SearchProviderConfig = {
  type: "database",
  indexPrefix: "tf_",
  defaultLimit: 20,
  maxLimit: 100,
};
