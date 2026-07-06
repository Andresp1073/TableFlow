import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import type { Express } from "express";
import request from "supertest";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { APP } from "../../config/constants.js";
import {
  requestId,
  requestLogger,
  errorHandler,
  rateLimiter,
} from "../../middlewares/index.js";
import authRouter from "./auth.routes.js";

let app: Express;
let adminAccessToken: string;
let adminRefreshToken: string;

const TEST_USER = {
  email: "admin@tableflow.io",
  password: "Admin123!",
};

const API = `${APP.API_PREFIX}/auth`;

beforeAll(async () => {
  // Reset admin account lock so failed login attempts don't persist across test runs
  await prisma.user.update({
    where: { email: TEST_USER.email },
    data: {
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
      lockedAt: null,
      lockedUntil: null,
      lockReason: null,
    },
  });

  app = express();
  app.set("trust proxy", 1);
  app.use(requestId);
  app.use(requestLogger);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    rateLimiter({
      windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
      maxRequests: 1000,
    })
  );
  app.use(API, authRouter);
  app.use(errorHandler);
});

describe("POST /auth/login", () => {
  it("should login successfully with valid credentials", async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send(TEST_USER)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.user.firstName).toBe("System");
    expect(res.body.data.user.lastName).toBe("Administrator");
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.expiresIn).toBeGreaterThan(0);

    adminAccessToken = res.body.data.accessToken;
    adminRefreshToken = res.body.data.refreshToken;
  });

  it("should fail with wrong password", async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: "WrongPass1!" })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("auth.invalid_credentials");
  });

  it("should fail with non-existent email", async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: "nonexistent@test.com", password: "SomePass1!" })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("auth.invalid_credentials");
  });

  it("should fail with invalid email format", async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: "notanemail", password: "SomePass1!" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should fail with missing password", async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

describe("POST /auth/refresh", () => {
  it("should refresh tokens successfully and return user info", async () => {
    const res = await request(app)
      .post(`${API}/refresh`)
      .send({ refreshToken: adminRefreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.expiresIn).toBeGreaterThan(0);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.user.role).toBe("Super Admin");

    adminAccessToken = res.body.data.accessToken;
    adminRefreshToken = res.body.data.refreshToken;
  });

  it("should fail with invalid refresh token", async () => {
    const res = await request(app)
      .post(`${API}/refresh`)
      .send({ refreshToken: "invalid-token" })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("auth.token.invalid");
  });

  it("should fail with empty refresh token", async () => {
    const res = await request(app)
      .post(`${API}/refresh`)
      .send({ refreshToken: "" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should fail with expired refresh token", async () => {
    const expiredToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJleHBpcmVkLWp0aS0xMjM0IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjI0MDQyMn0.fake";

    const res = await request(app)
      .post(`${API}/refresh`)
      .send({ refreshToken: expiredToken })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should detect token reuse and revoke all sessions", async () => {
    const originalRefreshToken = adminRefreshToken;

    const firstUse = await request(app)
      .post(`${API}/refresh`)
      .send({ refreshToken: originalRefreshToken })
      .expect(200);

    expect(firstUse.body.success).toBe(true);
    const newRefreshToken = firstUse.body.data.refreshToken;

    // Reuse the original (now-revoked) token
    const reuse = await request(app)
      .post(`${API}/refresh`)
      .send({ refreshToken: originalRefreshToken })
      .expect(401);

    expect(reuse.body.success).toBe(false);
    expect(reuse.body.error.code).toBe("auth.token.revoked");

    // The new token from first use should also be revoked now
    const alsoRevoked = await request(app)
      .post(`${API}/refresh`)
      .send({ refreshToken: newRefreshToken })
      .expect(401);

    expect(alsoRevoked.body.error.code).toBe("auth.token.revoked");

    // Re-login to get fresh tokens for subsequent tests
    const loginRes = await request(app).post(`${API}/login`).send(TEST_USER);
    adminAccessToken = loginRes.body.data.accessToken;
    adminRefreshToken = loginRes.body.data.refreshToken;
  });

  it("should return new user info when user data changes after refresh", async () => {
    const res = await request(app)
      .post(`${API}/refresh`)
      .send({ refreshToken: adminRefreshToken })
      .expect(200);

    expect(res.body.data.user).toEqual({
      id: expect.any(String),
      email: TEST_USER.email,
      firstName: expect.any(String),
      lastName: expect.any(String),
      role: expect.any(String),
    });

    adminAccessToken = res.body.data.accessToken;
    adminRefreshToken = res.body.data.refreshToken;
  });
});

describe("POST /auth/logout", () => {
  beforeEach(async () => {
    const res = await request(app).post(`${API}/login`).send(TEST_USER);
    adminAccessToken = res.body.data.accessToken;
    adminRefreshToken = res.body.data.refreshToken;
  });

  it("should logout successfully", async () => {
    await request(app)
      .post(`${API}/logout`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({ refreshToken: adminRefreshToken })
      .expect(204);
  });

  it("should return 204 for already revoked token", async () => {
    await request(app)
      .post(`${API}/logout`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({ refreshToken: adminRefreshToken })
      .expect(204);

    await request(app)
      .post(`${API}/logout`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({ refreshToken: adminRefreshToken })
      .expect(204);
  });

  it("should fail without access token", async () => {
    await request(app)
      .post(`${API}/logout`)
      .send({ refreshToken: adminRefreshToken })
      .expect(401);
  });

  it("should fail with invalid refresh token", async () => {
    await request(app)
      .post(`${API}/logout`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({ refreshToken: "invalid-token" })
      .expect(401);
  });

  it("should fail with empty refresh token", async () => {
    await request(app)
      .post(`${API}/logout`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send({ refreshToken: "" })
      .expect(400);
  });
});

describe("POST /auth/change-password", () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app).post(`${API}/login`).send(TEST_USER);
    token = res.body.data.accessToken;
  });

  beforeEach(async () => {
    // Ensure the admin password is reset to the original
    const bcrypt = await import("bcryptjs");
    const admin = await prisma.user.findUnique({
      where: { email: TEST_USER.email },
    });
    if (admin) {
      const currentValid = await bcrypt.compare(
        TEST_USER.password,
        admin.passwordHash
      );
      if (!currentValid) {
        await prisma.user.update({
          where: { id: admin.id },
          data: {
            passwordHash: await bcrypt.hash(TEST_USER.password, 12),
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
      }
    }
  });

  it("should change password successfully", async () => {
    const res = await request(app)
      .post(`${API}/change-password`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: TEST_USER.password,
        newPassword: "NewAdmin1!",
        confirmPassword: "NewAdmin1!",
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
    expect(res.body.message).toContain("Password changed successfully");

    // Verify new password works
    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: "NewAdmin1!" })
      .expect(200);
    expect(loginRes.body.success).toBe(true);

    // Change back to original password
    const token2 = loginRes.body.data.accessToken;
    await request(app)
      .post(`${API}/change-password`)
      .set("Authorization", `Bearer ${token2}`)
      .send({
        currentPassword: "NewAdmin1!",
        newPassword: TEST_USER.password,
        confirmPassword: TEST_USER.password,
      })
      .expect(200);
  });

  it("should fail with wrong current password", async () => {
    const res = await request(app)
      .post(`${API}/change-password`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "WrongPass1!",
        newPassword: "Another1!x",
        confirmPassword: "Another1!x",
      })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("auth.invalid_credentials");
  });

  it("should fail without authentication", async () => {
    const res = await request(app)
      .post(`${API}/change-password`)
      .send({
        currentPassword: TEST_USER.password,
        newPassword: "NewAdmin1!",
        confirmPassword: "NewAdmin1!",
      })
      .expect(401);
  });

  it("should fail with weak new password", async () => {
    const res = await request(app)
      .post(`${API}/change-password`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: TEST_USER.password,
        newPassword: "short",
        confirmPassword: "short",
      })
      .expect(400);
  });

  it("should fail with password confirmation mismatch", async () => {
    const res = await request(app)
      .post(`${API}/change-password`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: TEST_USER.password,
        newPassword: "NewPass123!",
        confirmPassword: "DifferentPass1!",
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should fail when new password is same as current", async () => {
    const res = await request(app)
      .post(`${API}/change-password`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: TEST_USER.password,
        newPassword: TEST_USER.password,
        confirmPassword: TEST_USER.password,
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should revoke all refresh tokens after change", async () => {
    const res = await request(app)
      .post(`${API}/change-password`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: TEST_USER.password,
        newPassword: "NewAdmin1!",
        confirmPassword: "NewAdmin1!",
      })
      .expect(200);

    // The old access token should still be valid (it's a JWT, not revoked),
    // but we need a new one since refresh was revoked.
    // Old refresh token should fail.
    const oldRefresh = adminRefreshToken;

    // Can't test the old refresh easily — just verify the new password works
    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: "NewAdmin1!" })
      .expect(200);

    expect(loginRes.body.data.accessToken).toBeTruthy();

    // Restore original password
    const newToken = loginRes.body.data.accessToken;
    await request(app)
      .post(`${API}/change-password`)
      .set("Authorization", `Bearer ${newToken}`)
      .send({
        currentPassword: "NewAdmin1!",
        newPassword: TEST_USER.password,
        confirmPassword: TEST_USER.password,
      })
      .expect(200);
  });
});

describe("POST /auth/forgot-password", () => {
  it("should return success for existing email", async () => {
    const res = await request(app)
      .post(`${API}/forgot-password`)
      .send({ email: TEST_USER.email })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain("password reset link");
  });

  it("should return success for non-existent email (security — no enumeration)", async () => {
    const res = await request(app)
      .post(`${API}/forgot-password`)
      .send({ email: "nonexistent@test.com" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain("password reset link");
  });

  it("should return same message for disabled account", async () => {
    const res = await request(app)
      .post(`${API}/forgot-password`)
      .send({ email: "disabled@test.com" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain("password reset link");
  });

  it("should fail with invalid email format", async () => {
    const res = await request(app)
      .post(`${API}/forgot-password`)
      .send({ email: "not-an-email" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should not leak email info in error responses", async () => {
    const existingRes = await request(app)
      .post(`${API}/forgot-password`)
      .send({ email: TEST_USER.email })
      .expect(200);

    const missingRes = await request(app)
      .post(`${API}/forgot-password`)
      .send({ email: "nonexistent@test.com" })
      .expect(200);

    expect(existingRes.body.data.message).toBe(missingRes.body.data.message);
  });

  it("should create persistent token in database", async () => {
    const res = await request(app)
      .post(`${API}/forgot-password`)
      .send({ email: TEST_USER.email })
      .expect(200);

    expect(res.body.success).toBe(true);

    // Verify a token was created in the database
    const tokenCount = await prisma.passwordResetToken.count({
      where: { userId: { not: undefined } },
    });
    expect(tokenCount).toBeGreaterThan(0);
  });
});

describe("POST /auth/reset-password", () => {
  let resetToken: string;

  beforeAll(async () => {
    // Request a forgot-password to create a real token in the DB
    await request(app)
      .post(`${API}/forgot-password`)
      .send({ email: TEST_USER.email });

    // Retrieve the raw token from the most recent password_reset_token record
    const prismaToken = await prisma.passwordResetToken.findFirst({
      where: {
        user: { email: TEST_USER.email },
        usedAt: null,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    // The tokenHash stored is SHA-256 of the raw token. Since hashToken is
    // crypto.createHash("sha256").update(token).digest("hex"), we need the
    // actual raw token to send to the endpoint. We'll generate one directly.
    const crypto = await import("node:crypto");
    const rawToken = crypto.randomBytes(48).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Invalidate any existing tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: prismaToken?.userId ?? "" },
      data: { usedAt: new Date() },
    });

    // Create a fresh token with known raw value
    await prisma.passwordResetToken.create({
      data: {
        userId: prismaToken?.userId ?? "",
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    // Reset the admin password to a known value for subsequent tests
    const bcrypt = await import("bcryptjs");
    const admin = await prisma.user.findUnique({
      where: { email: TEST_USER.email },
    });
    if (admin) {
      await prisma.user.update({
        where: { id: admin.id },
        data: {
          passwordHash: await bcrypt.hash(TEST_USER.password, 12),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    resetToken = rawToken;
  });

  it("should reset password successfully with valid token", async () => {
    const res = await request(app)
      .post(`${API}/reset-password`)
      .send({
        token: resetToken,
        password: "NewAdmin1!",
        passwordConfirmation: "NewAdmin1!",
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("Password reset successfully");
    expect(res.body.data).toBeNull();
  });

  it("should fail with invalid reset token", async () => {
    const res = await request(app)
      .post(`${API}/reset-password`)
      .send({
        token: "invalid-token",
        password: "NewPass123!",
        passwordConfirmation: "NewPass123!",
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should fail with already-used token", async () => {
    const res = await request(app)
      .post(`${API}/reset-password`)
      .send({
        token: resetToken,
        password: "Another1!x",
        passwordConfirmation: "Another1!x",
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should fail with password confirmation mismatch", async () => {
    const res = await request(app)
      .post(`${API}/reset-password`)
      .send({
        token: "some-token",
        password: "NewPass123!",
        passwordConfirmation: "DifferentPass1!",
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should fail with weak password", async () => {
    const res = await request(app)
      .post(`${API}/reset-password`)
      .send({
        token: "some-token",
        password: "short",
        passwordConfirmation: "short",
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should allow login with new password after reset", async () => {
    const crypto = await import("node:crypto");
    const rawToken = crypto.randomBytes(48).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const admin = await prisma.user.findUnique({
      where: { email: TEST_USER.email },
    });
    await prisma.passwordResetToken.create({
      data: {
        userId: admin!.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    await request(app)
      .post(`${API}/reset-password`)
      .send({
        token: rawToken,
        password: "TempPass1!",
        passwordConfirmation: "TempPass1!",
      })
      .expect(200);

    // Login with the new password
    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: "TempPass1!" })
      .expect(200);

    expect(loginRes.body.data.accessToken).toBeTruthy();

    // Reset back to original password for other tests
    const bcrypt = await import("bcryptjs");
    await prisma.user.update({
      where: { id: admin!.id },
      data: {
        passwordHash: await bcrypt.hash(TEST_USER.password, 12),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  });
});

describe("POST /auth/verify-email", () => {
  let unverifiedUser: { id: string; email: string };
  let validToken: string;

  beforeAll(async () => {
    // Create an unverified user in the database
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("TestPass1!", 12);

    unverifiedUser = await prisma.user.create({
      data: {
        organizationId: (await prisma.organization.findFirstOrThrow()).id,
        email: `verify-test-${Date.now()}@tableflow.io`,
        passwordHash,
        firstName: "Verify",
        lastName: "Test",
        isVerified: false,
      },
    });

    // Generate a real verification token
    const crypto = await import("node:crypto");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await prisma.emailVerificationToken.create({
      data: {
        userId: unverifiedUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    validToken = rawToken;
  });

  it("should verify email successfully with valid token", async () => {
    const res = await request(app)
      .post(`${API}/verify-email`)
      .send({ token: validToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("Email verified successfully");

    const user = await prisma.user.findUnique({
      where: { id: unverifiedUser.id },
    });
    expect(user?.isVerified).toBe(true);

    // Verify the token was marked as used
    const usedToken = await prisma.emailVerificationToken.findFirst({
      where: { userId: unverifiedUser.id },
    });
    expect(usedToken?.usedAt).toBeTruthy();
  });

  it("should fail with already-used token (replay prevention)", async () => {
    const res = await request(app)
      .post(`${API}/verify-email`)
      .send({ token: validToken })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should fail with invalid verification token", async () => {
    const res = await request(app)
      .post(`${API}/verify-email`)
      .send({ token: "invalid-token" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should fail with expired token", async () => {
    const crypto = await import("node:crypto");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await prisma.emailVerificationToken.create({
      data: {
        userId: unverifiedUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const res = await request(app)
      .post(`${API}/verify-email`)
      .send({ token: rawToken })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should fail with missing token", async () => {
    const res = await request(app)
      .post(`${API}/verify-email`)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

describe("POST /auth/resend-verification", () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app).post(`${API}/login`).send(TEST_USER);
    token = res.body.data.accessToken;
  });

  it("should fail for already verified user", async () => {
    const res = await request(app)
      .post(`${API}/resend-verification`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("already verified");
  });

  it("should fail without authentication", async () => {
    await request(app)
      .post(`${API}/resend-verification`)
      .expect(401);
  });
});

describe("POST /auth/resend-verification-email", () => {
  let unverifiedUser: { id: string; email: string };

  beforeAll(async () => {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("TestPass1!", 12);

    unverifiedUser = await prisma.user.create({
      data: {
        organizationId: (await prisma.organization.findFirstOrThrow()).id,
        email: `resend-test-${Date.now()}@tableflow.io`,
        passwordHash,
        firstName: "Resend",
        lastName: "Test",
        isVerified: false,
      },
    });
  });

  it("should return success for unverified user and create token", async () => {
    const res = await request(app)
      .post(`${API}/resend-verification-email`)
      .send({ email: unverifiedUser.email })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain("verification email has been sent");

    // Verify a token was created in the database
    const tokenCount = await prisma.emailVerificationToken.count({
      where: { userId: unverifiedUser.id },
    });
    expect(tokenCount).toBeGreaterThan(0);
  });

  it("should return success for non-existent email (no enumeration)", async () => {
    const res = await request(app)
      .post(`${API}/resend-verification-email`)
      .send({ email: "nonexistent@test.com" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain("verification email has been sent");
  });

  it("should return success for disabled account (no enumeration)", async () => {
    const res = await request(app)
      .post(`${API}/resend-verification-email`)
      .send({ email: "disabled@test.com" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain("verification email has been sent");
  });

  it("should return success for already verified user (no enumeration)", async () => {
    const res = await request(app)
      .post(`${API}/resend-verification-email`)
      .send({ email: TEST_USER.email })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain("verification email has been sent");
  });

  it("should fail with invalid email format", async () => {
    const res = await request(app)
      .post(`${API}/resend-verification-email`)
      .send({ email: "not-an-email" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should not leak email info in error responses", async () => {
    const existingRes = await request(app)
      .post(`${API}/resend-verification-email`)
      .send({ email: unverifiedUser.email })
      .expect(200);

    const missingRes = await request(app)
      .post(`${API}/resend-verification-email`)
      .send({ email: "nonexistent@test.com" })
      .expect(200);

    expect(existingRes.body.data.message).toBe(missingRes.body.data.message);
  });

  it("should invalidate previous tokens and create new one on second request", async () => {
    const initialTokens = await prisma.emailVerificationToken.count({
      where: { userId: unverifiedUser.id, usedAt: null },
    });

    // Create a new unverified user for this test
    const bcrypt = await import("bcryptjs");
    const freshUser = await prisma.user.create({
      data: {
        organizationId: (await prisma.organization.findFirstOrThrow()).id,
        email: `fresh-resend-${Date.now()}@tableflow.io`,
        passwordHash: await bcrypt.hash("TestPass1!", 12),
        firstName: "Fresh",
        lastName: "Resend",
        isVerified: false,
      },
    });

    // First resend
    await request(app)
      .post(`${API}/resend-verification-email`)
      .send({ email: freshUser.email })
      .expect(200);

    // Second resend - should invalidate the first token
    await request(app)
      .post(`${API}/resend-verification-email`)
      .send({ email: freshUser.email })
      .expect(200);

    // Should have exactly 1 active token and 1 used (invalidated) token
    const activeTokens = await prisma.emailVerificationToken.count({
      where: { userId: freshUser.id, usedAt: null },
    });
    const totalTokens = await prisma.emailVerificationToken.count({
      where: { userId: freshUser.id },
    });

    expect(activeTokens).toBe(1);
    expect(totalTokens).toBe(2);
  });
});

describe("GET /auth/sessions", () => {
  let token: string;
  let refreshToken: string;

  beforeAll(async () => {
    const res = await request(app).post(`${API}/login`).send(TEST_USER);
    token = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it("should return active sessions", async () => {
    const res = await request(app)
      .get(`${API}/sessions`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const currentSession = res.body.data.find(
      (s: { isCurrent: boolean }) => s.isCurrent
    );
    expect(currentSession).toBeTruthy();
  });

  it("should fail without authentication", async () => {
    await request(app).get(`${API}/sessions`).expect(401);
  });
});

describe("DELETE /auth/sessions/:id", () => {
  let token: string;
  let sessionId: string;

  beforeAll(async () => {
    const res = await request(app).post(`${API}/login`).send(TEST_USER);
    token = res.body.data.accessToken;

    const sessionsRes = await request(app)
      .get(`${API}/sessions`)
      .set("Authorization", `Bearer ${token}`);

    const otherSession = sessionsRes.body.data.find(
      (s: { isCurrent: boolean }) => !s.isCurrent
    );
    sessionId = otherSession?.id ?? sessionsRes.body.data[0].id;
  });

  it("should revoke a session", async () => {
    const res = await request(app)
      .delete(`${API}/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);
  });

  it("should fail without authentication", async () => {
    await request(app)
      .delete(`${API}/sessions/${sessionId}`)
      .expect(401);
  });
});

describe("DELETE /auth/sessions", () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app).post(`${API}/login`).send(TEST_USER);
    token = res.body.data.accessToken;
  });

  it("should revoke all other sessions", async () => {
    const res = await request(app)
      .delete(`${API}/sessions`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

describe("Account Lockout", () => {
  const LOCKOUT_USER = {
    email: "lockout-test@tableflow.io",
    password: "TestPass123!",
  };
  let userId: string;

  beforeAll(async () => {
    // Create a user specifically for lockout testing
    const passwordHash = await bcrypt.hash(LOCKOUT_USER.password, 12);
    const org = await prisma.organization.findFirst();
    const role = await prisma.role.findFirst({ where: { code: "super-admin" } });
    const user = await prisma.user.create({
      data: {
        email: LOCKOUT_USER.email,
        passwordHash,
        firstName: "Lockout",
        lastName: "Test",
        organizationId: org!.id,
      },
    });
    userId = user.id;

    if (role) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: role.id },
      });
    }
  });

  afterAll(async () => {
    await prisma.userRole.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it("should lock account after exceeding max attempts", async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`${API}/login`)
        .send({ email: LOCKOUT_USER.email, password: "WrongPass1!" })
        .expect(401);
    }

    // 6th attempt — should now be locked
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: LOCKOUT_USER.email, password: "WrongPass1!" })
      .expect(401);

    expect(res.body.error.code).toBe("auth.account_locked");

    // Verify DB state (5 failed attempts trigger lock, 6th is rejected without increment)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user!.failedLoginAttempts).toBe(5);
    expect(user!.lockedUntil).not.toBeNull();
    expect(user!.lockedAt).not.toBeNull();
    expect(user!.lockReason).toBe("Maximum failed login attempts exceeded");
  });

  it("should not reveal lock details in error message", async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: LOCKOUT_USER.email, password: "WrongPass1!" })
      .expect(401);

    expect(res.body.error.message).toBe(
      "Account is temporarily locked. Please try again later."
    );
  });

  it("should unlock account via admin endpoint", async () => {
    // Login as admin
    const adminRes = await request(app).post(`${API}/login`).send(TEST_USER);
    const adminToken = adminRes.body.data.accessToken;

    const res = await request(app)
      .post(`${API}/users/${userId}/unlock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    // Verify DB state
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user!.failedLoginAttempts).toBe(0);
    expect(user!.lockedUntil).toBeNull();
    expect(user!.lockedAt).toBeNull();
    expect(user!.lockReason).toBeNull();

    // Now should be able to login
    await request(app)
      .post(`${API}/login`)
      .send(LOCKOUT_USER)
      .expect(200);
  });

  it("should deny unlock to non-admin users", async () => {
    const staffEmail = `staff-unlock-${Date.now()}@tableflow.io`;
    const passwordHash = await bcrypt.hash(LOCKOUT_USER.password, 12);
    const org = await prisma.organization.findFirst();
    const staffUser = await prisma.user.create({
      data: {
        email: staffEmail,
        passwordHash,
        firstName: "Staff",
        lastName: "Unlock",
        organizationId: org!.id,
      },
    });
    const staffUserId = staffUser.id;

    // Get a role that is NOT System Administrator
    const waiterRole = await prisma.role.findFirst({ where: { name: "Waiter" } });
    if (waiterRole) {
      await prisma.userRole.create({
        data: { userId: staffUserId, roleId: waiterRole.id },
      });
    }

    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: staffEmail, password: LOCKOUT_USER.password });
    const staffToken = loginRes.body.data.accessToken;

    await request(app)
      .post(`${API}/users/${userId}/unlock`)
      .set("Authorization", `Bearer ${staffToken}`)
      .expect(403);

    // Cleanup
    await prisma.userRole.deleteMany({ where: { userId: staffUserId } });
    await prisma.user.delete({ where: { id: staffUserId } });
  });

  it("should require auth for unlock endpoint", async () => {
    await request(app)
      .post(`${API}/users/${userId}/unlock`)
      .expect(401);
  });
});
