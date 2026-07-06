import type { Prisma } from "@prisma/client";
import { BaseRepository } from "../../../shared/BaseRepository.js";
import type { RolePermission } from "../../domain/models/RolePermission.js";
import type { RolePermissionRepository } from "../../domain/repositories/RolePermissionRepository.js";

type PrismaRolePermission = Prisma.RolePermissionGetPayload<{}>;

export class RolePermissionRepositoryImpl extends BaseRepository implements RolePermissionRepository {
  async findById(id: string): Promise<RolePermission | null> {
    const record = await this.prisma.rolePermission.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByRoleId(roleId: string): Promise<RolePermission[]> {
    const records = await this.prisma.rolePermission.findMany({
      where: { roleId },
    });
    return records.map(this.toDomain);
  }

  async findByPermissionId(permissionId: string): Promise<RolePermission[]> {
    const records = await this.prisma.rolePermission.findMany({
      where: { permissionId },
    });
    return records.map(this.toDomain);
  }

  async findByRoleAndPermission(
    roleId: string,
    permissionId: string
  ): Promise<RolePermission | null> {
    const record = await this.prisma.rolePermission.findFirst({
      where: { roleId, permissionId },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<RolePermission[]> {
    const records = await this.prisma.rolePermission.findMany();
    return records.map(this.toDomain);
  }

  async create(roleId: string, permissionId: string): Promise<RolePermission> {
    const record = await this.prisma.rolePermission.create({
      data: { roleId, permissionId },
    });
    return this.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.rolePermission.delete({
      where: { id },
    });
  }

  async deleteByRoleAndPermission(
    roleId: string,
    permissionId: string
  ): Promise<void> {
    const record = await this.prisma.rolePermission.findFirst({
      where: { roleId, permissionId },
    });
    if (record) {
      await this.prisma.rolePermission.delete({
        where: { id: record.id },
      });
    }
  }

  async deleteByRoleId(roleId: string): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });
  }

  private toDomain(record: PrismaRolePermission): RolePermission {
    return {
      id: record.id,
      roleId: record.roleId,
      permissionId: record.permissionId,
      createdAt: record.createdAt,
    };
  }
}
