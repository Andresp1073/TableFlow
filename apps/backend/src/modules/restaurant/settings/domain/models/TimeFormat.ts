const ALLOWED_FORMATS = [
  "HH:mm",
  "hh:mm A",
  "hh:mm a",
  "HH:mm:ss",
  "hh:mm:ss A",
] as const;

export type TimeFormatValue = typeof ALLOWED_FORMATS[number];

export class TimeFormat {
  private constructor(public readonly value: TimeFormatValue) {}

  static create(value: string): TimeFormat {
    const trimmed = value.trim();
    if (!ALLOWED_FORMATS.includes(trimmed as TimeFormatValue)) {
      throw new Error(
        `Invalid time format "${value}". Allowed: ${ALLOWED_FORMATS.join(", ")}`
      );
    }
    return new TimeFormat(trimmed as TimeFormatValue);
  }

  static reconstitute(value: string): TimeFormat {
    return new TimeFormat(value as TimeFormatValue);
  }

  equals(other: TimeFormat): boolean {
    return this.value === other.value;
  }
}
