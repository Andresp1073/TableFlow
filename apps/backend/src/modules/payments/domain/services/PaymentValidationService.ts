export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PaymentValidationService {
  validateAmount(amount: number, currency: string): PaymentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Number.isFinite(amount)) {
      errors.push("Amount must be a finite number");
    }

    if (amount <= 0) {
      errors.push("Amount must be positive");
    }

    if (amount > 9999999999) {
      errors.push("Amount exceeds maximum allowed");
    }

    if (!currency || currency.trim().length === 0) {
      errors.push("Currency is required");
    }

    if (currency && currency.length !== 3) {
      errors.push("Currency must be a 3-letter ISO code");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateReference(reference: string): PaymentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!reference || reference.trim().length === 0) {
      errors.push("Reference cannot be empty");
    }

    if (reference && reference.length > 128) {
      errors.push("Reference must not exceed 128 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateCurrency(currency: string): boolean {
    if (!currency || currency.length !== 3) {
      return false;
    }
    return /^[A-Z]{3}$/.test(currency);
  }

  isZeroAmount(amount: number): boolean {
    return amount === 0 || !Number.isFinite(amount);
  }
}
