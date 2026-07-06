import type { Prisma } from "@prisma/client";
import { BaseRepository } from "../../../shared/BaseRepository.js";
import type { UserRole, UserRoleStatus } from "../../domain/models/UserRole.js";
import type { UserRoleRepository } from "../../domain/repositories/UserRoleRepository.js";

type PrismaUserRole = Prisma.UserRoleGetPayload<{}>;

export class UserRoleRepositoryImpl extends BaseRepository implements UserRoleRepository {
  async findById(id: string): Promise<UserRole | null> {
    const record = await this.prisma.userRole.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByUserAndRole(userId: string, roleId: string, restaurantId: string): Promise<UserRole | null> {
    const record = await this.prisma.userRole.findFirst({
      where: { userId, roleId, restaurantId },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByUser(userId: string): Promise<UserRole[]> {
    const records = await this.prisma.userRole.findMany({
      where: { userId },
    });
    return records.map(this.toDomain);
  }

  async findByRole(roleId: string): Promise<UserRole[]> {
    const records = await this.prisma.userRole.findMany({
      where: { roleId },
    });
    return records.map(this.toDomain);
  }

  async findByRestaurant(restaurantId: string): Promise<UserRole[]> {
    const records = await this.prisma.userRole.findMany({
      where: { restaurantId },
    });
    return records.map(this.toDomain);
  }

  async findByUserAndRestaurant(userId: string, restaurantId: string): Promise<UserRole[]> {
    const records = await this.prisma.userRole.findMany({
      where: { userId, restaurantId },
    });
    return records.map(this.toDomain);
  }

  async findByRestaurantAndRole(restaurantId: string, roleId: string): Promise<UserRole[]> {
    const records = await this.prisma.userRole.findMany({
      where: { restaurantId, roleId },
    });
    return records.map(this.toDomain);
  }

  async findUsersByRole(roleId: string): Promise<UserRole[]> {
    return this.findByRole(roleId);
  }

  async findActiveByUser(userId: string): Promise<UserRole[]> {
    const records = await this.prisma.userRole.findMany({
      where: { userId, status: "active" },
    });
    return records.map(this.toDomain);
  }

  async findExpired(): Promise<UserRole[]> {
    const records = await this.prisma.userRole.findMany({
      where: {
        status: "active",
        expiresAt: { lte: new Date() },
      },
    });
    return records.map(this.toDomain);
  }

  async create(data: {
    userId: string;
    roleId: string;
    restaurantId: string;
    branchId?: string | null;
    assignedBy: string;
    expiresAt?: Date | null;
  }): Promise<UserRole> {
    const record = await this.prisma.userRole.create({
      data: {
        userId: data.userId,
        roleId: data.roleId,
        restaurantId: data.restaurantId,
        branchId: data.branchId ?? null,
        assignedBy: data.assignedBy,
        expiresAt: data.expiresAt ?? null,
        status: "active",
      },
    });
    return this.toDomain(record);
  }

  async updateStatus(id: string, status: UserRoleStatus): Promise<UserRole> {
    const record = await this.prisma.userRole.update({
      where: { id },
      data: { status },
    });
    return this.toDomain(record);
  }

  async updateExpiresAt(id: string, expiresAt: Date | null): Promise<UserRole> {
    const record = await this.prisma.userRole.update({
      where: { id },
      data: { expiresAt },
    });
    return this.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.userRole.delete({
      where: { id },
    });
  }

  async deleteByUserAndRole(userId: string, roleId: string, restaurantId: string): Promise<void> {
    const record = await this.prisma.userRole.findFirst({
      where: { userId, roleId, restaurantId },
    });
    if (record) {
      await this.prisma.userRole.delete({
        where: { id: record.id },
      });
    }
  }

  private toDomain(record: PrismaUserRole): UserRole {
    return {
      id: record.id,
      userId: record.userId,
      roleId: record.roleId,
      restaurantId: record.restaurantId,
      branchId: record.branchId,
      assignedBy: record.assignedBy,
      assignedAt: record.assignedAt,
      expiresAt: record.expiresAt,
      status: record.status as UserRoleStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
