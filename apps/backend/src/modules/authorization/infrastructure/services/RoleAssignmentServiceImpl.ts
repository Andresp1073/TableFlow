import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../../../config/database.js";
import type { Role } from "../../domain/models/Role.js";
import type { UserRole, UserRoleStatus } from "../../domain/models/UserRole.js";
import type { RoleRepository } from "../../domain/repositories/RoleRepository.js";
import type { UserRoleRepository } from "../../domain/repositories/UserRoleRepository.js";
import type {
  RoleAssignmentService,
  RoleAssignmentResult,
  ReplaceRolesResult,
  RestaurantUser,
} from "../../application/services/RoleAssignmentService.js";
import type { CacheInvalidationService } from "../../../shared/cache/domain/CacheInvalidationService.js";
import { RoleAssignmentPolicy } from "../../application/services/RoleAssignmentPolicy.js";
import { RoleNotFoundError } from "../../errors/RoleNotFoundError.js";
import { UserNotFoundError } from "../../errors/UserNotFoundError.js";
import { AssignmentNotFoundError } from "../../errors/AssignmentNotFoundError.js";
import { DuplicateAssignmentError } from "../../errors/DuplicateAssignmentError.js";
import { InvalidRoleAssignmentError } from "../../errors/InvalidRoleAssignmentError.js";
import {
  validateUserRoleAssignment,
  validateDuplicateUserRole,
  validateSystemRoleAssignment,
  validateRoleRemoval,
  validateUserRoleUpdate,
} from "../../domain/validation/UserRoleValidation.js";

export class RoleAssignmentServiceImpl implements RoleAssignmentService {
  private readonly policy: RoleAssignmentPolicy;
  private readonly invalidation: CacheInvalidationService | null;

  constructor(
    private readonly userRoleRepo: UserRoleRepository,
    private readonly roleRepo: RoleRepository,
    private readonly db: PrismaClient = prisma,
    invalidation?: CacheInvalidationService
  ) {
    this.policy = new RoleAssignmentPolicy();
    this.invalidation = invalidation ?? null;
  }

  async assignRole(
    userId: string,
    roleId: string,
    restaurantId: string,
    assignedBy: string,
    options?: { branchId?: string | null; expiresAt?: Date | null }
  ): Promise<RoleAssignmentResult> {
    const [user, role, assigner] = await Promise.all([
      this.db.user.findUnique({ where: { id: userId } }),
      this.roleRepo.findById(roleId),
      this.db.user.findUnique({ where: { id: assignedBy } }),
    ]);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (!role) {
      throw new RoleNotFoundError(roleId);
    }

    if (!assigner) {
      throw new UserNotFoundError(assignedBy);
    }

    const assignmentErrors = validateUserRoleAssignment(role, restaurantId);
    if (assignmentErrors.length > 0) {
      throw new InvalidRoleAssignmentError(
        assignmentErrors.map((e) => e.message).join("; ")
      );
    }

    const existingAssignment = await this.userRoleRepo.findByUserAndRole(
      userId,
      roleId,
      restaurantId
    );

    const duplicateError = validateDuplicateUserRole(existingAssignment);
    if (duplicateError) {
      throw new DuplicateAssignmentError(duplicateError.message);
    }

    const assignment = await this.userRoleRepo.create({
      userId,
      roleId,
      restaurantId,
      branchId: options?.branchId ?? null,
      assignedBy,
      expiresAt: options?.expiresAt ?? null,
    });

    await this.invalidation?.invalidateUserForRestaurant(userId, restaurantId);

    return { assignment };
  }

  async removeRole(
    userId: string,
    roleId: string,
    restaurantId: string,
    _performedBy: string
  ): Promise<void> {
    const [role, existingAssignment] = await Promise.all([
      this.roleRepo.findById(roleId),
      this.userRoleRepo.findByUserAndRole(userId, roleId, restaurantId),
    ]);

    const removalErrors = validateRoleRemoval(role, existingAssignment, false);
    if (removalErrors.length > 0) {
      throw new InvalidRoleAssignmentError(
        removalErrors.map((e) => e.message).join("; ")
      );
    }

    await this.userRoleRepo.deleteByUserAndRole(userId, roleId, restaurantId);

    await this.invalidation?.invalidateUserForRestaurant(userId, restaurantId);
  }

  async replaceUserRoles(
    userId: string,
    restaurantId: string,
    roleIds: string[],
    assignedBy: string,
    options?: { branchId?: string | null; expiresAt?: Date | null }
  ): Promise<ReplaceRolesResult> {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const currentAssignments = await this.userRoleRepo.findByUserAndRestaurant(
      userId,
      restaurantId
    );

    const currentRoleIds = new Set(currentAssignments.map((a) => a.roleId));
    const newRoleIds = new Set(roleIds);

    const toRemove = currentAssignments.filter(
      (a) => !newRoleIds.has(a.roleId) && a.status === "active"
    );

    for (const assignment of toRemove) {
      await this.userRoleRepo.updateStatus(assignment.id, "revoked");
    }

    const assigned: UserRole[] = [];
    let removed = toRemove.length;

    for (const roleId of roleIds) {
      if (currentRoleIds.has(roleId)) {
        continue;
      }

      const role = await this.roleRepo.findById(roleId);
      if (!role || role.status !== "active") {
        continue;
      }

      if (role.restaurantId !== null && role.restaurantId !== restaurantId) {
        continue;
      }

      const result = await this.userRoleRepo.create({
        userId,
        roleId,
        restaurantId,
        branchId: options?.branchId ?? null,
        assignedBy,
        expiresAt: options?.expiresAt ?? null,
      });
      assigned.push(result);
    }

    await this.invalidation?.invalidateUserForRestaurant(userId, restaurantId);

    return {
      removed,
      assigned: assigned.length,
      assignments: assigned,
    };
  }

  async getUserRoles(
    userId: string,
    restaurantId?: string
  ): Promise<UserRole[]> {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (restaurantId) {
      return this.userRoleRepo.findByUserAndRestaurant(userId, restaurantId);
    }

    return this.userRoleRepo.findByUser(userId);
  }

  async getUsersInRole(
    roleId: string,
    restaurantId?: string
  ): Promise<UserRole[]> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new RoleNotFoundError(roleId);
    }

    if (restaurantId) {
      return this.userRoleRepo.findByRestaurantAndRole(restaurantId, roleId);
    }

    return this.userRoleRepo.findByRole(roleId);
  }

  async getRestaurantUsers(restaurantId: string): Promise<RestaurantUser[]> {
    const assignments = await this.userRoleRepo.findByRestaurant(restaurantId);

    const userMap = new Map<string, UserRole[]>();
    for (const assignment of assignments) {
      const existing = userMap.get(assignment.userId) ?? [];
      existing.push(assignment);
      userMap.set(assignment.userId, existing);
    }

    return Array.from(userMap.entries()).map(([userId, userAssignments]) => ({
      userId,
      assignments: userAssignments,
    }));
  }

  async updateAssignmentStatus(
    assignmentId: string,
    status: UserRoleStatus,
    _performedBy: string
  ): Promise<UserRole> {
    const existing = await this.userRoleRepo.findById(assignmentId);
    if (!existing) {
      throw new AssignmentNotFoundError(assignmentId);
    }

    const validationErrors = validateUserRoleUpdate(existing.status, status);
    if (validationErrors.length > 0) {
      throw new InvalidRoleAssignmentError(
        validationErrors.map((e) => e.message).join("; ")
      );
    }

    const updated = await this.userRoleRepo.updateStatus(assignmentId, status);

    await this.invalidation?.invalidateUserForRestaurant(
      existing.userId,
      existing.restaurantId
    );

    return updated;
  }

  async updateAssignmentExpiry(
    assignmentId: string,
    expiresAt: Date | null,
    _performedBy: string
  ): Promise<UserRole> {
    const existing = await this.userRoleRepo.findById(assignmentId);
    if (!existing) {
      throw new AssignmentNotFoundError(assignmentId);
    }

    if (existing.status === "revoked") {
      throw new InvalidRoleAssignmentError(
        "Cannot modify a revoked role assignment"
      );
    }

    const updated = await this.userRoleRepo.updateExpiresAt(assignmentId, expiresAt);

    await this.invalidation?.invalidateUserForRestaurant(
      existing.userId,
      existing.restaurantId
    );

    return updated;
  }

  async validateAssignment(
    userId: string,
    roleId: string,
    restaurantId: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const [user, role] = await Promise.all([
      this.db.user.findUnique({ where: { id: userId } }),
      this.roleRepo.findById(roleId),
    ]);

    if (!user) {
      errors.push(`User not found: ${userId}`);
    }

    if (!role) {
      errors.push(`Role not found: ${roleId}`);
    }

    if (user && role) {
      const assignmentErrors = validateUserRoleAssignment(role, restaurantId);
      errors.push(...assignmentErrors.map((e) => e.message));

      if (role.restaurantId !== null && role.restaurantId !== restaurantId) {
        errors.push("Role does not belong to the specified restaurant");
      }

      const existing = await this.userRoleRepo.findByUserAndRole(
        userId,
        roleId,
        restaurantId
      );
      const duplicateError = validateDuplicateUserRole(existing);
      if (duplicateError) {
        errors.push(duplicateError.message);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
