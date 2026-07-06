import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger.js';
import { AppError } from '../errors/AppError.js';
import type { ApiResponse } from '../types/index.js';

function buildZodDetails(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }

  return details;
}

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002': {
      const target = (error.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      return new AppError(409, 'resource.duplicate', `A record with this ${target} already exists`);
    }
    case 'P2025':
      return new AppError(404, 'resource.not_found', 'Record not found');
    case 'P2003':
      return new AppError(400, 'validation.failed', 'Referenced record does not exist');
    case 'P2014':
      return new AppError(400, 'validation.failed', 'Constraint violation');
    default:
      logger.error({ prismaCode: error.code, meta: error.meta }, 'Unhandled Prisma error');
      return new AppError(500, 'internal.error', 'A database error occurred');
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toResponse());
    return;
  }

  if (err instanceof ZodError) {
    const details = buildZodDetails(err);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'validation.failed',
        message: 'Validation failed',
        details,
      },
    };

    res.status(400).json(response);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(err);
    res.status(appError.statusCode).json(appError.toResponse());
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'validation.failed',
        message: 'Invalid data format',
      },
    };

    res.status(400).json(response);
    return;
  }

  const correlationId = req.requestId ?? 'unknown';

  logger.error(
    { err, requestId: correlationId, method: req.method, url: req.originalUrl },
    'Unhandled error',
  );

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: {
      code: 'internal.error',
      message: 'An unexpected error occurred',
    },
  };

  res.status(500).json(response);
}
