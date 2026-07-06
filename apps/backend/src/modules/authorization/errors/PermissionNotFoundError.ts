import { AppError } from "../../../errors/AppError.js";

export class PermissionNotFoundError extends AppError {
  constructor(permissionName: string) {
    super(404, "authz.permission.not_found", `Permission '${permissionName}' not found`);
    this.name = "PermissionNotFoundError";
  }
}
