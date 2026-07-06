import { AppError } from './AppError.js';

export class BusinessError extends AppError {
  constructor(message: string, code = 'business.rule_violation') {
    super(422, code, message);
    this.name = 'BusinessError';
  }
}
