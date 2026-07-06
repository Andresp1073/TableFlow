import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: Record<string, string[]>) {
    super(400, 'validation.failed', message, details);
    this.name = 'ValidationError';
  }
}
