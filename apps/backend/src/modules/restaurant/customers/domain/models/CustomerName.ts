const MIN_LENGTH = 1;
const MAX_LENGTH = 100;

export class CustomerName {
  private constructor(
    public readonly firstName: string,
    public readonly lastName: string,
  ) {}

  static create(firstName: string, lastName: string): CustomerName {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst || trimmedFirst.length < MIN_LENGTH || trimmedFirst.length > MAX_LENGTH) {
      throw new Error(
        `First name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
      );
    }

    if (!trimmedLast || trimmedLast.length < MIN_LENGTH || trimmedLast.length > MAX_LENGTH) {
      throw new Error(
        `Last name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
      );
    }

    return new CustomerName(trimmedFirst, trimmedLast);
  }

  static reconstitute(firstName: string, lastName: string): CustomerName {
    return new CustomerName(firstName, lastName);
  }

  equals(other: CustomerName): boolean {
    return (
      this.firstName.toLowerCase() === other.firstName.toLowerCase() &&
      this.lastName.toLowerCase() === other.lastName.toLowerCase()
    );
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
