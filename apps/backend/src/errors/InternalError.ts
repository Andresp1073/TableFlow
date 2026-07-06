import { AppError } from './AppError.js';

export class InternalError extends AppError {
  constructor(message = 'An unexpected error occurred') {
    super(500, 'internal.error', message);
    this.name = 'InternalError';
  }
}
