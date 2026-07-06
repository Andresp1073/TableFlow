import { AppError } from './AppError.js';

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'auth.token.missing') {
    super(401, code, message);
    this.name = 'UnauthorizedError';
  }
}
