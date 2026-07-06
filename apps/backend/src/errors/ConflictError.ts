import { AppError } from './AppError.js';

export class ConflictError extends AppError {
  constructor(message: string, code = 'resource.duplicate') {
    super(409, code, message);
    this.name = 'ConflictError';
  }
}
