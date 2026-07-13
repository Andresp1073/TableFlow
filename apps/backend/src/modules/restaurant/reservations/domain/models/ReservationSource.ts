const VALID_SOURCES = ["website", "phone", "walk_in", "mobile_app", "admin_panel", "api"] as const;

export type ReservationSourceValue = (typeof VALID_SOURCES)[number];

export class ReservationSource {
  private constructor(public readonly value: ReservationSourceValue) {}

  static create(value: string): ReservationSource {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
    if (!VALID_SOURCES.includes(normalized as ReservationSourceValue)) {
      throw new Error(
        `Invalid reservation source "${value}". Allowed: ${VALID_SOURCES.join(", ")}`,
      );
    }
    return new ReservationSource(normalized as ReservationSourceValue);
  }

  static reconstitute(value: string): ReservationSource {
    return new ReservationSource(value as ReservationSourceValue);
  }

  equals(other: ReservationSource): boolean {
    return this.value === other.value;
  }

  isCustomerFacing(): boolean {
    return ["website", "phone", "walk_in", "mobile_app"].includes(this.value);
  }

  static readonly WEBSITE = "website" as const;
  static readonly PHONE = "phone" as const;
  static readonly WALK_IN = "walk_in" as const;
  static readonly MOBILE_APP = "mobile_app" as const;
  static readonly ADMIN_PANEL = "admin_panel" as const;
  static readonly API = "api" as const;
}
