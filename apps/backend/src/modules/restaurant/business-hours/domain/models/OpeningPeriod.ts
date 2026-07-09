import { OpeningTime } from "./OpeningTime.js";
import { ClosingTime } from "./ClosingTime.js";
import { TimeRange } from "./TimeRange.js";

export interface OpeningPeriodData {
  openTime: OpeningTime;
  closeTime: ClosingTime;
  order: number;
}

export class OpeningPeriod {
  public readonly timeRange: TimeRange;

  private constructor(
    public readonly openTime: OpeningTime,
    public readonly closeTime: ClosingTime,
    public readonly order: number,
  ) {
    this.timeRange = TimeRange.create(openTime, closeTime);
  }

  static create(openTime: OpeningTime, closeTime: ClosingTime, order: number): OpeningPeriod {
    if (!Number.isInteger(order) || order < 0) {
      throw new Error(`Order must be a non-negative integer, got ${order}`);
    }
    return new OpeningPeriod(openTime, closeTime, order);
  }

  static reconstitute(openMinutes: number, closeMinutes: number, order: number): OpeningPeriod {
    return new OpeningPeriod(
      OpeningTime.reconstitute(openMinutes),
      ClosingTime.reconstitute(closeMinutes),
      order,
    );
  }

  equals(other: OpeningPeriod): boolean {
    return this.openTime.equals(other.openTime)
      && this.closeTime.equals(other.closeTime)
      && this.order === other.order;
  }
}
