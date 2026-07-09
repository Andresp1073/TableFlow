const MIN_GRACE = 0;
const MAX_GRACE = 120;

export class GracePeriod {
  private constructor(public readonly value: number) {}

  static create(value: number): GracePeriod {
    if (!Number.isInteger(value) || value < MIN_GRACE || value > MAX_GRACE) {
      throw new Error(`Grace period must be an integer between ${MIN_GRACE} and ${MAX_GRACE} minutes`);
    }
    return new GracePeriod(value);
  }

  static reconstitute(value: number): GracePeriod {
    return new GracePeriod(value);
  }

  equals(other: GracePeriod): boolean {
    return this.value === other.value;
  }
}
