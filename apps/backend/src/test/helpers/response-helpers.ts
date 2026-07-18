import { expect } from 'vitest';
import type { Response } from 'supertest';

export function expectSuccessResponse(res: Response): void {
  expect(res.body.success).toBe(true);
  expect(res.body.data).toBeDefined();
  expect(typeof res.body.timestamp).toBe('string');
  expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
}

export function expectPaginatedResponse(res: Response): void {
  expectSuccessResponse(res);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.meta).toBeDefined();
  expect(res.body.meta).toMatchObject({
    page: expect.any(Number),
    limit: expect.any(Number),
    total: expect.any(Number),
    totalPages: expect.any(Number),
  });
}

export function expectErrorResponse(res: Response, statusCode: number): void {
  expect(res.body.success).toBe(false);
  expect(res.body.data).toBeNull();
  expect(res.body.error).toBeDefined();
  expect(typeof res.body.error.code).toBe('string');
  expect(typeof res.body.error.message).toBe('string');
  expect(typeof res.body.error.timestamp).toBe('string');
  expect(res.body.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(typeof res.body.error.path).toBe('string');
  expect(typeof res.body.error.correlationId).toBe('string');
  expect(typeof res.body.timestamp).toBe('string');
  expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
}

export function expectValidationError(res: Response): void {
  expectErrorResponse(res, 400);
  expect(res.body.error.code).toBe('validation.failed');
  expect(res.body.error.details).toBeDefined();
}

export function expectUnauthorizedError(res: Response): void {
  expectErrorResponse(res, 401);
  expect(res.body.error.code).toMatch(/^auth\./);
}

export function expectForbiddenError(res: Response): void {
  expectErrorResponse(res, 403);
  expect(res.body.error.code).toMatch(/^auth\./);
}

export function expectNotFoundError(res: Response): void {
  expectErrorResponse(res, 404);
  expect(res.body.error.code).toBe('resource.not_found');
}

export function expectConflictError(res: Response): void {
  expectErrorResponse(res, 409);
  expect(res.body.error.code).toBe('resource.duplicate');
}
