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
  rateLimiter,
} from "../../../../middlewares/index.js";
import { errorHandler } from "../../../../middlewares/errorHandler.js";
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
      name: "Config API Test Org",
      slug: `config-api-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `config-api-${Date.now()}@test.com`,
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
    "restaurants.settings.read",
    "restaurants.business-hours.read",
    "restaurants.reservation-policy.read",
    "restaurants.calendar-exceptions.read",
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
          resource: code.split(".").pop()!,
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
      email: `config-api-user-${Date.now()}@test.com`,
      passwordHash,
      firstName: "Config",
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
  app.use(errorHandler);

  const restaurantRes = await request(app)
    .post(API)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Config Test Restaurant",
      slug: `config-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `config-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@restaurant.com`,
      timezone: "America/New_York",
      currency: "USD",
      language: "en",
    })
    .expect(201);

  testRestaurantId = restaurantRes.body.data.id;
});

afterAll(async () => {
  if (testOrgId) {
    await prisma.calendarException.deleteMany({ where: { restaurantId: testRestaurantId } }).catch(() => {});
    await prisma.businessHours.deleteMany({ where: { restaurantId: testRestaurantId } }).catch(() => {});
    await prisma.reservationPolicy.deleteMany({ where: { restaurantId: testRestaurantId } }).catch(() => {});
    await prisma.restaurantSettings.deleteMany({ where: { restaurantId: testRestaurantId } }).catch(() => {});
    await prisma.organization.delete({ where: { id: testOrgId } }).catch(() => {});
    await prisma.rolePermission.deleteMany({
      where: { role: { restaurantId: testOrgId } },
    }).catch(() => {});
    await prisma.userRole.deleteMany({ where: { restaurantId: testOrgId } }).catch(() => {});
    await prisma.role.deleteMany({ where: { restaurantId: testOrgId } }).catch(() => {});
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  }
});

describe("GET /api/v1/restaurants/:restaurantId/configuration", () => {
  it("returns full configuration with all sections", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/configuration`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    const config = res.body.data;
    expect(config.restaurant).toBeDefined();
    expect(config.restaurant.id).toBe(testRestaurantId);
    expect(config.restaurant.name).toBeTruthy();
    expect(config.restaurant.slug).toBeTruthy();
    expect(["draft", "active", "pending"]).toContain(config.restaurant.status);
    expect(config.restaurant.timezone).toBe("America/New_York");
    expect(config.restaurant.currency).toBe("USD");
    expect(config.restaurant.language).toBe("en");
    expect(config.restaurant.isActive).toBe(true);

    expect(config).toHaveProperty("settings");
    expect(config).toHaveProperty("reservationPolicy");
    expect(config).toHaveProperty("businessHours");
    expect(config).toHaveProperty("calendarExceptions");
    expect(Array.isArray(config.calendarExceptions)).toBe(true);

    expect(config.metadata).toBeDefined();
    expect(config.metadata.retrievedAt).toBeTruthy();
    expect(config.metadata.version).toBeTruthy();
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/configuration`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("returns 404 for non-existent restaurant", async () => {
    const fakeId = crypto.randomUUID();
    const res = await request(app)
      .get(`${API}/${fakeId}/configuration`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/v1/restaurants/:restaurantId/configuration/refresh", () => {
  it("refreshes and returns configuration", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/configuration/refresh`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.restaurant.id).toBe(testRestaurantId);
    expect(res.body.data.metadata.version).toBeTruthy();
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/configuration/refresh`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
