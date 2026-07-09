export type ResourceType =
  | "reservation"
  | "order"
  | "menu"
  | "employee"
  | "user"
  | "restaurant"
  | "branch"
  | "report"
  | "billing"
  | "configuration";

export interface ResourceContext {
  resourceType: ResourceType;
  resourceId: string;
  restaurantId: string;
  branchId?: string;
  ownerUserId?: string;
  assignedUserId?: string;
  employeeUserId?: string;
  createdByUserId?: string;
  status?: string;
}
