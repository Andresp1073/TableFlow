const MIN_DURATION = 15;
const MAX_DURATION = 480;

export class ReservationDuration {
  private constructor(public readonly value: number) {}

  static create(value: number): ReservationDuration {
    if (!Number.isInteger(value)) {
      throw new Error("Reservation duration must be an integer");
    }
    if (value < MIN_DURATION || value > MAX_DURATION) {
      throw new Error(
        `Reservation duration must be between ${MIN_DURATION} and ${MAX_DURATION} minutes`
      );
    }
    return new ReservationDuration(value);
  }

  static reconstitute(value: number): ReservationDuration {
    return new ReservationDuration(value);
  }

  equals(other: ReservationDuration): boolean {
    return this.value === other.value;
  }

  static min(): number {
    return MIN_DURATION;
  }

  static max(): number {
    return MAX_DURATION;
  }
}
