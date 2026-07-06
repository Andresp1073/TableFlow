import { AppError } from './AppError.js';

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions', code = 'auth.forbidden') {
    super(403, code, message);
    this.name = 'ForbiddenError';
  }
}
