import type {
  SearchQuery,
  SearchFilter,
  SearchSort,
  SearchPagination,
  SearchBoost,
  SearchHighlight,
  SearchAutocompleteOptions,
  FacetedSearchRequest,
  SearchFacetRequest,
} from "./types.js";
import { InvalidQueryError } from "./errors.js";

export interface QueryValidationResult {
  valid: boolean;
  errors: string[];
}

export class SearchQueryBuilder {
  private query: string = "";
  private fields?: string[];
  private filters: SearchFilter[] = [];
  private sort?: SearchSort;
  private pagination?: SearchPagination;
  private boosts: SearchBoost[] = [];
  private highlight?: SearchHighlight;
  private type?: string;
  private minimumShouldMatch?: string;
  private analyzers?: string[];

  static create(): SearchQueryBuilder {
    return new SearchQueryBuilder();
  }

  withQuery(query: string): SearchQueryBuilder {
    this.query = query;
    return this;
  }

  withFields(fields: string[]): SearchQueryBuilder {
    this.fields = fields;
    return this;
  }

  addFilter(filter: SearchFilter): SearchQueryBuilder {
    this.filters.push(filter);
    return this;
  }

  addFilters(filters: SearchFilter[]): SearchQueryBuilder {
    this.filters.push(...filters);
    return this;
  }

  withSort(field: string, order: "asc" | "desc" = "asc"): SearchQueryBuilder {
    this.sort = { field, order };
    return this;
  }

  withPagination(offset: number, limit: number): SearchQueryBuilder {
    this.pagination = { offset, limit };
    return this;
  }

  withPage(page: number, pageSize: number): SearchQueryBuilder {
    this.pagination = { offset: (page - 1) * pageSize, limit: pageSize };
    return this;
  }

  addBoost(field: string, value: number): SearchQueryBuilder {
    this.boosts.push({ field, value });
    return this;
  }

  withHighlight(fields: string[], preTag?: string, postTag?: string): SearchQueryBuilder {
    this.highlight = { fields, preTag, postTag };
    return this;
  }

  withType(type: string): SearchQueryBuilder {
    this.type = type;
    return this;
  }

  withMinimumShouldMatch(minimumShouldMatch: string): SearchQueryBuilder {
    this.minimumShouldMatch = minimumShouldMatch;
    return this;
  }

  withAnalyzers(analyzers: string[]): SearchQueryBuilder {
    this.analyzers = analyzers;
    return this;
  }

  validate(): QueryValidationResult {
    const errors: string[] = [];

    if (!this.query || this.query.trim().length === 0) {
      errors.push("Query string is required");
    }

    if (this.pagination) {
      if (this.pagination.offset < 0) {
        errors.push("Offset must be >= 0");
      }
      if (this.pagination.limit < 1) {
        errors.push("Limit must be >= 1");
      }
    }

    for (const filter of this.filters) {
      if (!filter.field) {
        errors.push("Filter field is required");
      }
      if (filter.value === undefined || filter.value === null) {
        errors.push(`Filter value is required for field "${filter.field}"`);
      }
    }

    if (this.boosts.length > 0) {
      for (const boost of this.boosts) {
        if (boost.value <= 0) {
          errors.push(`Boost value must be > 0 for field "${boost.field}"`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  build(): SearchQuery {
    return {
      query: this.query,
      fields: this.fields,
      filters: this.filters.length > 0 ? this.filters : undefined,
      sort: this.sort,
      pagination: this.pagination,
      boost: this.boosts.length > 0 ? this.boosts : undefined,
      highlight: this.highlight,
      type: this.type,
      minimumShouldMatch: this.minimumShouldMatch,
      analyzers: this.analyzers,
    };
  }

  buildOrThrow(): SearchQuery {
    const validation = this.validate();
    if (!validation.valid) {
      throw new InvalidQueryError(validation.errors.join("; "));
    }
    return this.build();
  }

  clone(): SearchQueryBuilder {
    const builder = new SearchQueryBuilder();
    builder.query = this.query;
    builder.fields = this.fields ? [...this.fields] : undefined;
    builder.filters = [...this.filters];
    builder.sort = this.sort ? { ...this.sort } : undefined;
    builder.pagination = this.pagination ? { ...this.pagination } : undefined;
    builder.boosts = [...this.boosts];
    builder.highlight = this.highlight ? { ...this.highlight } : undefined;
    builder.type = this.type;
    builder.minimumShouldMatch = this.minimumShouldMatch;
    builder.analyzers = this.analyzers ? [...this.analyzers] : undefined;
    return builder;
  }

  static fromQuery(query: SearchQuery): SearchQueryBuilder {
    const builder = new SearchQueryBuilder();
    builder.query = query.query;
    builder.fields = query.fields ? [...query.fields] : undefined;
    builder.filters = query.filters ? [...query.filters] : [];
    builder.sort = query.sort ? { ...query.sort } : undefined;
    builder.pagination = query.pagination ? { ...query.pagination } : undefined;
    builder.boosts = query.boost ? [...query.boost] : [];
    builder.highlight = query.highlight ? { ...query.highlight } : undefined;
    builder.type = query.type;
    builder.minimumShouldMatch = query.minimumShouldMatch;
    builder.analyzers = query.analyzers ? [...query.analyzers] : undefined;
    return builder;
  }

  buildAutocompleteOptions(options?: SearchAutocompleteOptions): SearchAutocompleteOptions | undefined {
    if (!options) {
      return undefined;
    }
    return {
      size: options.size,
      type: options.type,
      filters: options.filters ? [...options.filters] : undefined,
    };
  }

  buildFacetedRequest(
    facetFields: string[],
    options?: { size?: number; order?: "count" | "value" },
  ): FacetedSearchRequest {
    const facets: SearchFacetRequest[] = facetFields.map((field) => ({
      field,
      size: options?.size,
      order: options?.order,
    }));

    return {
      query: this.build(),
      facets,
    };
  }
}
