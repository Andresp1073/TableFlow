const VALID_ACTIONS = [
  "create",
  "update",
  "delete",
  "archive",
  "restore",
  "login",
  "logout",
  "activate",
  "deactivate",
  "assign",
  "revoke",
] as const;

export type AuditActionValue = (typeof VALID_ACTIONS)[number];

export class AuditAction {
  private constructor(public readonly value: AuditActionValue) {}

  static create(value: string): AuditAction {
    const normalized = value.trim().toLowerCase();
    if (!VALID_ACTIONS.includes(normalized as AuditActionValue)) {
      throw new Error(
        `Invalid audit action "${value}". Allowed: ${VALID_ACTIONS.join(", ")}`,
      );
    }
    return new AuditAction(normalized as AuditActionValue);
  }

  static reconstitute(value: string): AuditAction {
    return new AuditAction(value as AuditActionValue);
  }

  equals(other: AuditAction): boolean {
    return this.value === other.value;
  }
}
