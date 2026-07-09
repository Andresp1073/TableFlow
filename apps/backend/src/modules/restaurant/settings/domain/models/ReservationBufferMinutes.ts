const MIN_BUFFER = 0;
const MAX_BUFFER = 120;

export class ReservationBufferMinutes {
  private constructor(public readonly value: number) {}

  static create(value: number): ReservationBufferMinutes {
    if (!Number.isInteger(value)) {
      throw new Error("Reservation buffer must be an integer");
    }
    if (value < MIN_BUFFER || value > MAX_BUFFER) {
      throw new Error(
        `Reservation buffer must be between ${MIN_BUFFER} and ${MAX_BUFFER} minutes`
      );
    }
    return new ReservationBufferMinutes(value);
  }

  static reconstitute(value: number): ReservationBufferMinutes {
    return new ReservationBufferMinutes(value);
  }

  equals(other: ReservationBufferMinutes): boolean {
    return this.value === other.value;
  }
}
