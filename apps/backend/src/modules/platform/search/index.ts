export type {
  SearchProviderType,
  FieldType,
  FilterOperator,
  SortOrder,
  SearchDocument,
  SearchIndexSettings,
  SearchFieldMapping,
  SearchIndexConfig,
  SearchFilter,
  SearchSort,
  SearchPagination,
  SearchBoost,
  SearchHighlight,
  SearchAutocompleteOptions,
  SearchQuery,
  SearchFacet,
  SearchResult,
  FacetedSearchRequest,
  SearchFacetRequest,
  IndexOperationResult,
  BulkIndexResult,
  SearchProvider as SearchProviderInterface,
  SearchEventType,
  SearchProviderConfig,
} from "./types.js";

export { SearchManager } from "./SearchManager.js";
export { SearchQueryBuilder } from "./SearchQueryBuilder.js";
export { SearchIndex } from "./SearchIndex.js";
export { SearchIndexer } from "./SearchIndexer.js";
export { buildSearchDocument, generateDocumentId, cloneSearchDocument } from "./SearchDocument.js";
export { buildSearchResult, buildEmptySearchResult } from "./SearchResult.js";
export { createSearchEvent, createDocumentSearchEvent, publishSearchEvent, publishDocumentSearchEvent } from "./events.js";
export {
  SearchError,
  IndexNotFoundError,
  IndexAlreadyExistsError,
  DocumentNotFoundError,
  InvalidQueryError,
  IndexOperationError,
  SearchTimeoutError,
} from "./errors.js";

export { DEFAULT_SEARCH_CONFIG } from "./types.js";
