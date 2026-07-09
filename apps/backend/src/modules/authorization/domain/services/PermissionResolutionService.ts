import type { PermissionResolutionContext, PermissionResolutionResult } from "../models/PermissionResolution.js";

export interface PermissionResolutionService {
  resolve(context: PermissionResolutionContext, cacheKey?: object): Promise<PermissionResolutionResult>;
}
