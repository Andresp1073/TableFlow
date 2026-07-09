const MIN_DEADLINE = 0;
const MAX_DEADLINE = 43200;

export class CancellationDeadline {
  private constructor(public readonly value: number) {}

  static create(value: number): CancellationDeadline {
    if (!Number.isInteger(value) || value < MIN_DEADLINE || value > MAX_DEADLINE) {
      throw new Error(`Cancellation deadline must be an integer between ${MIN_DEADLINE} and ${MAX_DEADLINE} minutes`);
    }
    return new CancellationDeadline(value);
  }

  static reconstitute(value: number): CancellationDeadline {
    return new CancellationDeadline(value);
  }

  equals(other: CancellationDeadline): boolean {
    return this.value === other.value;
  }
}
