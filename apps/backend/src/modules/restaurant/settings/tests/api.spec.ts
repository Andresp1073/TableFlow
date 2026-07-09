import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Express } from "express";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../../config/database.js";
import { APP } from "../../../../config/constants.js";
import {
  requestId,
  requestLogger,
  errorHandler,
  rateLimiter,
} from "../../../../middlewares/index.js";
import { errorHandler as authErrorHandler } from "../../../../middlewares/errorHandler.js";
import restaurantRouter from "../../presentation/routes/restaurant.routes.js";
import { env } from "../../../../config/env.js";

let app: Express;
let accessToken: string;
let testRestaurantId: string;
let testOrgId: string;
let testUserId: string;

const API = `${APP.API_PREFIX}/restaurants`;

beforeAll(async () => {
  testOrgId = crypto.randomUUID();

  await prisma.organization.create({
    data: {
      id: testOrgId,
      name: "Settings API Test Org",
      slug: `settings-api-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: "settings-api@test.com",
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

  const permissionCodes = [
    "restaurants.create",
    "restaurants.read",
    "restaurants.update",
    "restaurants.settings.read",
    "restaurants.settings.update",
  ];

  const permissions = await Promise.all(
    permissionCodes.map((code) =>
      prisma.permission.upsert({
        where: { code },
        update: {},
        create: {
          code,
          name: code,
          description: code,
          module: "restaurants",
          resource: "settings",
          action: code.split(".").pop()!,
        },
      }),
    ),
  );

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  }

  const passwordHash = await bcrypt.hash("Admin123!", 12);

  testUserId = crypto.randomUUID();
  await prisma.user.create({
    data: {
      id: testUserId,
      organizationId: testOrgId,
      email: `settings-api-user-${Date.now()}@test.com`,
      passwordHash,
      firstName: "Settings",
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
  app.use(API, restaurantRouter);
  app.use(authErrorHandler);

  const restaurantRes = await request(app)
    .post(API)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Settings Test Restaurant",
      slug: `settings-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `settings-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@restaurant.com`,
      timezone: "America/New_York",
      currency: "USD",
      language: "en",
    })
    .expect(201);

  testRestaurantId = restaurantRes.body.data.id;
});

afterAll(async () => {
  if (testOrgId) {
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

describe("GET /api/v1/restaurants/:id/settings", () => {
  it("returns restaurant settings", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/settings`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.restaurantId).toBe(testRestaurantId);
    expect(res.body.data.timezone).toBeDefined();
    expect(res.body.data.currency).toBeDefined();
    expect(res.body.data.language).toBeDefined();
    expect(res.body.data.dateFormat).toBeDefined();
    expect(res.body.data.taxPercentage).toBeDefined();
    expect(res.body.data.defaultReservationDuration).toBeDefined();
  });

  it("returns 400 for non-existent restaurant settings", async () => {
    const res = await request(app)
      .get(`${API}/00000000-0000-0000-0000-000000000000/settings`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/settings`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("PUT /api/v1/restaurants/:id/settings", () => {
  it("updates restaurant settings", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/settings`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        timezone: "Europe/London",
        currency: "GBP",
        dateFormat: "DD/MM/YYYY",
        taxPercentage: 10,
        defaultReservationDuration: 90,
        allowWalkIns: false,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.timezone).toBe("Europe/London");
    expect(res.body.data.currency).toBe("GBP");
    expect(res.body.data.dateFormat).toBe("DD/MM/YYYY");
    expect(res.body.data.taxPercentage).toBe(10);
    expect(res.body.data.defaultReservationDuration).toBe(90);
    expect(res.body.data.allowWalkIns).toBe(false);
    expect(res.body.message).toBe("Restaurant settings updated successfully");
  });

  it("validates request body", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/settings`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        taxPercentage: 150,
        defaultReservationDuration: 5,
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("rejects invalid UUID", async () => {
    const res = await request(app)
      .put(`${API}/invalid-id/settings`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ timezone: "UTC" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/settings`)
      .send({ timezone: "UTC" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("preserves unchanged fields", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/settings`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ language: "es" })
      .expect(200);

    expect(res.body.data.language).toBe("es");
    expect(res.body.data.currency).toBe("GBP");
    expect(res.body.data.timezone).toBe("Europe/London");
  });
});
