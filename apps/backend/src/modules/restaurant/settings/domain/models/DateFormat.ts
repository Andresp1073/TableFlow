const ALLOWED_FORMATS = [
  "YYYY-MM-DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "DD.MM.YYYY",
  "DD-MM-YYYY",
  "YYYY/MM/DD",
] as const;

export type DateFormatValue = typeof ALLOWED_FORMATS[number];

export class DateFormat {
  private constructor(public readonly value: DateFormatValue) {}

  static create(value: string): DateFormat {
    const trimmed = value.trim();
    if (!ALLOWED_FORMATS.includes(trimmed as DateFormatValue)) {
      throw new Error(
        `Invalid date format "${value}". Allowed: ${ALLOWED_FORMATS.join(", ")}`
      );
    }
    return new DateFormat(trimmed as DateFormatValue);
  }

  static reconstitute(value: string): DateFormat {
    return new DateFormat(value as DateFormatValue);
  }

  equals(other: DateFormat): boolean {
    return this.value === other.value;
  }
}
