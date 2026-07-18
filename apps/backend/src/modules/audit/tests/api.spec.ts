import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Express } from "express";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../config/database.js";
import { APP } from "../../../config/constants.js";
import {
  requestId,
  requestLogger,
  rateLimiter,
} from "../../../middlewares/index.js";
import { errorHandler } from "../../../middlewares/errorHandler.js";
import auditRouter from "../presentation/routes/audit.routes.js";
import { env } from "../../../config/env.js";

let app: Express;
let accessToken: string;
let testOrgId: string;
let testUserId: string;

const API = `${APP.API_PREFIX}/audit`;

beforeAll(async () => {
  testOrgId = crypto.randomUUID();

  await prisma.organization.create({
    data: {
      id: testOrgId,
      name: "Audit API Test Org",
      slug: `audit-api-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `audit-api-${Date.now()}@test.com`,
      timezone: "UTC",
    },
  });

  const role = await prisma.role.upsert({
    where: { code_restaurantId: { code: "super-admin", restaurantId: testOrgId } },
    update: {},
    create: {
      code: "super-admin",
      name: "Super Admin",
      description: "Test super admin",
      isSystem: true,
      isDefault: false,
      priority: 1000,
      restaurantId: testOrgId,
    },
  });

  const permission = await prisma.permission.upsert({
    where: { code: "audit.read" },
    update: {},
    create: {
      code: "audit.read",
      name: "View Audit Logs",
      description: "View audit log entries",
      module: "audit",
      resource: "audit",
      action: "read",
      riskLevel: "medium",
    },
  });

  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
    update: {},
    create: { roleId: role.id, permissionId: permission.id },
  });

  const passwordHash = await bcrypt.hash("Admin123!", 12);

  testUserId = crypto.randomUUID();
  await prisma.user.create({
    data: {
      id: testUserId,
      organizationId: testOrgId,
      email: `audit-api-user-${Date.now()}@test.com`,
      passwordHash,
      firstName: "Audit",
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
    {
      sub: testUserId,
      organizationId: testOrgId,
      role: "super-admin",
      jti: crypto.randomUUID(),
    },
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
  app.use(API, auditRouter);
  app.use(errorHandler);

  await prisma.auditEntry.create({
    data: {
      id: crypto.randomUUID(),
      organizationId: testOrgId,
      module: "restaurant",
      entityType: "restaurant",
      entityId: crypto.randomUUID(),
      action: "create",
      performedBy: testUserId,
      restaurantId: testOrgId,
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
      requestId: "seed-req-1",
    },
  });
});

afterAll(async () => {
  if (testOrgId) {
    await prisma.auditEntry.deleteMany({ where: { organizationId: testOrgId } }).catch(() => {});
    await prisma.rolePermission.deleteMany({
      where: { role: { restaurantId: testOrgId } },
    }).catch(() => {});
    await prisma.userRole.deleteMany({ where: { restaurantId: testOrgId } }).catch(() => {});
    await prisma.role.deleteMany({ where: { restaurantId: testOrgId } }).catch(() => {});
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await prisma.organization.delete({ where: { id: testOrgId } }).catch(() => {});
  }
});

describe("GET /api/v1/audit", () => {
  it("returns paginated audit entries", async () => {
    const res = await request(app)
      .get(API)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.timestamp).toBe("string");
  });

  it("filters by module", async () => {
    const res = await request(app)
      .get(`${API}?module=restaurant`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    for (const entry of res.body.data) {
      expect(entry.module).toBe("restaurant");
    }
  });

  it("filters by action", async () => {
    const res = await request(app)
      .get(`${API}?action=create`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    for (const entry of res.body.data) {
      expect(entry.action).toBe("create");
    }
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .get(API)
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toMatch(/^auth\./);
    expect(typeof res.body.error.timestamp).toBe("string");
    expect(typeof res.body.error.path).toBe("string");
    expect(typeof res.body.error.correlationId).toBe("string");
    expect(typeof res.body.timestamp).toBe("string");
  });

  it("supports pagination", async () => {
    const res = await request(app)
      .get(`${API}?page=1&limit=1`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(1);
  });
});

describe("GET /api/v1/audit/:id", () => {
  let createdId: string;

  beforeAll(async () => {
    const res = await request(app)
      .get(API)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    createdId = res.body.data[0].id;
  });

  it("returns a single audit entry by ID", async () => {
    const res = await request(app)
      .get(`${API}/${createdId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdId);
    expect(typeof res.body.timestamp).toBe("string");
  });

  it("returns 404 for non-existent entry", async () => {
    const fakeId = crypto.randomUUID();
    const res = await request(app)
      .get(`${API}/${fakeId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toMatch(/^audit_entry\./);
    expect(typeof res.body.error.timestamp).toBe("string");
    expect(typeof res.body.error.path).toBe("string");
    expect(typeof res.body.timestamp).toBe("string");
  });

  it("requires authentication", async () => {
    const fakeId = crypto.randomUUID();
    const res = await request(app)
      .get(`${API}/${fakeId}`)
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toMatch(/^auth\./);
    expect(typeof res.body.error.timestamp).toBe("string");
    expect(typeof res.body.error.path).toBe("string");
    expect(typeof res.body.timestamp).toBe("string");
  });
});
