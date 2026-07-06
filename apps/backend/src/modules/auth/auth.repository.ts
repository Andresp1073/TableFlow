import { BaseRepository } from "../shared/BaseRepository.js";
import type { Prisma } from "@prisma/client";
import { hashToken } from "./auth.utils.js";

type UserWithRole = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

export class AuthRepository extends BaseRepository {
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async createRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    familyId: string,
    parentTokenId?: string,
    accessTokenJti?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        parentTokenId: parentTokenId ?? null,
        expiresAt,
        accessTokenJti: accessTokenJti ? hashToken(accessTokenJti) : null,
        ipAddress,
        userAgent,
      },
    });
  }

  async findRefreshTokenByAccessJti(accessTokenJtiHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: { accessTokenJti: accessTokenJtiHash, isRevoked: false },
    });
  }

  async findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: { tokenHash },
    });
  }

  async findRefreshTokenById(id: string) {
    return this.prisma.refreshToken.findUnique({
      where: { id },
    });
  }

  async revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  async rotateRefreshToken(id: string) {
    return this.prisma.refreshToken.updateMany({
      where: { id, isRevoked: false },
      data: { isRevoked: true, rotatedAt: new Date() },
    });
  }

  async findRefreshTokensByFamily(familyId: string) {
    return this.prisma.refreshToken.findMany({
      where: { familyId },
      orderBy: { createdAt: "asc" },
    });
  }

  async revokeFamily(familyId: string, reuseDetectedTokenId?: string) {
    const now = new Date();
    const data: Record<string, unknown> = { isRevoked: true, revokedAt: now };

    if (reuseDetectedTokenId) {
      await this.prisma.refreshToken.update({
        where: { id: reuseDetectedTokenId },
        data: { ...data, reuseDetected: true },
      });
    }

    return this.prisma.refreshToken.updateMany({
      where: {
        familyId,
        isRevoked: false,
        ...(reuseDetectedTokenId ? { id: { not: reuseDetectedTokenId } } : {}),
      },
      data,
    });
  }

  async revokeUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  async getUserSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async createVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ) {
    return this.prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async invalidateVerificationTokens(userId: string) {
    return this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null, expiresAt: { gte: new Date() } },
      data: { usedAt: new Date() },
    });
  }

  async findVerificationToken(tokenHash: string) {
    return this.prisma.emailVerificationToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gte: new Date() } },
    });
  }

  async markVerificationTokenUsed(id: string) {
    return this.prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async verifyUserEmail(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  }

  async createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string
  ) {
    return this.prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt, ipAddress, userAgent },
    });
  }

  async invalidatePasswordResetTokens(userId: string) {
    return this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null, expiresAt: { gte: new Date() } },
      data: { usedAt: new Date() },
    });
  }

  async findPasswordResetToken(tokenHash: string) {
    return this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gte: new Date() } },
    });
  }

  async markResetTokenUsed(tokenHash: string) {
    return this.prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async incrementFailedAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLoginAt: new Date(),
      },
    });
  }

  async resetFailedAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lockedAt: null,
        lockedUntil: null,
        lockReason: null,
      },
    });
  }

  async lockUserAccount(
    userId: string,
    lockDurationMinutes: number,
    lockReason: string
  ) {
    const now = new Date();
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedAt: now,
        lockedUntil: new Date(now.getTime() + lockDurationMinutes * 60_000),
        lockReason,
      },
    });
  }

  async unlockUserAccount(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lockedAt: null,
        lockedUntil: null,
        lockReason: null,
      },
    });
  }

  async findActiveRole(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return [];

    const permissions = new Set<string>();
    for (const userRole of user.userRoles) {
      for (const rp of userRole.role.rolePermissions) {
        permissions.add(rp.permission.code);
      }
    }

    return Array.from(permissions);
  }
}
