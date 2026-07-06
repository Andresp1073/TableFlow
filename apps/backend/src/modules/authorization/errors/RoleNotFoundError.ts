import { AppError } from "../../../errors/AppError.js";

export class RoleNotFoundError extends AppError {
  constructor(roleId: string) {
    super(404, "authz.role.not_found", `Role '${roleId}' not found`);
    this.name = "RoleNotFoundError";
  }
}
