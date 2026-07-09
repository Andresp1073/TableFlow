const MIN_MINUTES = 0;
const MAX_MINUTES = 43200;
const MIN_DAYS = 0;
const MAX_DAYS = 365;

export class AdvanceBookingWindow {
  private constructor(
    public readonly minMinutes: number,
    public readonly maxDays: number,
  ) {}

  static create(minMinutes: number, maxDays: number): AdvanceBookingWindow {
    if (!Number.isInteger(minMinutes) || minMinutes < MIN_MINUTES || minMinutes > MAX_MINUTES) {
      throw new Error(`Minimum advance booking minutes must be an integer between ${MIN_MINUTES} and ${MAX_MINUTES}`);
    }
    if (!Number.isInteger(maxDays) || maxDays < MIN_DAYS || maxDays > MAX_DAYS) {
      throw new Error(`Maximum advance booking days must be an integer between ${MIN_DAYS} and ${MAX_DAYS}`);
    }
    return new AdvanceBookingWindow(minMinutes, maxDays);
  }

  static reconstitute(minMinutes: number, maxDays: number): AdvanceBookingWindow {
    return new AdvanceBookingWindow(minMinutes, maxDays);
  }

  equals(other: AdvanceBookingWindow): boolean {
    return this.minMinutes === other.minMinutes && this.maxDays === other.maxDays;
  }
}
