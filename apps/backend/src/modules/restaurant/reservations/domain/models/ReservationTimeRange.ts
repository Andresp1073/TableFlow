export class ReservationTimeRange {
  private constructor(
    public readonly startTime: Date,
    public readonly endTime: Date,
  ) {}

  static create(startTime: Date, endTime: Date): ReservationTimeRange {
    if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
      throw new Error("Start time must be a valid Date");
    }
    if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
      throw new Error("End time must be a valid Date");
    }
    if (endTime.getTime() <= startTime.getTime()) {
      throw new Error("End time must be after start time");
    }
    return new ReservationTimeRange(startTime, endTime);
  }

  static reconstitute(startTime: Date, endTime: Date): ReservationTimeRange {
    return new ReservationTimeRange(startTime, endTime);
  }

  equals(other: ReservationTimeRange): boolean {
    return (
      this.startTime.getTime() === other.startTime.getTime() &&
      this.endTime.getTime() === other.endTime.getTime()
    );
  }

  overlapsWith(other: ReservationTimeRange): boolean {
    return this.startTime.getTime() < other.endTime.getTime() &&
      this.endTime.getTime() > other.startTime.getTime();
  }

  durationInMinutes(): number {
    return (this.endTime.getTime() - this.startTime.getTime()) / 60000;
  }
}
