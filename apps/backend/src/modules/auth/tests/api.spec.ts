import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Express } from "express";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../config/database.js";
import { APP } from "../../../config/constants.js";
import { requestId, requestLogger, rateLimiter } from "../../../middlewares/index.js";
import { errorHandler } from "../../../middlewares/errorHandler.js";
import authRouter from "../auth.routes.js";
import { env } from "../../../config/env.js";

let app: Express;
let accessToken: string;
let refreshToken: string;
let testOrgId: string;
let testUserId: string;
let testUserEmail: string;
const testUserPassword = "Admin123!";

const API = `${APP.API_PREFIX}/auth`;

beforeAll(async () => {
  testOrgId = crypto.randomUUID();

  await prisma.organization.create({
    data: {
      id: testOrgId,
      name: "Auth API Test Org",
      slug: `auth-api-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `auth-api-${Date.now()}@test.com`,
      timezone: "UTC",
    },
  });

  const role = await prisma.role.upsert({
    where: { code_restaurantId: { code: "admin", restaurantId: testOrgId } },
    update: {},
    create: {
      code: "admin",
      name: "Admin",
      description: "Test admin role",
      isSystem: true,
      isDefault: false,
      priority: 500,
      restaurantId: testOrgId,
    },
  });

  const passwordHash = await bcrypt.hash("Admin123!", 12);

  testUserEmail = `auth-api-user-${Date.now()}@test.com`;
  testUserId = crypto.randomUUID();
  await prisma.user.create({
    data: {
      id: testUserId,
      organizationId: testOrgId,
      email: testUserEmail,
      passwordHash,
      firstName: "Auth",
      lastName: "Tester",
      isActive: true,
      isVerified: true,
    },
  });

  await prisma.userRole.create({
    data: {
      userId: testUserId,
      roleId: role.id,
      restaurantId: testOrgId,
      assignedBy: testUserId,
    },
  });

  accessToken = jwt.sign(
    { sub: testUserId, organizationId: testOrgId, role: "admin", jti: crypto.randomUUID() },
    env.JWT_SECRET,
    { expiresIn: "15m" },
  );

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
    }),
  );
  app.use(API, authRouter);
  app.use(errorHandler);
});

afterAll(async () => {
  if (testOrgId) {
    await prisma.refreshToken.deleteMany({ where: { userId: testUserId } }).catch(() => {});
    await prisma.userRole.deleteMany({ where: { restaurantId: testOrgId } }).catch(() => {});
    await prisma.role.deleteMany({ where: { restaurantId: testOrgId } }).catch(() => {});
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await prisma.organization.delete({ where: { id: testOrgId } }).catch(() => {});
  }
});

describe("POST /api/v1/auth/login", () => {
  it("returns 200 with LoginResponse for valid credentials", async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.expiresIn).toBeGreaterThan(0);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toContain("@");
    expect(res.body.data.user.role).toBe("Admin");
    expect(typeof res.body.timestamp).toBe("string");

    refreshToken = res.body.data.refreshToken;
  });

  it("returns 401 for invalid password", async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: testUserEmail, password: "WrongPass1!" })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("auth.invalid_credentials");
    expect(typeof res.body.error.timestamp).toBe("string");
    expect(typeof res.body.error.path).toBe("string");
    expect(typeof res.body.error.correlationId).toBe("string");
    expect(typeof res.body.timestamp).toBe("string");
  });

  it("returns 401 for non-existent email", async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: "nonexistent@test.com", password: "Admin123!" })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("auth.invalid_credentials");
  });

  it("returns 400 for missing email", async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send({ password: "Admin123!" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("validation.failed");
  });

  it("returns 400 for missing password", async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: "test@test.com" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("validation.failed");
  });
});

describe("POST /api/v1/auth/refresh", () => {
  it("returns 200 with new tokens for a valid refresh token", async () => {
    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(200);

    const validRefreshToken = loginRes.body.data.refreshToken;

    const res = await request(app)
      .post(`${API}/refresh`)
      .send({ refreshToken: validRefreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(validRefreshToken);
    expect(res.body.data.expiresIn).toBeGreaterThan(0);
    expect(res.body.data.user).toBeDefined();
    expect(typeof res.body.timestamp).toBe("string");

    refreshToken = res.body.data.refreshToken;
    accessToken = res.body.data.accessToken;
  });

  it("returns 401 for an invalid refresh token", async () => {
    const res = await request(app)
      .post(`${API}/refresh`)
      .send({ refreshToken: "invalid.jwt.token" })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toMatch(/^auth\./);
  });

  it("returns 400 for missing refresh token", async () => {
    const res = await request(app)
      .post(`${API}/refresh`)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("validation.failed");
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("returns 204 for valid logout", async () => {
    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(200);

    const token = loginRes.body.data.refreshToken;

    const res = await request(app)
      .post(`${API}/logout`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken: token })
      .expect(204);

    expect(res.noContent).toBe(true);
    expect(res.body).toEqual({});
  });

  it("returns 204 idempotent for already revoked token", async () => {
    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(200);

    const token = loginRes.body.data.refreshToken;

    await request(app)
      .post(`${API}/logout`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken: token })
      .expect(204);

    await request(app)
      .post(`${API}/logout`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken: token })
      .expect(204);
  });

  it("returns 401 without auth header", async () => {
    const res = await request(app)
      .post(`${API}/logout`)
      .send({ refreshToken: "some-token" })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toMatch(/^auth\./);
  });
});

describe("Protected endpoints", () => {
  it("GET /auth/sessions returns 401 without token", async () => {
    const res = await request(app)
      .get(`${API}/sessions`)
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toMatch(/^auth\./);
    expect(typeof res.body.error.timestamp).toBe("string");
    expect(typeof res.body.error.path).toBe("string");
    expect(typeof res.body.error.correlationId).toBe("string");
    expect(typeof res.body.timestamp).toBe("string");
  });

  it("GET /auth/sessions returns 200 with valid token", async () => {
    const res = await request(app)
      .get(`${API}/sessions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.timestamp).toBe("string");
  });

  it("GET /auth/sessions/current returns 401 without token", async () => {
    const res = await request(app)
      .get(`${API}/sessions/current`)
      .expect(401);

    expect(res.body.error.code).toMatch(/^auth\./);
  });

  it("returns 401 with expired token", async () => {
    const expiredToken = jwt.sign(
      { sub: testUserId, organizationId: testOrgId, role: "admin", jti: crypto.randomUUID() },
      env.JWT_SECRET,
      { expiresIn: "0s" },
    );

    const res = await request(app)
      .get(`${API}/sessions`)
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("auth.token.expired");
  });

  it("returns 401 with tampered token", async () => {
    const tamperedToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0YW1wZXJlZCJ9.tampered";
    const res = await request(app)
      .get(`${API}/sessions`)
      .set("Authorization", `Bearer ${tamperedToken}`)
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("auth.token.invalid");
  });

  it("returns 401 with missing Bearer prefix", async () => {
    const res = await request(app)
      .get(`${API}/sessions`)
      .set("Authorization", accessToken)
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("auth.token.missing");
  });
});
