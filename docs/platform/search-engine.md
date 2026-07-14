# Enterprise Search Engine Foundation

## Architecture

The Enterprise Search Engine Foundation provides a provider-agnostic search abstraction for business modules. It follows Clean Architecture and Dependency Inversion — business modules depend only on the `SearchProvider` interface.

```
┌──────────────────────────────────────────────────────────────┐
│                  Business Module (consumer)                   │
│              depends on: SearchProvider                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                      SearchManager                             │
│  ┌──────────────┬──────────────┬────────────┬──────────────┐ │
│  │SearchQuery   │ SearchIndex  │ Search     │ Search       │ │
│  │ Builder      │ Manager     │ Indexer    │ Document     │ │
│  └──────────────┴──────────────┴────────────┴──────────────┘ │
│  ┌──────────────┬──────────────┐                              │
│  │ SearchResult │ Events       │                              │
│  └──────────────┴──────────────┘                              │
└──────────────────────────────────────────────────────────────┘
```

## Components

| Component | Responsibility |
|---|---|
| **SearchManager** | Orchestrator implementing `SearchProvider`. Index/create/update/delete documents, search, autocomplete, faceted search, index lifecycle management. |
| **SearchQueryBuilder** | Builder pattern for constructing search queries with full-text, filters, sorting, pagination, boosting, highlighting, type filtering. Validates queries before building. |
| **SearchIndex** | Index lifecycle management: create, delete, rebuild (version increment), refresh, mapping management, index prefixing. |
| **SearchIndexer** | In-memory document store per index. Index, update, delete, bulk index, list, count documents. |
| **SearchDocument** | Document model with id, type, payload, metadata, version, score. Factory functions for building and cloning. |
| **SearchResult** | Result model with documents, total count, pagination info, facets, highlights, max score, tookMs. |

## Search Operations

| Operation | Description |
|---|---|
| **search** | Full-text search with filtering, sorting, pagination, boosting |
| **autocomplete** | Prefix-based suggestion retrieval |
| **facetedSearch** | Search with field-based facet aggregation |
| **indexDocument** | Index a single document |
| **updateDocument** | Partial update with version increment |
| **deleteDocument** | Remove document from index |
| **bulkIndex** | Index multiple documents atomically |

## Index Management

| Operation | Description |
|---|---|
| **createIndex** | Create a new index with settings and field mappings |
| **deleteIndex** | Delete an index and all its documents |
| **rebuildIndex** | Increment index version (prepared for future reindex) |
| **refreshIndex** | Refresh index (prepared for future commit) |
| **getIndex** | Retrieve index configuration |
| **listIndexes** | List all indexes |
| **indexExists** | Check if index exists |

## Index Lifecycle

```
  ┌──────────┐
  │  Create  │  → Define settings + field mappings
  └────┬─────┘
       │
  ┌────▼──────┐
  │  Index    │  → Add documents (indexDocument / bulkIndex)
  │  Documents│
  └────┬──────┘
       │
  ┌────▼────┐      ┌──────────┐
  │  Search │──────►│ Rebuild  │  → Increment version (prepared for reindex)
  └────┬────┘      └──────────┘
       │
  ┌────▼────┐
  │  Delete │  → Remove index + all documents
  └─────────┘
```

## Query Features

| Feature | Description | Status |
|---|---|---|
| **Full-text search** | Search across multiple fields with term matching | ✓ |
| **Exact match** | Filter by exact field value (`eq`, `neq`) | ✓ |
| **Filtering** | 14 operators: eq, neq, gt, gte, lt, lte, in, not_in, exists, not_exists, between, prefix, wildcard, regexp | ✓ |
| **Sorting** | Ascending/descending by field | ✓ |
| **Pagination** | Offset/limit and page-based pagination | ✓ |
| **Boosting** | Field-level score boosting on matching | ✓ |
| **Highlighting** | Prepared for future provider integration | Prepared |
| **Faceted search** | Field-based facet aggregation with count/order sorting | ✓ |
| **Autocomplete** | Prefix-based string suggestions | ✓ |
| **Type filtering** | Filter by document type | ✓ |

## Search Query Operators

| Operator | Description | Example |
|---|---|---|
| `eq` | Equal to | `{ field: "status", operator: "eq", value: "active" }` |
| `neq` | Not equal to | `{ field: "role", operator: "neq", value: "admin" }` |
| `gt` | Greater than | `{ field: "price", operator: "gt", value: 100 }` |
| `gte` | Greater than or equal | `{ field: "age", operator: "gte", value: 18 }` |
| `lt` | Less than | `{ field: "score", operator: "lt", value: 50 }` |
| `lte` | Less than or equal | `{ field: "rating", operator: "lte", value: 5 }` |
| `in` | In array | `{ field: "role", operator: "in", value: ["admin", "moderator"] }` |
| `not_in` | Not in array | `{ field: "status", operator: "not_in", value: ["deleted"] }` |
| `exists` | Field exists | `{ field: "email", operator: "exists", value: true }` |
| `not_exists` | Field does not exist | `{ field: "deleted_at", operator: "not_exists", value: true }` |
| `between` | Numeric range | `{ field: "price", operator: "between", value: [10, 100] }` |
| `prefix` | String starts with | `{ field: "name", operator: "prefix", value: "al" }` |
| `wildcard` | Wildcard pattern | `{ field: "code", operator: "wildcard", value: "A*" }` |
| `regexp` | Regular expression | `{ field: "email", operator: "regexp", value: "@example\\.com$" }` |

## Events

| Event | Description |
|---|---|
| `search.document_indexed` | A document was indexed |
| `search.document_updated` | A document was updated |
| `search.document_removed` | A document was removed |
| `search.index_rebuilt` | An index was rebuilt (version incremented) |
| `search.executed` | A search query was executed |
| `search.index_created` | A new index was created |
| `search.index_deleted` | An index was deleted |
| `search.index_refreshed` | An index was refreshed |

## Example Usage

```typescript
import {
  SearchManager, SearchIndex, SearchIndexer, SearchQueryBuilder,
  buildSearchDocument, DEFAULT_SEARCH_CONFIG,
} from "./search/index.js";

const config = { ...DEFAULT_SEARCH_CONFIG, indexPrefix: "myapp_" };
const indexManager = new SearchIndex(config);
const indexer = new SearchIndexer(indexManager);
const searchManager = new SearchManager(indexManager, indexer, config);

// Create an index with field mappings
await searchManager.createIndex({
  name: "restaurants",
  settings: { numberOfShards: 1 },
  mapping: [
    { name: "name", type: "text", searchable: true, boost: 2 },
    { name: "description", type: "text", searchable: true },
    { name: "cuisine", type: "keyword", filterable: true },
    { name: "rating", type: "float", filterable: true, sortable: true },
    { name: "priceRange", type: "keyword", filterable: true },
  ],
  version: 1,
});

// Index documents
await searchManager.indexDocument(
  "restaurants",
  buildSearchDocument("restaurant", {
    name: "Italian Place",
    description: "Authentic Italian cuisine",
    cuisine: "italian",
    rating: 4.5,
    priceRange: "$$$",
  }),
);

// Search with filters and sorting
const results = await searchManager.search("restaurants",
  SearchQueryBuilder.create()
    .withQuery("italian")
    .addFilter({ field: "rating", operator: "gte", value: 4.0 })
    .withSort("rating", "desc")
    .withPagination(0, 10)
    .build(),
);

// Faceted search
const facetResults = await searchManager.facetedSearch("restaurants",
  SearchQueryBuilder.create()
    .withQuery("")
    .buildFacetedRequest(["cuisine", "priceRange"], { size: 5, order: "count" }),
);

// Autocomplete
const suggestions = await searchManager.autocomplete("restaurants", "ita");
```

## Future Providers

| Provider | Status |
|---|---|
| Elasticsearch | Prepared |
| OpenSearch | Prepared |
| Meilisearch | Prepared |
| Database Search (SQL FTS) | Prepared |
| Azure Cognitive Search | Prepared |
| Algolia | Prepared |

Each provider implements the `SearchProvider` interface and can be swapped without changing business module code.

## Error Handling

| Error | Code | Description |
|---|---|---|
| `IndexNotFoundError` | INDEX_NOT_FOUND | Index does not exist |
| `IndexAlreadyExistsError` | INDEX_ALREADY_EXISTS | Index with same name exists |
| `DocumentNotFoundError` | DOCUMENT_NOT_FOUND | Document not found in index |
| `InvalidQueryError` | INVALID_QUERY | Search query validation failed |
| `IndexOperationError` | INDEX_OPERATION_FAILED | Index operation failed |
| `SearchTimeoutError` | SEARCH_TIMEOUT | Search query timed out |
