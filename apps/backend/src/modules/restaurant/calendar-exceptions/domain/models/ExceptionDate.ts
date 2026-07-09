const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class ExceptionDate {
  private constructor(public readonly value: string) {}

  static create(value: string, allowPast: boolean = false): ExceptionDate {
    if (!ISO_DATE_REGEX.test(value)) {
      throw new Error(`ExceptionDate must be in YYYY-MM-DD format, got '${value}'`);
    }

    const date = new Date(value + "T00:00:00Z");
    if (isNaN(date.getTime())) {
      throw new Error(`ExceptionDate '${value}' is not a valid date`);
    }

    if (!allowPast) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error(`ExceptionDate '${value}' is in the past`);
      }
    }

    return new ExceptionDate(value);
  }

  static reconstitute(value: string): ExceptionDate {
    return new ExceptionDate(value);
  }

  equals(other: ExceptionDate): boolean {
    return this.value === other.value;
  }

  toDate(): Date {
    return new Date(this.value + "T00:00:00Z");
  }
}
