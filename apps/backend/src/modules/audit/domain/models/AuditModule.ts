const VALID_MODULES = [
  "restaurant",
  "table",
  "reservation",
  "customer",
  "employee",
  "user",
  "role",
  "permission",
  "auth",
  "audit",
  "notification",
  "organization",
  "branch",
  "settings",
  "system",
] as const;

export type AuditModuleValue = (typeof VALID_MODULES)[number];

export class AuditModule {
  private constructor(public readonly value: AuditModuleValue) {}

  static create(value: string): AuditModule {
    const normalized = value.trim().toLowerCase();
    if (!VALID_MODULES.includes(normalized as AuditModuleValue)) {
      throw new Error(
        `Invalid audit module "${value}". Allowed: ${VALID_MODULES.join(", ")}`,
      );
    }
    return new AuditModule(normalized as AuditModuleValue);
  }

  static reconstitute(value: string): AuditModule {
    return new AuditModule(value as AuditModuleValue);
  }

  equals(other: AuditModule): boolean {
    return this.value === other.value;
  }
}
