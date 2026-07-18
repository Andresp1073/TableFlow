import type { Response } from 'express';
import type { ApiResponse, PaginationMeta } from '../types/index.js';

function timestamp(): string {
  return new Date().toISOString();
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: PaginationMeta,
  message?: string,
  statusCode = 200,
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: timestamp(),
    ...(meta && { meta }),
    ...(message && { message }),
  };

  res.status(statusCode).json(response);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string,
): void {
  sendSuccess(res, data, undefined, message ?? 'Created successfully', 201);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message?: string,
): void {
  sendSuccess(res, data, meta, message);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
