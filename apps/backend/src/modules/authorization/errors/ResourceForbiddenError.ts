import { AppError } from "../../../errors/AppError.js";

export class ResourceForbiddenError extends AppError {
  constructor(
    resourceType: string,
    resourceId: string,
    reason: string,
    details?: Record<string, string[]>
  ) {
    super(
      403,
      "authz.resource.forbidden",
      `Access denied to ${resourceType} "${resourceId}": ${reason}`,
      details
    );
    this.name = "ResourceForbiddenError";
  }
}
