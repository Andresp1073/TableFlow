import type { RolePermission } from "../../domain/models/RolePermission.js";
import type { RolePermissionRepository } from "../../domain/repositories/RolePermissionRepository.js";
import type {
  RolePermissionService,
  AssignPermissionsResult,
} from "../../application/services/RolePermissionService.js";
import type { CacheInvalidationService } from "../../../shared/cache/domain/CacheInvalidationService.js";
import { DuplicateAssignmentError } from "../../errors/DuplicateAssignmentError.js";
import {
  validateRolePermissionAssignment,
  validateDuplicateAssignment,
} from "../../domain/validation/RolePermissionValidation.js";

export class RolePermissionServiceImpl implements RolePermissionService {
  private readonly invalidation: CacheInvalidationService | null;

  constructor(
    private readonly repo: RolePermissionRepository,
    invalidation?: CacheInvalidationService
  ) {
    this.invalidation = invalidation ?? null;
  }

  async assignPermissionToRole(
    roleId: string,
    permissionId: string
  ): Promise<RolePermission> {
    const existing = await this.repo.findByRoleAndPermission(
      roleId,
      permissionId
    );
    const duplicateError = validateDuplicateAssignment(existing);
    if (duplicateError) {
      throw new DuplicateAssignmentError(duplicateError.message);
    }

    const result = await this.repo.create(roleId, permissionId);
    await this.invalidation?.invalidateAll();
    return result;
  }

  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<AssignPermissionsResult> {
    const result: AssignPermissionsResult = {
      assigned: 0,
      skipped: 0,
      errors: [],
    };

    const existingAssignments = await this.repo.findByRoleId(roleId);
    const existingPermissionIds = new Set(
      existingAssignments.map((rp) => rp.permissionId)
    );

    for (const permissionId of permissionIds) {
      if (existingPermissionIds.has(permissionId)) {
        result.skipped++;
        continue;
      }

      try {
        await this.repo.create(roleId, permissionId);
        result.assigned++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        result.errors.push(
          `Failed to assign permission ${permissionId}: ${message}`
        );
      }
    }

    if (result.assigned > 0) {
      await this.invalidation?.invalidateAll();
    }

    return result;
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string
  ): Promise<void> {
    await this.repo.deleteByRoleAndPermission(roleId, permissionId);
    await this.invalidation?.invalidateAll();
  }

  async removePermissionsFromRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<number> {
    let removed = 0;

    for (const permissionId of permissionIds) {
      const existing = await this.repo.findByRoleAndPermission(
        roleId,
        permissionId
      );
      if (existing) {
        await this.repo.delete(existing.id);
        removed++;
      }
    }

    if (removed > 0) {
      await this.invalidation?.invalidateAll();
    }

    return removed;
  }

  async replaceRolePermissions(
    roleId: string,
    permissionIds: string[]
  ): Promise<RolePermission[]> {
    await this.repo.deleteByRoleId(roleId);

    const created: RolePermission[] = [];
    for (const permissionId of permissionIds) {
      const record = await this.repo.create(roleId, permissionId);
      created.push(record);
    }

    await this.invalidation?.invalidateAll();

    return created;
  }

  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return this.repo.findByRoleId(roleId);
  }

  async getPermissionRoles(permissionId: string): Promise<RolePermission[]> {
    return this.repo.findByPermissionId(permissionId);
  }

  async hasPermission(
    roleId: string,
    permissionId: string
  ): Promise<boolean> {
    const record = await this.repo.findByRoleAndPermission(
      roleId,
      permissionId
    );
    return record !== null;
  }
}
