import { AuthRepository } from "./auth.repository.js";
import type {
  AuthTokens,
  LoginRequest,
  LoginResponse,
  SessionInfo,
  RefreshRequest,
  LogoutRequest,
} from "./auth.types.js";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  generateTokenId,
  hashToken,
  generateResetToken,
  generateVerificationToken,
  getAccessTokenExpiresAt,
  getRefreshTokenExpiresAt,
  getVerificationTokenExpiresAt,
} from "./auth.utils.js";
import { emailService } from "../shared/email.service.js";
import { UnauthorizedError } from "../../errors/UnauthorizedError.js";
import { ValidationError } from "../../errors/ValidationError.js";
import { AppError } from "../../errors/AppError.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";

function validatePasswordStrength(password: string): void {
  if (password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError(
      "Password must contain at least one uppercase letter"
    );
  }
  if (!/[a-z]/.test(password)) {
    throw new ValidationError(
      "Password must contain at least one lowercase letter"
    );
  }
  if (!/[0-9]/.test(password)) {
    throw new ValidationError("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    throw new ValidationError(
      "Password must contain at least one special character"
    );
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

export class AuthService {
  private repository: AuthRepository;

  constructor(repository?: AuthRepository) {
    this.repository = repository ?? new AuthRepository();
  }

  async login(
    request: LoginRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    const user = await this.repository.findByEmail(request.email);

    if (!user) {
      logger.warn(
        { reason: "user_not_found", email: request.email, ip: ipAddress },
        "Failed login attempt: unknown email"
      );
      throw new UnauthorizedError("Invalid email or password", "auth.invalid_credentials");
    }

    if (!user.isActive) {
      logger.warn(
        { reason: "account_disabled", userId: user.id, ip: ipAddress },
        "Failed login attempt: disabled account"
      );
      throw new UnauthorizedError(
        "Invalid email or password",
        "auth.invalid_credentials"
      );
    }

    // ── Auto-reset: clear lockout if cool-down period has elapsed ──────────
    if (user.failedLoginAttempts > 0) {
      const resetAfterMs = env.AUTH_RESET_ATTEMPTS_AFTER * 60_000;
      const lastFailed = user.lastFailedLoginAt;

      if (lastFailed && Date.now() - lastFailed.getTime() >= resetAfterMs) {
        await this.repository.resetFailedAttempts(user.id);
        logger.info(
          { userId: user.id, ip: ipAddress },
          "Failed attempt counter auto-reset after cool-down period"
        );
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        user.lockedAt = null;
        user.lastFailedLoginAt = null;
      }

      // Auto-unlock if the lock duration has elapsed
      if (user.lockedUntil && user.lockedUntil <= new Date()) {
        await this.repository.resetFailedAttempts(user.id);
        logger.info(
          { userId: user.id, ip: ipAddress },
          "Account auto-unlocked after lockout period"
        );
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        user.lockedAt = null;
        user.lastFailedLoginAt = null;
      }
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      logger.warn(
        { reason: "account_locked", userId: user.id, ip: ipAddress },
        "Failed login attempt: locked account"
      );
      throw new UnauthorizedError(
        "Account is temporarily locked. Please try again later.",
        "auth.account_locked"
      );
    }

    const isValid = await verifyPassword(request.password, user.passwordHash);

    if (!isValid) {
      const newAttempts = user.failedLoginAttempts + 1;

      await this.repository.incrementFailedAttempts(user.id);

      if (newAttempts >= env.AUTH_MAX_LOGIN_ATTEMPTS) {
        await this.repository.lockUserAccount(
          user.id,
          env.AUTH_LOCKOUT_MINUTES,
          "Maximum failed login attempts exceeded"
        );
        logger.warn(
          {
            reason: "account_locked_after_attempts",
            userId: user.id,
            ip: ipAddress,
            maxAttempts: env.AUTH_MAX_LOGIN_ATTEMPTS,
            lockoutMinutes: env.AUTH_LOCKOUT_MINUTES,
          },
          "Account locked due to max failed attempts"
        );
      }

      logger.warn(
        { reason: "invalid_password", userId: user.id, ip: ipAddress, attemptNumber: newAttempts },
        "Failed login attempt: wrong password"
      );
      throw new UnauthorizedError("Invalid email or password", "auth.invalid_credentials");
    }

    await this.repository.resetFailedAttempts(user.id);
    await this.repository.updateLastLogin(user.id);

    const primaryRole = user.userRoles[0]?.role.name ?? "Customer";
    const tokens = await this.createTokens(user.id, user.organizationId, primaryRole, ipAddress, userAgent);

    logger.info(
      { userId: user.id, email: user.email, role: primaryRole, ip: ipAddress },
      "Successful login"
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: Math.floor(
        (Date.parse(tokens.accessTokenExpiresAt.toString()) - Date.now()) / 1000
      ),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: primaryRole,
      },
    };
  }

  async refresh(
    request: RefreshRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    let payload: { jti: string; type: string };
    try {
      payload = verifyToken(request.refreshToken) as unknown as {
        jti: string;
        type: string;
      };
    } catch {
      logger.warn(
        { reason: "invalid_signature", ip: ipAddress },
        "Failed refresh: invalid token signature"
      );
      throw new UnauthorizedError(
        "Invalid or expired refresh token",
        "auth.token.invalid"
      );
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedError(
        "Invalid token type",
        "auth.token.invalid_type"
      );
    }

    const tokenHash = hashToken(payload.jti);
    const storedToken = await this.repository.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError(
        "Refresh token not found",
        "auth.token.invalid"
      );
    }

    // ── Reuse detection: token was already used for a previous rotation ──────
    if (storedToken.rotatedAt) {
      await this.repository.revokeFamily(storedToken.familyId, storedToken.id);
      logger.warn(
        {
          reason: "reuse_detected",
          userId: storedToken.userId,
          familyId: storedToken.familyId,
          tokenId: storedToken.id,
          ip: ipAddress,
        },
        "Refresh token reuse detected — token family revoked"
      );
      throw new UnauthorizedError(
        "Refresh token has been revoked",
        "auth.token.revoked"
      );
    }

    // ── Normal revocation (logout, admin revoke, etc.) ──────────────────────
    if (storedToken.isRevoked) {
      throw new UnauthorizedError(
        "Refresh token has been revoked",
        "auth.token.revoked"
      );
    }

    if (storedToken.expiresAt < new Date()) {
      logger.warn(
        { reason: "expired", userId: storedToken.userId, ip: ipAddress },
        "Failed refresh: expired token"
      );
      throw new UnauthorizedError(
        "Refresh token has expired",
        "auth.token.expired"
      );
    }

    const user = await this.repository.findById(storedToken.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError(
        "User account is not active",
        "auth.account_disabled"
      );
    }

    // ── Atomic rotation: mark token as rotated only if not already revoked ──
    const rotationResult = await this.repository.rotateRefreshToken(
      storedToken.id
    );

    if (rotationResult.count === 0) {
      // Another request already rotated or revoked this token
      await this.repository.revokeFamily(storedToken.familyId);
      logger.warn(
        {
          reason: "concurrent_rotation",
          userId: storedToken.userId,
          familyId: storedToken.familyId,
          tokenId: storedToken.id,
          ip: ipAddress,
        },
        "Concurrent token rotation detected — token family revoked"
      );
      throw new UnauthorizedError(
        "Refresh token has been revoked",
        "auth.token.revoked"
      );
    }

    // ── Create new token in the same token family ──────────────────────────
    const primaryRole = user.userRoles[0]?.role.name ?? "Customer";
    const tokens = await this.createTokens(
      user.id,
      user.organizationId,
      primaryRole,
      ipAddress ?? storedToken.ipAddress ?? undefined,
      userAgent ?? storedToken.userAgent ?? undefined,
      storedToken.familyId,
      storedToken.id
    );

    logger.info(
      {
        userId: user.id,
        email: user.email,
        role: primaryRole,
        familyId: storedToken.familyId,
        ip: ipAddress,
      },
      "Successful token refresh with rotation"
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: Math.floor(
        (tokens.accessTokenExpiresAt.getTime() - Date.now()) / 1000
      ),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: primaryRole,
      },
    };
  }

  async logout(
    request: LogoutRequest,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    let jti: string;
    try {
      const payload = verifyToken(request.refreshToken) as { jti: string };
      jti = payload.jti;
    } catch {
      logger.warn(
        {
          reason: "invalid_signature",
          userId,
          ip: ipAddress,
          userAgent,
        },
        "Logout failed: invalid token signature"
      );
      throw new UnauthorizedError(
        "Invalid refresh token",
        "auth.token.invalid"
      );
    }

    const tokenHash = hashToken(jti);
    const storedToken = await this.repository.findRefreshToken(tokenHash);

    if (!storedToken) {
      logger.warn(
        {
          reason: "token_not_found",
          userId,
          ip: ipAddress,
          userAgent,
        },
        "Logout failed: token not found in database"
      );
      throw new UnauthorizedError(
        "Refresh token not found",
        "auth.token.invalid"
      );
    }

    if (userId && storedToken.userId !== userId) {
      logger.warn(
        {
          reason: "user_mismatch",
          tokenOwner: storedToken.userId,
          requestUser: userId,
          ip: ipAddress,
          userAgent,
        },
        "Logout failed: token does not belong to authenticated user"
      );
      throw new UnauthorizedError(
        "Refresh token does not belong to this user",
        "auth.token.user_mismatch"
      );
    }

    if (storedToken.isRevoked) {
      logger.info(
        {
          reason: "already_revoked",
          userId: storedToken.userId,
          ip: ipAddress,
          userAgent,
        },
        "Logout: token was already revoked (idempotent)"
      );
      return;
    }

    await this.repository.revokeRefreshToken(storedToken.id);

    logger.info(
      {
        reason: "success",
        userId: storedToken.userId,
        ip: ipAddress,
        userAgent,
      },
      "Successful logout"
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      logger.warn(
        { reason: "user_not_found", userId, ip: ipAddress, userAgent },
        "Change password failed: user not found"
      );
      throw new UnauthorizedError("User not found", "auth.user.not_found");
    }

    if (!user.isActive) {
      logger.warn(
        { reason: "account_disabled", userId, ip: ipAddress, userAgent },
        "Change password failed: disabled account"
      );
      throw new UnauthorizedError(
        "User account is not active",
        "auth.account_disabled"
      );
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      logger.warn(
        { reason: "wrong_current_password", userId, ip: ipAddress, userAgent },
        "Change password failed: wrong current password"
      );
      throw new UnauthorizedError(
        "Current password is incorrect",
        "auth.invalid_credentials"
      );
    }

    validatePasswordStrength(newPassword);

    if (currentPassword === newPassword) {
      throw new ValidationError(
        "New password must be different from current password"
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await this.repository.updatePassword(user.id, passwordHash);
    await this.repository.revokeUserRefreshTokens(user.id);

    logger.info(
      { userId: user.id, email: user.email, ip: ipAddress, userAgent },
      "Password changed successfully"
    );
  }

  async forgotPassword(
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ message: string }> {
    const user = await this.repository.findByEmail(email);

    if (!user || !user.isActive) {
      logger.info(
        {
          reason: user ? "disabled_account" : "unknown_email",
          ip: ipAddress,
          userAgent,
        },
        "Password reset requested for non-eligible account"
      );
      return {
        message: "If that email is registered, you will receive a password reset link.",
      };
    }

    await this.repository.invalidatePasswordResetTokens(user.id);

    const resetToken = generateResetToken();
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 3600000);

    await this.repository.createPasswordResetToken(
      user.id,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent
    );

    await emailService.sendPasswordReset(user.email, resetToken);

    logger.info(
      {
        userId: user.id,
        email: user.email,
        ip: ipAddress,
        userAgent,
        expiresAt,
      },
      "Password reset link sent"
    );

    return {
      message: "If that email is registered, you will receive a password reset link.",
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    validatePasswordStrength(newPassword);

    const tokenHash = hashToken(token);
    const resetRecord = await this.repository.findPasswordResetToken(tokenHash);

    if (!resetRecord) {
      logger.warn(
        {
          reason: "invalid_or_expired_token",
          ip: ipAddress,
          userAgent,
        },
        "Password reset failed: invalid or expired token"
      );
      throw new ValidationError(
        "Invalid or expired reset token. Request a new password reset."
      );
    }

    if (resetRecord.usedAt) {
      logger.warn(
        {
          reason: "already_used",
          userId: resetRecord.userId,
          ip: ipAddress,
          userAgent,
        },
        "Password reset failed: token already used"
      );
      throw new ValidationError(
        "Invalid or expired reset token. Request a new password reset."
      );
    }

    if (resetRecord.expiresAt < new Date()) {
      logger.warn(
        {
          reason: "expired",
          userId: resetRecord.userId,
          ip: ipAddress,
          userAgent,
        },
        "Password reset failed: token expired"
      );
      throw new ValidationError(
        "Invalid or expired reset token. Request a new password reset."
      );
    }

    const user = await this.repository.findById(resetRecord.userId);
    if (!user || !user.isActive) {
      logger.warn(
        {
          reason: "disabled_account",
          userId: resetRecord.userId,
          ip: ipAddress,
          userAgent,
        },
        "Password reset failed: user account is disabled"
      );
      throw new ValidationError(
        "Invalid or expired reset token. Request a new password reset."
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await this.repository.updatePassword(user.id, passwordHash);
    await this.repository.markResetTokenUsed(tokenHash);
    await this.repository.revokeUserRefreshTokens(user.id);

    logger.info(
      {
        userId: user.id,
        email: user.email,
        ip: ipAddress,
        userAgent,
      },
      "Password successfully reset"
    );
  }

  async verifyEmail(
    token: string,
    ipAddress?: string
  ): Promise<void> {
    const tokenHash = hashToken(token);
    const verificationRecord = await this.repository.findVerificationToken(
      tokenHash
    );

    if (!verificationRecord) {
      logger.warn(
        { reason: "invalid_or_expired_token", ip: ipAddress },
        "Email verification failed: invalid or expired token"
      );
      throw new ValidationError(
        "Invalid or expired verification token. Request a new verification email."
      );
    }

    if (verificationRecord.usedAt) {
      logger.warn(
        {
          reason: "already_used",
          userId: verificationRecord.userId,
          ip: ipAddress,
        },
        "Email verification failed: token already used"
      );
      throw new ValidationError(
        "Invalid or expired verification token. Request a new verification email."
      );
    }

    if (verificationRecord.expiresAt < new Date()) {
      logger.warn(
        {
          reason: "expired",
          userId: verificationRecord.userId,
          ip: ipAddress,
        },
        "Email verification failed: token expired"
      );
      throw new ValidationError(
        "Invalid or expired verification token. Request a new verification email."
      );
    }

    const user = await this.repository.findById(verificationRecord.userId);

    if (!user || !user.isActive) {
      logger.warn(
        {
          reason: "disabled_account",
          userId: verificationRecord.userId,
          ip: ipAddress,
        },
        "Email verification failed: user account is disabled"
      );
      throw new ValidationError(
        "Invalid or expired verification token. Request a new verification email."
      );
    }

    if (user.isVerified) {
      logger.warn(
        {
          reason: "already_verified",
          userId: user.id,
          email: user.email,
          ip: ipAddress,
        },
        "Email verification failed: already verified"
      );
      throw new ValidationError(
        "Invalid or expired verification token. Request a new verification email."
      );
    }

    await this.repository.verifyUserEmail(user.id);
    await this.repository.markVerificationTokenUsed(verificationRecord.id);

    logger.info(
      {
        userId: user.id,
        email: user.email,
        ip: ipAddress,
      },
      "Email verified successfully"
    );
  }

  async resendVerification(userId: string): Promise<{ message: string }> {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new UnauthorizedError("User not found", "auth.user.not_found");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("User account is not active", "auth.account_disabled");
    }

    if (user.isVerified) {
      throw new ValidationError("Email is already verified");
    }

    await this.repository.invalidateVerificationTokens(user.id);

    const verificationToken = generateVerificationToken();
    const tokenHash = hashToken(verificationToken);
    const expiresAt = getVerificationTokenExpiresAt();

    await this.repository.createVerificationToken(
      user.id,
      tokenHash,
      expiresAt
    );

    await emailService.sendVerificationEmail(
      user.email,
      verificationToken
    );

    logger.info(
      {
        userId: user.id,
        email: user.email,
        expiresAt,
      },
      "Verification email resent"
    );

    return {
      message: `Verification email sent to ${maskEmail(user.email)}`,
    };
  }

  async resendVerificationEmail(
    email: string,
    ipAddress?: string
  ): Promise<{ message: string }> {
    const user = await this.repository.findByEmail(email);

    if (!user || !user.isActive || user.isVerified) {
      logger.info(
        {
          reason: user
            ? user.isActive
              ? "already_verified"
              : "disabled_account"
            : "unknown_email",
          ip: ipAddress,
        },
        "Resend verification requested for non-eligible account"
      );
      return {
        message: "If that account exists and is unverified, a verification email has been sent.",
      };
    }

    await this.repository.invalidateVerificationTokens(user.id);

    const verificationToken = generateVerificationToken();
    const tokenHash = hashToken(verificationToken);
    const expiresAt = getVerificationTokenExpiresAt();

    await this.repository.createVerificationToken(
      user.id,
      tokenHash,
      expiresAt
    );

    await emailService.sendVerificationEmail(
      user.email,
      verificationToken
    );

    logger.info(
      {
        userId: user.id,
        email: user.email,
        ip: ipAddress,
        expiresAt,
      },
      "Verification email sent via resend-verification-email"
    );

    return {
      message: "If that account exists and is unverified, a verification email has been sent.",
    };
  }

  async getSessions(
    userId: string,
    currentJti: string
  ): Promise<SessionInfo[]> {
    const tokens = await this.repository.getUserSessions(userId);
    const currentSession = await this.repository.findRefreshTokenByAccessJti(
      hashToken(currentJti)
    );
    const now = new Date();

    return tokens
      .filter((t) => t.expiresAt > now)
      .map((t) => ({
        id: t.id,
        ipAddress: t.ipAddress,
        userAgent: t.userAgent,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
        isCurrent: currentSession?.id === t.id && !t.isRevoked,
      }));
  }

  async getCurrentSession(
    userId: string,
    currentJti: string
  ): Promise<SessionInfo | null> {
    const currentSession = await this.repository.findRefreshTokenByAccessJti(
      hashToken(currentJti)
    );

    if (!currentSession || currentSession.userId !== userId) {
      return null;
    }

    return {
      id: currentSession.id,
      ipAddress: currentSession.ipAddress,
      userAgent: currentSession.userAgent,
      createdAt: currentSession.createdAt,
      expiresAt: currentSession.expiresAt,
      isCurrent: true,
    };
  }

  async revokeSession(
    sessionId: string,
    userId: string,
    ipAddress?: string
  ): Promise<void> {
    const session = await this.repository.findRefreshTokenById(sessionId);

    if (!session || session.userId !== userId) {
      throw new AppError(404, "session.not_found", "Session not found");
    }

    if (!session.isRevoked) {
      await this.repository.revokeRefreshToken(session.id);
      logger.info(
        { reason: "session_revoked", sessionId, userId, ip: ipAddress },
        "Session revoked successfully"
      );
    }
  }

  async revokeAllSessions(
    userId: string,
    currentJti: string
  ): Promise<void> {
    const currentSession = await this.repository.findRefreshTokenByAccessJti(
      hashToken(currentJti)
    );
    const sessions = await this.repository.getUserSessions(userId);

    for (const session of sessions) {
      if (session.id !== currentSession?.id && !session.isRevoked) {
        await this.repository.revokeRefreshToken(session.id);
      }
    }
  }

  async unlockUserAccount(
    targetUserId: string,
    requestingUserId: string,
    ipAddress?: string
  ): Promise<void> {
    const targetUser = await this.repository.findById(targetUserId);

    if (!targetUser) {
      throw new AppError(404, "user.not_found", "User not found");
    }

    if (!targetUser.lockedUntil && targetUser.failedLoginAttempts === 0) {
      logger.info(
        { targetUserId, requestingUserId, ip: ipAddress },
        "Manual unlock attempted on already unlocked account"
      );
      return;
    }

    await this.repository.unlockUserAccount(targetUserId);

    logger.info(
      {
        reason: "manual_unlock",
        targetUserId,
        requestingUserId,
        ip: ipAddress,
      },
      "Account manually unlocked by administrator"
    );
  }

  async verifyTokenAndGetUser(
    token: string
  ): Promise<{
    id: string;
    organizationId: string;
    role: string;
    permissions: string[];
    isVerified: boolean;
  }> {
    let payload: {
      sub: string;
      organizationId: string;
      role: string;
      jti: string;
    };

    try {
      payload = verifyToken(token) as typeof payload;
    } catch {
      throw new UnauthorizedError(
        "Invalid or expired access token",
        "auth.token.invalid"
      );
    }

    const user = await this.repository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedError(
        "User account is not active",
        "auth.account_disabled"
      );
    }

    const permissions = await this.repository.getUserPermissions(
      payload.sub
    );

    return {
      id: user.id,
      organizationId: user.organizationId,
      role: payload.role,
      permissions,
      isVerified: user.isVerified,
    };
  }

  private async createTokens(
    userId: string,
    organizationId: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
    familyId?: string,
    parentTokenId?: string
  ): Promise<AuthTokens> {
    const accessJti = generateTokenId();
    const refreshJti = generateTokenId();
    const tokenFamilyId = familyId ?? generateTokenId();

    const accessToken = signAccessToken(
      { sub: userId, organizationId, role },
      accessJti
    );
    const refreshToken = signRefreshToken(refreshJti);

    const refreshTokenHash = hashToken(refreshJti);
    const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

    await this.repository.createRefreshToken(
      userId,
      refreshTokenHash,
      refreshTokenExpiresAt,
      tokenFamilyId,
      parentTokenId,
      accessJti,
      ipAddress,
      userAgent
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: getAccessTokenExpiresAt(),
      refreshTokenExpiresAt,
    };
  }
}
