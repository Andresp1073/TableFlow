export class Priority {
  private constructor(public readonly value: number) {}

  static create(value: number): Priority {
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      throw new Error(`Priority must be an integer between 0 and 100, got ${value}`);
    }
    return new Priority(value);
  }

  static reconstitute(value: number): Priority {
    return new Priority(value);
  }

  equals(other: Priority): boolean {
    return this.value === other.value;
  }

  isHigherThan(other: Priority): boolean {
    return this.value > other.value;
  }

  isLowerThan(other: Priority): boolean {
    return this.value < other.value;
  }

  static readonly MIN = 0;
  static readonly DEFAULT = 50;
  static readonly MAX = 100;
}
