import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', code = 'resource.not_found') {
    super(404, code, `${resource} not found`);
    this.name = 'NotFoundError';
  }
}
