import { OpeningTime } from "./OpeningTime.js";
import { ClosingTime } from "./ClosingTime.js";

export class TimeRange {
  private constructor(
    public readonly open: OpeningTime,
    public readonly close: ClosingTime,
  ) {}

  static create(open: OpeningTime, close: ClosingTime): TimeRange {
    if (open.value >= close.value) {
      throw new Error(
        `Open time (${open.toString()}) must be before close time (${close.toString()})`,
      );
    }
    return new TimeRange(open, close);
  }

  static reconstitute(openMinutes: number, closeMinutes: number): TimeRange {
    return new TimeRange(
      OpeningTime.reconstitute(openMinutes),
      ClosingTime.reconstitute(closeMinutes),
    );
  }

  equals(other: TimeRange): boolean {
    return this.open.equals(other.open) && this.close.equals(other.close);
  }

  overlaps(other: TimeRange): boolean {
    return this.open.value < other.close.value && other.open.value < this.close.value;
  }
}
