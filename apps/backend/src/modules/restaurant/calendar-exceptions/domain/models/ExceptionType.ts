const VALID_TYPES = [
  "holiday",
  "special_opening",
  "temporary_closure",
  "maintenance",
  "private_event",
  "seasonal_hours",
  "emergency_closure",
] as const;

export type ExceptionTypeValue = (typeof VALID_TYPES)[number];

export class ExceptionType {
  private constructor(public readonly value: ExceptionTypeValue) {}

  static create(value: string): ExceptionType {
    const normalized = value.toLowerCase().replace(/-/g, "_");
    if (!VALID_TYPES.includes(normalized as ExceptionTypeValue)) {
      throw new Error(
        `ExceptionType must be one of: ${VALID_TYPES.join(", ")}, got '${value}'`,
      );
    }
    return new ExceptionType(normalized as ExceptionTypeValue);
  }

  static reconstitute(value: string): ExceptionType {
    return new ExceptionType(value as ExceptionTypeValue);
  }

  equals(other: ExceptionType): boolean {
    return this.value === other.value;
  }

  isClosure(): boolean {
    return (
      this.value === "temporary_closure" ||
      this.value === "emergency_closure" ||
      this.value === "maintenance"
    );
  }

  static readonly HOLIDAY = "holiday";
  static readonly SPECIAL_OPENING = "special_opening";
  static readonly TEMPORARY_CLOSURE = "temporary_closure";
  static readonly MAINTENANCE = "maintenance";
  static readonly PRIVATE_EVENT = "private_event";
  static readonly SEASONAL_HOURS = "seasonal_hours";
  static readonly EMERGENCY_CLOSURE = "emergency_closure";
}
