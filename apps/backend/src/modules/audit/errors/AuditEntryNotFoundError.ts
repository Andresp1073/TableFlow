import { AppError } from "../../../errors/AppError.js";

export class AuditEntryNotFoundError extends AppError {
  constructor(id: string) {
    super(404, "audit_entry.not_found", `Audit entry '${id}' not found`);
    this.name = "AuditEntryNotFoundError";
    Object.setPrototypeOf(this, AuditEntryNotFoundError.prototype);
  }
}
