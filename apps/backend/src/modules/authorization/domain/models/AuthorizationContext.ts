export type AuthorizationScope =
  | { type: "global" }
  | { type: "organization"; organizationId: string }
  | { type: "branch"; organizationId: string; branchId: string };

export interface UserRoleInfo {
  roleId: string;
  roleCode: string;
  roleName: string;
  restaurantId: string | null;
  branchId: string | null;
}

export interface AuthorizationContext {
  userId: string;
  organizationId: string;
  roles: UserRoleInfo[];
  permissions: string[];
  scope: AuthorizationScope;
  sessionId?: string;
  requestMetadata?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
}
