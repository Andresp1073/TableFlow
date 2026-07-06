import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth.service.js";

const mockNow = vi.hoisted(() => Date.now());

vi.mock("../shared/email.service.js", () => ({
  emailService: {
    send: vi.fn(),
    sendPasswordReset: vi.fn(),
    sendVerificationEmail: vi.fn(),
    sendWelcomeEmail: vi.fn(),
  },
}));

vi.mock("./auth.utils.js", () => ({
  verifyPassword: vi.fn(),
  signAccessToken: vi.fn(() => "mock-access-token"),
  signRefreshToken: vi.fn(() => "mock-refresh-token"),
  generateTokenId: vi.fn(() => "mock-token-id"),
  hashToken: vi.fn((t: string) => t),
  hashPassword: vi.fn((p: string) => p),
  getAccessTokenExpiresAt: vi.fn(() => new Date(mockNow + 900000)),
  getRefreshTokenExpiresAt: vi.fn(() => new Date(mockNow + 604800000)),
  generateResetToken: vi.fn(() => "reset-token"),
  generateVerificationToken: vi.fn(() => "verification-token"),
  getVerificationTokenExpiresAt: vi.fn(() => new Date(mockNow + 86400000)),
  verifyToken: vi.fn(),
}));

function createMockRepository() {
  return {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    incrementFailedAttempts: vi.fn(),
    resetFailedAttempts: vi.fn(),
    lockUserAccount: vi.fn(),
    unlockUserAccount: vi.fn(),
    updateLastLogin: vi.fn(),
    createRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeUserRefreshTokens: vi.fn(),
    rotateRefreshToken: vi.fn(),
    revokeFamily: vi.fn(),
    findRefreshTokensByFamily: vi.fn(),
    findRefreshToken: vi.fn(),
    findRefreshTokenByAccessJti: vi.fn(),
    findRefreshTokenById: vi.fn(),
    getUserSessions: vi.fn(),
    getUserPermissions: vi.fn(),
    updatePassword: vi.fn(),
    createPasswordResetToken: vi.fn(),
    invalidatePasswordResetTokens: vi.fn(),
    findPasswordResetToken: vi.fn(),
    markResetTokenUsed: vi.fn(),
    createVerificationToken: vi.fn(),
    invalidateVerificationTokens: vi.fn(),
    findVerificationToken: vi.fn(),
    markVerificationTokenUsed: vi.fn(),
    verifyUserEmail: vi.fn(),
  };
}

const mockUser: any = {
  id: "user-1",
  email: "admin@tableflow.io",
  passwordHash: "$2b$12$mockhash",
  firstName: "System",
  lastName: "Administrator",
  organizationId: "org-1",
  isActive: true,
  isVerified: true,
  failedLoginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  userRoles: [
    {
      id: "ur-1",
      userId: "user-1",
      roleId: "role-1",
      branchId: null,
      role: {
        id: "role-1",
        name: "System Administrator",
        description: null,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ],
};

const { verifyPassword, verifyToken, getAccessTokenExpiresAt } =
  await import("./auth.utils.js");

describe("AuthService.login", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  const validRequest = { email: "admin@tableflow.io", password: "Admin123!" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new AuthService(mockRepository as any);
  });

  it("should throw UnauthorizedError when user is not found", async () => {
    mockRepository.findByEmail.mockResolvedValue(null);

    const err = await service.login(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.invalid_credentials");
    expect(mockRepository.findByEmail).toHaveBeenCalledWith(validRequest.email);
  });

  it("should throw UnauthorizedError when account is disabled", async () => {
    mockRepository.findByEmail.mockResolvedValue({ ...mockUser, isActive: false });

    const err = await service.login(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.invalid_credentials");
  });

  it("should throw UnauthorizedError when account is locked", async () => {
    mockRepository.findByEmail.mockResolvedValue({
      ...mockUser,
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 3600000),
    });

    const err = await service.login(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.account_locked");
    expect(err).not.toHaveProperty("remainingMinutes");
  });

  it("should auto-reset failed attempts after cool-down period", async () => {
    const pastDate = new Date(Date.now() - 20 * 60_000);
    mockRepository.findByEmail.mockResolvedValue({
      ...mockUser,
      failedLoginAttempts: 3,
      lastFailedLoginAt: pastDate,
    });
    (verifyPassword as any).mockResolvedValue(true);

    const result = await service.login(validRequest);

    expect(mockRepository.resetFailedAttempts).toHaveBeenCalledWith(mockUser.id);
    expect(result).toHaveProperty("accessToken");
  });

  it("should auto-unlock account after lockout period expires", async () => {
    const pastLock = new Date(Date.now() - 60_000);
    mockRepository.findByEmail.mockResolvedValue({
      ...mockUser,
      failedLoginAttempts: 5,
      lastFailedLoginAt: pastLock,
      lockedAt: pastLock,
      lockedUntil: pastLock,
      lockReason: "Maximum failed login attempts exceeded",
    });
    (verifyPassword as any).mockResolvedValue(true);

    const result = await service.login(validRequest);

    expect(mockRepository.resetFailedAttempts).toHaveBeenCalledWith(mockUser.id);
    expect(result).toHaveProperty("accessToken");
  });

  it("should increment failed attempts on wrong password", async () => {
    mockRepository.findByEmail.mockResolvedValue(mockUser);
    (verifyPassword as any).mockResolvedValue(false);

    const err = await service.login(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(mockRepository.incrementFailedAttempts).toHaveBeenCalledWith(mockUser.id);
  });

  it("should lock account after 5th failed attempt", async () => {
    mockRepository.findByEmail.mockResolvedValue({
      ...mockUser,
      failedLoginAttempts: 4,
    });
    (verifyPassword as any).mockResolvedValue(false);

    const err = await service.login(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(mockRepository.lockUserAccount).toHaveBeenCalledWith(
      mockUser.id,
      30,
      "Maximum failed login attempts exceeded"
    );
  });

  it("should return LoginResponse on successful login", async () => {
    mockRepository.findByEmail.mockResolvedValue(mockUser);
    (verifyPassword as any).mockResolvedValue(true);

    const result = await service.login(validRequest);

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result).toHaveProperty("expiresIn");
    expect(result.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      role: mockUser.userRoles[0].role.name,
    });
    expect(mockRepository.resetFailedAttempts).toHaveBeenCalledWith(mockUser.id);
    expect(mockRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
  });
});

describe("AuthService.refresh", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  const validRequest = { refreshToken: "valid-refresh-token-jwt" };
  const validPayload = { jti: "mock-jti", type: "refresh" };
  const futureDate = new Date(Date.now() + 86400000);
  const pastDate = new Date(Date.now() - 86400000);
  const testFamilyId = "family-uuid-1";

  const mockStoredToken = {
    id: "token-1",
    userId: "user-1",
    tokenHash: "mock-jti",
    familyId: testFamilyId,
    parentTokenId: null,
    rotatedAt: null,
    revokedAt: null,
    reuseDetected: false,
    isRevoked: false,
    expiresAt: futureDate,
    createdAt: new Date(),
    accessTokenJti: null,
    ipAddress: null,
    userAgent: null,
  };

  const mockRevokedToken = {
    ...mockStoredToken,
    isRevoked: true,
    revokedAt: new Date(),
  };

  const mockRotatedToken = {
    ...mockStoredToken,
    isRevoked: true,
    rotatedAt: new Date(),
    revokedAt: new Date(),
  };

  const mockExpiredToken = {
    ...mockStoredToken,
    expiresAt: pastDate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new AuthService(mockRepository as any);
  });

  it("should return LoginResponse on successful refresh with rotation", async () => {
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(mockStoredToken);
    mockRepository.findById.mockResolvedValue(mockUser);
    mockRepository.rotateRefreshToken.mockResolvedValue({ count: 1 });

    const result = await service.refresh(validRequest);

    expect(result).toHaveProperty("accessToken", "mock-access-token");
    expect(result).toHaveProperty("refreshToken", "mock-refresh-token");
    expect(result).toHaveProperty("expiresIn");
    expect(typeof result.expiresIn).toBe("number");
    expect(result.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      role: mockUser.userRoles[0].role.name,
    });
    expect(mockRepository.rotateRefreshToken).toHaveBeenCalledWith(
      mockStoredToken.id
    );
    expect(mockRepository.createRefreshToken).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(String),
      expect.any(Date),
      testFamilyId,
      mockStoredToken.id,
      expect.any(String),
      undefined,
      undefined
    );
    expect(mockRepository.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when token has invalid signature", async () => {
    (verifyToken as any).mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    const err = await service.refresh(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.token.invalid");
  });

  it("should throw UnauthorizedError when token type is not refresh", async () => {
    (verifyToken as any).mockReturnValue({ jti: "mock-jti", type: "access" });

    const err = await service.refresh(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.token.invalid_type");
  });

  it("should throw UnauthorizedError when token is not found in DB", async () => {
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(null);

    const err = await service.refresh(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.token.invalid");
  });

  it("should throw UnauthorizedError for normally revoked token (logout) without family cascade", async () => {
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(mockRevokedToken);

    const err = await service.refresh(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.token.revoked");
    expect(mockRepository.revokeFamily).not.toHaveBeenCalled();
  });

  it("should revoke entire family when rotated token is reused", async () => {
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(mockRotatedToken);

    const err = await service.refresh(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.token.revoked");
    expect(mockRepository.revokeFamily).toHaveBeenCalledWith(
      testFamilyId,
      mockRotatedToken.id
    );
  });

  it("should revoke family on concurrent rotation race", async () => {
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(mockStoredToken);
    mockRepository.findById.mockResolvedValue(mockUser);
    mockRepository.rotateRefreshToken.mockResolvedValue({ count: 0 });

    const err = await service.refresh(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.token.revoked");
    expect(mockRepository.revokeFamily).toHaveBeenCalledWith(testFamilyId);
  });

  it("should throw UnauthorizedError when token has expired", async () => {
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(mockExpiredToken);

    const err = await service.refresh(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.token.expired");
  });

  it("should throw UnauthorizedError when user account is disabled", async () => {
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(mockStoredToken);
    mockRepository.findById.mockResolvedValue({ ...mockUser, isActive: false });

    const err = await service.refresh(validRequest).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.account_disabled");
  });

  it("should use stored token IP and user agent when not provided", async () => {
    const tokenWithDevice = {
      ...mockStoredToken,
      ipAddress: "10.0.0.1",
      userAgent: "TestAgent/1.0",
    };
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(tokenWithDevice);
    mockRepository.findById.mockResolvedValue(mockUser);
    mockRepository.rotateRefreshToken.mockResolvedValue({ count: 1 });

    await service.refresh(validRequest);

    expect(mockRepository.createRefreshToken).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(String),
      expect.any(Date),
      testFamilyId,
      tokenWithDevice.id,
      expect.any(String),
      "10.0.0.1",
      "TestAgent/1.0"
    );
  });
});

describe("AuthService.logout", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  const validRequest = { refreshToken: "valid-refresh-token" };
  const validPayload = { jti: "mock-jti" };
  const futureDate = new Date(Date.now() + 86400000);

  const mockStoredToken = {
    id: "token-1",
    userId: "user-1",
    tokenHash: "mock-jti",
    isRevoked: false,
    expiresAt: futureDate,
    createdAt: new Date(),
    accessTokenJti: null,
  };

  const mockRevokedToken = {
    ...mockStoredToken,
    isRevoked: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new AuthService(mockRepository as any);
  });

  it("should revoke token on successful logout", async () => {
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(mockStoredToken);

    await service.logout(validRequest, "user-1");

    expect(mockRepository.revokeRefreshToken).toHaveBeenCalledWith("token-1");
  });

  it("should throw UnauthorizedError when token has invalid signature", async () => {
    (verifyToken as any).mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    const err = await service.logout(validRequest, "user-1").catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.token.invalid");
  });

  it("should throw UnauthorizedError when token is not found", async () => {
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(null);

    const err = await service.logout(validRequest, "user-1").catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.token.invalid");
  });

  it("should throw UnauthorizedError on user mismatch", async () => {
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(mockStoredToken);

    const err = await service.logout(validRequest, "user-2").catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(err).toHaveProperty("code", "auth.token.user_mismatch");
    expect(mockRepository.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it("should return successfully on already revoked token (idempotent)", async () => {
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(mockRevokedToken);

    await expect(
      service.logout(validRequest, "user-1")
    ).resolves.toBeUndefined();
    expect(mockRepository.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it("should accept missing userId (unauthenticated context)", async () => {
    (verifyToken as any).mockReturnValue(validPayload);
    mockRepository.findRefreshToken.mockResolvedValue(mockStoredToken);

    await service.logout(validRequest);

    expect(mockRepository.revokeRefreshToken).toHaveBeenCalledWith("token-1");
  });
});

describe("AuthService.forgotPassword", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;
  let emailService: any;

  const testEmail = "admin@tableflow.io";

  beforeAll(async () => {
    const mod = await import("../shared/email.service.js");
    emailService = mod.emailService;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new AuthService(mockRepository as any);
  });

  it("should send reset link for active user", async () => {
    mockRepository.findByEmail.mockResolvedValue(mockUser);

    const result = await service.forgotPassword(testEmail);

    expect(result.message).toContain("password reset link");
    expect(
      mockRepository.invalidatePasswordResetTokens
    ).toHaveBeenCalledWith(mockUser.id);
    expect(
      mockRepository.createPasswordResetToken
    ).toHaveBeenCalledWith(
      mockUser.id,
      "reset-token",
      expect.any(Date),
      undefined,
      undefined
    );
    expect(emailService.sendPasswordReset).toHaveBeenCalledWith(
      mockUser.email,
      "reset-token"
    );
  });

  it("should return generic message for unknown email", async () => {
    mockRepository.findByEmail.mockResolvedValue(null);

    const result = await service.forgotPassword(testEmail);

    expect(result.message).toContain("password reset link");
    expect(
      mockRepository.createPasswordResetToken
    ).not.toHaveBeenCalled();
    expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("should return generic message for disabled account", async () => {
    mockRepository.findByEmail.mockResolvedValue({
      ...mockUser,
      isActive: false,
    });

    const result = await service.forgotPassword(testEmail);

    expect(result.message).toContain("password reset link");
    expect(
      mockRepository.createPasswordResetToken
    ).not.toHaveBeenCalled();
    expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("should invalidate existing active tokens before creating new one", async () => {
    mockRepository.findByEmail.mockResolvedValue(mockUser);

    await service.forgotPassword(testEmail);

    expect(
      mockRepository.invalidatePasswordResetTokens
    ).toHaveBeenCalledWith(mockUser.id);
  });

  it("should accept ipAddress and userAgent for audit trail", async () => {
    mockRepository.findByEmail.mockResolvedValue(mockUser);

    await service.forgotPassword(testEmail, "192.168.1.1", "TestAgent/1.0");

    expect(
      mockRepository.createPasswordResetToken
    ).toHaveBeenCalledWith(
      mockUser.id,
      "reset-token",
      expect.any(Date),
      "192.168.1.1",
      "TestAgent/1.0"
    );
  });
});

describe("AuthService.resetPassword", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  const validToken = "valid-reset-token";
  const validPassword = "NewSecurePass1!";
  const futureDate = new Date(Date.now() + 3600000);
  const pastDate = new Date(Date.now() - 3600000);

  const mockResetRecord = {
    id: "reset-1",
    userId: "user-1",
    tokenHash: "valid-reset-token",
    expiresAt: futureDate,
    usedAt: null,
    ipAddress: null,
    userAgent: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new AuthService(mockRepository as any);
  });

  it("should reset password successfully", async () => {
    mockRepository.findPasswordResetToken.mockResolvedValue(mockResetRecord);
    mockRepository.findById.mockResolvedValue(mockUser);

    await service.resetPassword(validToken, validPassword);

    expect(mockRepository.updatePassword).toHaveBeenCalledWith(
      "user-1",
      expect.any(String)
    );
    expect(mockRepository.markResetTokenUsed).toHaveBeenCalledWith(
      "valid-reset-token"
    );
    expect(mockRepository.revokeUserRefreshTokens).toHaveBeenCalledWith(
      "user-1"
    );
  });

  it("should throw ValidationError when token is not found", async () => {
    mockRepository.findPasswordResetToken.mockResolvedValue(null);

    const err = await service
      .resetPassword(validToken, validPassword)
      .catch((e) => e);
    expect(err).toHaveProperty("statusCode", 400);
  });

  it("should throw ValidationError when token was already used", async () => {
    mockRepository.findPasswordResetToken.mockResolvedValue({
      ...mockResetRecord,
      usedAt: new Date(),
    });

    const err = await service
      .resetPassword(validToken, validPassword)
      .catch((e) => e);
    expect(err).toHaveProperty("statusCode", 400);
    expect(mockRepository.markResetTokenUsed).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when token is expired", async () => {
    mockRepository.findPasswordResetToken.mockResolvedValue({
      ...mockResetRecord,
      expiresAt: pastDate,
    });

    const err = await service
      .resetPassword(validToken, validPassword)
      .catch((e) => e);
    expect(err).toHaveProperty("statusCode", 400);
    expect(mockRepository.markResetTokenUsed).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when user account is disabled", async () => {
    mockRepository.findPasswordResetToken.mockResolvedValue(mockResetRecord);
    mockRepository.findById.mockResolvedValue({ ...mockUser, isActive: false });

    const err = await service
      .resetPassword(validToken, validPassword)
      .catch((e) => e);
    expect(err).toHaveProperty("statusCode", 400);
    expect(mockRepository.updatePassword).not.toHaveBeenCalled();
  });

  it("should revoke all refresh tokens after reset", async () => {
    mockRepository.findPasswordResetToken.mockResolvedValue(mockResetRecord);
    mockRepository.findById.mockResolvedValue(mockUser);

    await service.resetPassword(validToken, validPassword);

    expect(mockRepository.revokeUserRefreshTokens).toHaveBeenCalledWith(
      "user-1"
    );
  });

  it("should accept ipAddress and userAgent", async () => {
    mockRepository.findPasswordResetToken.mockResolvedValue(mockResetRecord);
    mockRepository.findById.mockResolvedValue(mockUser);

    await service.resetPassword(
      validToken,
      validPassword,
      "10.0.0.1",
      "TestBrowser"
    );

    expect(mockRepository.updatePassword).toHaveBeenCalled();
  });

  it("should throw ValidationError with weak password", async () => {
    const err = await service
      .resetPassword(validToken, "short")
      .catch((e) => e);
    expect(err).toHaveProperty("statusCode", 400);
    expect(mockRepository.findPasswordResetToken).not.toHaveBeenCalled();
  });
});

describe("AuthService.changePassword", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  const userId = "user-1";
  const currentPassword = "OldPass1!";
  const newPassword = "NewPass1!";

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new AuthService(mockRepository as any);
  });

  it("should change password successfully", async () => {
    mockRepository.findById.mockResolvedValue(mockUser);
    (verifyPassword as any).mockResolvedValue(true);

    await service.changePassword(userId, currentPassword, newPassword);

    expect(mockRepository.updatePassword).toHaveBeenCalledWith(
      userId,
      expect.any(String)
    );
    expect(mockRepository.revokeUserRefreshTokens).toHaveBeenCalledWith(userId);
  });

  it("should throw UnauthorizedError when user is not found", async () => {
    mockRepository.findById.mockResolvedValue(null);

    const err = await service
      .changePassword(userId, currentPassword, newPassword)
      .catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(mockRepository.updatePassword).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when account is disabled", async () => {
    mockRepository.findById.mockResolvedValue({ ...mockUser, isActive: false });

    const err = await service
      .changePassword(userId, currentPassword, newPassword)
      .catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(mockRepository.updatePassword).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError with wrong current password", async () => {
    mockRepository.findById.mockResolvedValue(mockUser);
    (verifyPassword as any).mockResolvedValue(false);

    const err = await service
      .changePassword(userId, currentPassword, newPassword)
      .catch((e) => e);
    expect(err).toHaveProperty("statusCode", 401);
    expect(mockRepository.updatePassword).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when new password is same as current", async () => {
    mockRepository.findById.mockResolvedValue(mockUser);
    (verifyPassword as any).mockResolvedValue(true);

    const err = await service
      .changePassword(userId, currentPassword, currentPassword)
      .catch((e) => e);
    expect(err).toHaveProperty("statusCode", 400);
    expect(mockRepository.updatePassword).not.toHaveBeenCalled();
  });

  it("should revoke all refresh tokens after change", async () => {
    mockRepository.findById.mockResolvedValue(mockUser);
    (verifyPassword as any).mockResolvedValue(true);

    await service.changePassword(userId, currentPassword, newPassword);

    expect(mockRepository.revokeUserRefreshTokens).toHaveBeenCalledWith(userId);
  });

  it("should accept ipAddress and userAgent", async () => {
    mockRepository.findById.mockResolvedValue(mockUser);
    (verifyPassword as any).mockResolvedValue(true);

    await service.changePassword(
      userId,
      currentPassword,
      newPassword,
      "10.0.0.1",
      "TestBrowser"
    );

    expect(mockRepository.updatePassword).toHaveBeenCalled();
  });
});

describe("AuthService.verifyEmail", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  const validToken = "valid-verification-token";
  const futureDate = new Date(Date.now() + 86400000);
  const pastDate = new Date(Date.now() - 86400000);

  const mockVerificationRecord = {
    id: "verification-1",
    userId: "user-1",
    tokenHash: "valid-verification-token",
    expiresAt: futureDate,
    usedAt: null,
    createdAt: new Date(),
  };

  const mockUnverifiedUser = {
    ...mockUser,
    isVerified: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new AuthService(mockRepository as any);
  });

  it("should verify email successfully", async () => {
    mockRepository.findVerificationToken.mockResolvedValue(mockVerificationRecord);
    mockRepository.findById.mockResolvedValue(mockUnverifiedUser);

    await service.verifyEmail(validToken);

    expect(mockRepository.verifyUserEmail).toHaveBeenCalledWith("user-1");
    expect(mockRepository.markVerificationTokenUsed).toHaveBeenCalledWith("verification-1");
  });

  it("should throw ValidationError when token is not found", async () => {
    mockRepository.findVerificationToken.mockResolvedValue(null);

    const err = await service.verifyEmail(validToken).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 400);
    expect(mockRepository.verifyUserEmail).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when token was already used", async () => {
    mockRepository.findVerificationToken.mockResolvedValue({
      ...mockVerificationRecord,
      usedAt: new Date(),
    });

    const err = await service.verifyEmail(validToken).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 400);
    expect(mockRepository.verifyUserEmail).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when token is expired", async () => {
    mockRepository.findVerificationToken.mockResolvedValue({
      ...mockVerificationRecord,
      expiresAt: pastDate,
    });

    const err = await service.verifyEmail(validToken).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 400);
    expect(mockRepository.verifyUserEmail).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when user account is disabled", async () => {
    mockRepository.findVerificationToken.mockResolvedValue(mockVerificationRecord);
    mockRepository.findById.mockResolvedValue({ ...mockUnverifiedUser, isActive: false });

    const err = await service.verifyEmail(validToken).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 400);
    expect(mockRepository.verifyUserEmail).not.toHaveBeenCalled();
  });

  it("should throw ValidationError when email is already verified", async () => {
    mockRepository.findVerificationToken.mockResolvedValue(mockVerificationRecord);
    mockRepository.findById.mockResolvedValue(mockUser);

    const err = await service.verifyEmail(validToken).catch((e) => e);
    expect(err).toHaveProperty("statusCode", 400);
    expect(mockRepository.verifyUserEmail).not.toHaveBeenCalled();
  });

  it("should accept ipAddress for audit logging", async () => {
    mockRepository.findVerificationToken.mockResolvedValue(mockVerificationRecord);
    mockRepository.findById.mockResolvedValue(mockUnverifiedUser);

    await service.verifyEmail(validToken, "10.0.0.1");

    expect(mockRepository.verifyUserEmail).toHaveBeenCalledWith("user-1");
  });
});

describe("AuthService.resendVerificationEmail", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;
  let emailService: any;

  const testEmail = "unverified@tableflow.io";

  beforeAll(async () => {
    const mod = await import("../shared/email.service.js");
    emailService = mod.emailService;
  });

  const mockUnverifiedUser = {
    ...mockUser,
    isVerified: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new AuthService(mockRepository as any);
  });

  it("should send verification email for unverified active user", async () => {
    mockRepository.findByEmail.mockResolvedValue(mockUnverifiedUser);

    const result = await service.resendVerificationEmail(testEmail);

    expect(result.message).toContain("verification email has been sent");
    expect(
      mockRepository.invalidateVerificationTokens
    ).toHaveBeenCalledWith(mockUnverifiedUser.id);
    expect(
      mockRepository.createVerificationToken
    ).toHaveBeenCalledWith(
      mockUnverifiedUser.id,
      "verification-token",
      expect.any(Date)
    );
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      mockUnverifiedUser.email,
      "verification-token"
    );
  });

  it("should return generic message for unknown email", async () => {
    mockRepository.findByEmail.mockResolvedValue(null);

    const result = await service.resendVerificationEmail(testEmail);

    expect(result.message).toContain("verification email has been sent");
    expect(
      mockRepository.createVerificationToken
    ).not.toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("should return generic message for disabled account", async () => {
    mockRepository.findByEmail.mockResolvedValue({
      ...mockUnverifiedUser,
      isActive: false,
    });

    const result = await service.resendVerificationEmail(testEmail);

    expect(result.message).toContain("verification email has been sent");
    expect(
      mockRepository.createVerificationToken
    ).not.toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("should return generic message for already verified account", async () => {
    mockRepository.findByEmail.mockResolvedValue(mockUser);

    const result = await service.resendVerificationEmail(testEmail);

    expect(result.message).toContain("verification email has been sent");
    expect(
      mockRepository.createVerificationToken
    ).not.toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("should invalidate existing active tokens before creating new one", async () => {
    mockRepository.findByEmail.mockResolvedValue(mockUnverifiedUser);

    await service.resendVerificationEmail(testEmail);

    expect(
      mockRepository.invalidateVerificationTokens
    ).toHaveBeenCalledWith(mockUnverifiedUser.id);
  });

  it("should accept ipAddress for audit trail", async () => {
    mockRepository.findByEmail.mockResolvedValue(mockUnverifiedUser);

    await service.resendVerificationEmail(testEmail, "192.168.1.1");

    expect(
      mockRepository.createVerificationToken
    ).toHaveBeenCalledWith(
      mockUnverifiedUser.id,
      "verification-token",
      expect.any(Date)
    );
  });
});

describe("AuthService.getSessions", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  const futureDate = new Date(Date.now() + 86400000);
  const pastDate = new Date(Date.now() - 86400000);

  const mockTokens = [
    {
      id: "session-1",
      userId: "user-1",
      tokenHash: "hash-1",
      accessTokenJti: "jti-1",
      ipAddress: "10.0.0.1",
      userAgent: "Mozilla/5.0 Chrome/120",
      expiresAt: futureDate,
      isRevoked: false,
      createdAt: new Date(),
    },
    {
      id: "session-2",
      userId: "user-1",
      tokenHash: "hash-2",
      accessTokenJti: null,
      ipAddress: "10.0.0.2",
      userAgent: "Mozilla/5.0 Firefox/121",
      expiresAt: futureDate,
      isRevoked: true,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new AuthService(mockRepository as any);
  });

  it("should return active sessions with device info", async () => {
    mockRepository.getUserSessions.mockResolvedValue(mockTokens);
    mockRepository.findRefreshTokenByAccessJti.mockResolvedValue(mockTokens[0]);

    const result = await service.getSessions("user-1", "jti-1");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: "session-1",
      ipAddress: "10.0.0.1",
      userAgent: "Mozilla/5.0 Chrome/120",
      isCurrent: true,
    });
    expect(result[1]).toMatchObject({
      id: "session-2",
      isCurrent: false,
    });
  });

  it("should filter out expired sessions", async () => {
    const expiredToken = { ...mockTokens[0], expiresAt: pastDate };
    mockRepository.getUserSessions.mockResolvedValue([expiredToken, mockTokens[1]]);
    mockRepository.findRefreshTokenByAccessJti.mockResolvedValue(null);

    const result = await service.getSessions("user-1", "jti-1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("session-2");
  });
});

describe("AuthService.getCurrentSession", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  const futureDate = new Date(Date.now() + 86400000);

  const mockToken = {
    id: "session-current",
    userId: "user-1",
    tokenHash: "hash-current",
    accessTokenJti: "jti-current",
    ipAddress: "10.0.0.1",
    userAgent: "Mozilla/5.0 Chrome/120",
    expiresAt: futureDate,
    isRevoked: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new AuthService(mockRepository as any);
  });

  it("should return current session", async () => {
    mockRepository.findRefreshTokenByAccessJti.mockResolvedValue(mockToken);

    const result = await service.getCurrentSession("user-1", "jti-current");

    expect(result).toMatchObject({
      id: "session-current",
      ipAddress: "10.0.0.1",
      userAgent: "Mozilla/5.0 Chrome/120",
      isCurrent: true,
    });
  });

  it("should return null when session belongs to different user", async () => {
    mockRepository.findRefreshTokenByAccessJti.mockResolvedValue({
      ...mockToken,
      userId: "user-2",
    });

    const result = await service.getCurrentSession("user-1", "jti-current");

    expect(result).toBeNull();
  });

  it("should return null when no session found", async () => {
    mockRepository.findRefreshTokenByAccessJti.mockResolvedValue(null);

    const result = await service.getCurrentSession("user-1", "jti-current");

    expect(result).toBeNull();
  });
});

describe("AuthService.revokeSession", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  const mockToken = {
    id: "session-to-revoke",
    userId: "user-1",
    ipAddress: "10.0.0.1",
    userAgent: "Mozilla/5.0",
    expiresAt: new Date(Date.now() + 86400000),
    isRevoked: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new AuthService(mockRepository as any);
  });

  it("should revoke session successfully", async () => {
    mockRepository.findRefreshTokenById.mockResolvedValue(mockToken);

    await service.revokeSession("session-to-revoke", "user-1");

    expect(mockRepository.revokeRefreshToken).toHaveBeenCalledWith("session-to-revoke");
  });

  it("should throw AppError when session not found", async () => {
    mockRepository.findRefreshTokenById.mockResolvedValue(null);

    const err = await service.revokeSession("unknown", "user-1").catch((e) => e);
    expect(err).toHaveProperty("statusCode", 404);
    expect(mockRepository.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it("should throw AppError when session belongs to different user", async () => {
    mockRepository.findRefreshTokenById.mockResolvedValue({
      ...mockToken,
      userId: "user-2",
    });

    const err = await service.revokeSession("session-to-revoke", "user-1").catch((e) => e);
    expect(err).toHaveProperty("statusCode", 404);
    expect(mockRepository.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it("should not throw when session already revoked (idempotent)", async () => {
    mockRepository.findRefreshTokenById.mockResolvedValue({
      ...mockToken,
      isRevoked: true,
    });

    await expect(
      service.revokeSession("session-to-revoke", "user-1")
    ).resolves.toBeUndefined();
    expect(mockRepository.revokeRefreshToken).not.toHaveBeenCalled();
  });
});

describe("AuthService.unlockUserAccount", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new AuthService(mockRepository as any);
  });

  it("should unlock a locked account", async () => {
    mockRepository.findById.mockResolvedValue({
      ...mockUser,
      lockedUntil: new Date(Date.now() + 3600000),
      failedLoginAttempts: 5,
    });

    await service.unlockUserAccount("user-1", "admin-1");

    expect(mockRepository.unlockUserAccount).toHaveBeenCalledWith("user-1");
  });

  it("should throw AppError when target user not found", async () => {
    mockRepository.findById.mockResolvedValue(null);

    const err = await service
      .unlockUserAccount("nonexistent", "admin-1")
      .catch((e) => e);

    expect(err).toHaveProperty("statusCode", 404);
    expect(mockRepository.unlockUserAccount).not.toHaveBeenCalled();
  });

  it("should not throw when account is already unlocked", async () => {
    mockRepository.findById.mockResolvedValue({
      ...mockUser,
      lockedUntil: null,
      failedLoginAttempts: 0,
    });

    await expect(
      service.unlockUserAccount("user-1", "admin-1")
    ).resolves.toBeUndefined();
    expect(mockRepository.unlockUserAccount).not.toHaveBeenCalled();
  });
});
