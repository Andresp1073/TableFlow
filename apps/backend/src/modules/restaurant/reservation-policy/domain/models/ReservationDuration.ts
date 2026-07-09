const MIN_DURATION = 15;
const MAX_DURATION = 480;

export class ReservationDuration {
  private constructor(public readonly value: number) {}

  static create(value: number): ReservationDuration {
    if (!Number.isInteger(value) || value < MIN_DURATION || value > MAX_DURATION) {
      throw new Error(`Reservation duration must be an integer between ${MIN_DURATION} and ${MAX_DURATION} minutes`);
    }
    return new ReservationDuration(value);
  }

  static reconstitute(value: number): ReservationDuration {
    return new ReservationDuration(value);
  }

  equals(other: ReservationDuration): boolean {
    return this.value === other.value;
  }
}
