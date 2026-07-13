const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTH = 254;

export class CustomerEmail {
  private constructor(public readonly value: string) {}

  static create(value: string): CustomerEmail {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      throw new Error("Email must not be empty");
    }
    if (trimmed.length > MAX_LENGTH) {
      throw new Error(`Email must not exceed ${MAX_LENGTH} characters`);
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      throw new Error(`Invalid email format: "${value}"`);
    }
    return new CustomerEmail(trimmed);
  }

  static reconstitute(value: string): CustomerEmail {
    return new CustomerEmail(value);
  }

  equals(other: CustomerEmail): boolean {
    return this.value === other.value;
  }
}
