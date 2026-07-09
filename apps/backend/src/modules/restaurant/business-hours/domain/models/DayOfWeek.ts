const MIN_DAY = 1;
const MAX_DAY = 7;

export class DayOfWeek {
  private constructor(public readonly value: number) {}

  static create(value: number): DayOfWeek {
    if (!Number.isInteger(value) || value < MIN_DAY || value > MAX_DAY) {
      throw new Error(`DayOfWeek must be an integer between ${MIN_DAY} and ${MAX_DAY}, got ${value}`);
    }
    return new DayOfWeek(value);
  }

  static reconstitute(value: number): DayOfWeek {
    return new DayOfWeek(value);
  }

  equals(other: DayOfWeek): boolean {
    return this.value === other.value;
  }

  static readonly MONDAY = 1;
  static readonly TUESDAY = 2;
  static readonly WEDNESDAY = 3;
  static readonly THURSDAY = 4;
  static readonly FRIDAY = 5;
  static readonly SATURDAY = 6;
  static readonly SUNDAY = 7;
}
