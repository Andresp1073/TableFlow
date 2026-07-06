import { AppError } from "../../../errors/AppError.js";

export class PermissionDeniedError extends AppError {
  constructor(permissionName: string) {
    super(403, "authz.permission.denied", `Missing required permission: ${permissionName}`);
    this.name = "PermissionDeniedError";
  }
}
