const MAX_LENGTH = 50;
const KNOWN_TIMEZONES: readonly string[] = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "America/Argentina/Buenos_Aires",
  "America/Toronto",
  "America/Vancouver",
];

export class RestaurantTimezone {
  private constructor(public readonly value: string) {}

  static create(value: string): RestaurantTimezone {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error("Restaurant timezone cannot be empty");
    }

    if (trimmed.length > MAX_LENGTH) {
      throw new Error(`Restaurant timezone cannot exceed ${MAX_LENGTH} characters`);
    }

    if (!KNOWN_TIMEZONES.includes(trimmed)) {
      throw new Error(
        `Invalid timezone "${value}". Must be a valid IANA timezone identifier`
      );
    }

    return new RestaurantTimezone(trimmed);
  }

  static reconstitute(value: string): RestaurantTimezone {
    return new RestaurantTimezone(value);
  }

  equals(other: RestaurantTimezone): boolean {
    return this.value === other.value;
  }
}
