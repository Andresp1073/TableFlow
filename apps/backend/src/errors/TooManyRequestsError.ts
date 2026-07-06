import { AppError } from './AppError.js';

export class TooManyRequestsError extends AppError {
  constructor(retryAfterSeconds: number) {
    super(
      429,
      'rate_limit.exceeded',
      `Too many requests. Retry after ${retryAfterSeconds} seconds.`,
    );
    this.name = 'TooManyRequestsError';
  }
}
