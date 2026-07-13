const MIN_LENGTH = 1;
const MAX_LENGTH = 20;
const RESERVATION_NUMBER_REGEX = /^[A-Z0-9_-]+$/;

export class ReservationNumber {
  private constructor(public readonly value: string) {}

  static create(value: string): ReservationNumber {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed || trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      throw new Error(
        `Reservation number must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
      );
    }
    if (!RESERVATION_NUMBER_REGEX.test(trimmed)) {
      throw new Error(
        `Reservation number must contain only uppercase letters, numbers, hyphens, and underscores`,
      );
    }
    return new ReservationNumber(trimmed);
  }

  static reconstitute(value: string): ReservationNumber {
    return new ReservationNumber(value);
  }

  equals(other: ReservationNumber): boolean {
    return this.value === other.value;
  }
}
