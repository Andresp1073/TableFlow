import { DayOfWeek } from "./DayOfWeek.js";
import { OpeningPeriod } from "./OpeningPeriod.js";

const MAX_PERIODS_PER_DAY = 10;

export class DaySchedule {
  private constructor(
    public readonly dayOfWeek: DayOfWeek,
    public readonly isClosed: boolean,
    public readonly periods: readonly OpeningPeriod[],
  ) {}

  static create(dayOfWeek: DayOfWeek, isClosed: boolean, periods: OpeningPeriod[]): DaySchedule {
    if (isClosed && periods.length > 0) {
      throw new Error(`Cannot have opening periods on a closed day (day ${dayOfWeek.value})`);
    }

    if (periods.length > MAX_PERIODS_PER_DAY) {
      throw new Error(
        `Maximum ${MAX_PERIODS_PER_DAY} periods per day, got ${periods.length} for day ${dayOfWeek.value}`,
      );
    }

    const sortedPeriods = [...periods].sort((a, b) => a.order - b.order);

    for (let i = 0; i < sortedPeriods.length; i++) {
      for (let j = i + 1; j < sortedPeriods.length; j++) {
        if (sortedPeriods[i].timeRange.overlaps(sortedPeriods[j].timeRange)) {
          throw new Error(
            `Overlapping periods detected for day ${dayOfWeek.value}: ` +
            `${sortedPeriods[i].openTime.toString()}-${sortedPeriods[i].closeTime.toString()} ` +
            `and ${sortedPeriods[j].openTime.toString()}-${sortedPeriods[j].closeTime.toString()}`,
          );
        }
      }
    }

    return new DaySchedule(dayOfWeek, isClosed, sortedPeriods);
  }

  static reconstitute(
    dayOfWeek: number,
    isClosed: boolean,
    periods: Array<{ openTime: number; closeTime: number; order: number }>,
  ): DaySchedule {
    const day = DayOfWeek.reconstitute(dayOfWeek);
    const mappedPeriods = periods.map((p) =>
      OpeningPeriod.reconstitute(p.openTime, p.closeTime, p.order),
    );
    return new DaySchedule(day, isClosed, mappedPeriods);
  }

  equals(other: DaySchedule): boolean {
    if (!this.dayOfWeek.equals(other.dayOfWeek)) return false;
    if (this.isClosed !== other.isClosed) return false;
    if (this.periods.length !== other.periods.length) return false;
    return this.periods.every((p, i) => p.equals(other.periods[i]));
  }
}
