export class SearchError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly index?: string,
  ) {
    super(message);
    this.name = "SearchError";
  }
}

export class IndexNotFoundError extends SearchError {
  constructor(index: string) {
    super(
      `Index "${index}" not found`,
      "INDEX_NOT_FOUND",
      index,
    );
    this.name = "IndexNotFoundError";
  }
}

export class IndexAlreadyExistsError extends SearchError {
  constructor(index: string) {
    super(
      `Index "${index}" already exists`,
      "INDEX_ALREADY_EXISTS",
      index,
    );
    this.name = "IndexAlreadyExistsError";
  }
}

export class DocumentNotFoundError extends SearchError {
  constructor(index: string, documentId: string) {
    super(
      `Document "${documentId}" not found in index "${index}"`,
      "DOCUMENT_NOT_FOUND",
      index,
    );
    this.name = "DocumentNotFoundError";
  }
}

export class InvalidQueryError extends SearchError {
  constructor(reason: string) {
    super(
      `Invalid search query: ${reason}`,
      "INVALID_QUERY",
    );
    this.name = "InvalidQueryError";
  }
}

export class IndexOperationError extends SearchError {
  constructor(index: string, operation: string, reason: string) {
    super(
      `Index "${index}" operation "${operation}" failed: ${reason}`,
      "INDEX_OPERATION_FAILED",
      index,
    );
    this.name = "IndexOperationError";
  }
}

export class SearchTimeoutError extends SearchError {
  constructor(index: string, query: string, timeoutMs: number) {
    super(
      `Search on index "${index}" for "${query}" timed out after ${timeoutMs}ms`,
      "SEARCH_TIMEOUT",
      index,
    );
    this.name = "SearchTimeoutError";
  }
}
