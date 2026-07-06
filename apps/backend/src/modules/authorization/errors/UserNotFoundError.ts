import { AppError } from "../../../errors/AppError.js";

export class UserNotFoundError extends AppError {
  constructor(userId: string) {
    super(404, "authz.user.not_found", `User not found: ${userId}`);
    this.name = "UserNotFoundError";
  }
}
