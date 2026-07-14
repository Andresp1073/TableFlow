import type { SearchResult as SearchResultInterface, SearchDocument, SearchFacet } from "./types.js";

export function buildSearchResult(
  query: string,
  documents: SearchDocument[],
  total: number,
  offset: number,
  limit: number,
  options?: {
    tookMs?: number;
    maxScore?: number;
    facets?: Record<string, SearchFacet[]>;
    highlights?: Record<string, string[]>;
  },
): SearchResultInterface {
  return {
    documents,
    total,
    offset,
    limit,
    query,
    tookMs: options?.tookMs ?? 0,
    maxScore: options?.maxScore,
    facets: options?.facets,
    highlights: options?.highlights,
  };
}

export function buildEmptySearchResult(query: string, options?: { offset?: number; limit?: number }): SearchResultInterface {
  return {
    documents: [],
    total: 0,
    offset: options?.offset ?? 0,
    limit: options?.limit ?? 20,
    query,
    tookMs: 0,
  };
}
