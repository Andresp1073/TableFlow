/**
 * Resolves human-readable resource+action pairs into permission names.
 * e.g., resolve("reservations", "create") → "reservations.create"
 *
 * Implementations define the canonical set of resources and actions
 * that the application recognizes.
 */
export interface PermissionResolver {
  resolve(resource: string, action: string): string;
  getResourceTypes(): string[];
  getActions(resource: string): string[];
}
