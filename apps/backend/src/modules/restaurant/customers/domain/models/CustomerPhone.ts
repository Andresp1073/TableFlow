const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

export class CustomerPhone {
  private constructor(public readonly value: string) {}

  static create(value: string): CustomerPhone {
    const trimmed = value.trim().replace(/[\s\-().]/g, "");
    if (!trimmed) {
      throw new Error("Phone number must not be empty");
    }
    if (!PHONE_REGEX.test(trimmed)) {
      throw new Error(
        `Invalid phone number format: "${value}". Must be 7-15 digits, optionally starting with +`,
      );
    }
    return new CustomerPhone(trimmed);
  }

  static reconstitute(value: string): CustomerPhone {
    return new CustomerPhone(value);
  }

  equals(other: CustomerPhone): boolean {
    return this.value === other.value;
  }
}
