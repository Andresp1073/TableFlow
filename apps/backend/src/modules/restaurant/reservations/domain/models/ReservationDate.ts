export class ReservationDate {
  private constructor(public readonly value: Date) {}

  static create(value: Date): ReservationDate {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      throw new Error("Reservation date must be a valid Date");
    }
    return new ReservationDate(value);
  }

  static reconstitute(value: Date): ReservationDate {
    return new ReservationDate(value);
  }

  equals(other: ReservationDate): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  isBefore(other: ReservationDate): boolean {
    return this.value.getTime() < other.value.getTime();
  }

  isAfter(other: ReservationDate): boolean {
    return this.value.getTime() > other.value.getTime();
  }

  isSameDay(other: ReservationDate): boolean {
    return (
      this.value.getFullYear() === other.value.getFullYear() &&
      this.value.getMonth() === other.value.getMonth() &&
      this.value.getDate() === other.value.getDate()
    );
  }
}
