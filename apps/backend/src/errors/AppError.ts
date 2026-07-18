import type { ApiResponse } from '../types/index.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, string[]>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public toResponse(): ApiResponse<null> {
    return {
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}
