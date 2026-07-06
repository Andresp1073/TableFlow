import type { PaginationParams, PaginationMeta } from '../types/index.js';

export function parsePaginationParams(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const sort = typeof query.sort === 'string' ? query.sort : 'createdAt';
  const order = query.order === 'asc' ? 'asc' : 'desc';

  return { page, limit, sort, order };
}

export function buildPaginationMeta(total: number, params: PaginationParams): PaginationMeta {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    total,
    totalPages: Math.ceil(total / (params.limit ?? 10)),
  };
}
