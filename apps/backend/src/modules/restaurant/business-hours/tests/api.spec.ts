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
      name: "BH API Test Org",
      slug: `bh-api-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `bh-api-${Date.now()}@test.com`,
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
    "restaurants.business-hours.read",
    "restaurants.business-hours.update",
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
          resource: "business-hours",
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
      email: `bh-api-user-${Date.now()}@test.com`,
      passwordHash,
      firstName: "BH",
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
      name: "BH Test Restaurant",
      slug: `bh-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `bh-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@restaurant.com`,
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

describe("GET /api/v1/restaurants/:id/business-hours", () => {
  it("returns business hours with defaults (Mon-Fri 09:00-17:00, Sat-Sun closed)", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/business-hours`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.restaurantId).toBe(testRestaurantId);
    expect(res.body.data.schedules).toHaveLength(7);

    const monday = res.body.data.schedules[0];
    expect(monday.dayOfWeek).toBe(1);
    expect(monday.isClosed).toBe(false);
    expect(monday.periods).toHaveLength(1);
    expect(monday.periods[0].openTime).toBe("09:00");
    expect(monday.periods[0].closeTime).toBe("17:00");

    const sunday = res.body.data.schedules[6];
    expect(sunday.dayOfWeek).toBe(7);
    expect(sunday.isClosed).toBe(true);
    expect(sunday.periods).toHaveLength(0);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/business-hours`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("PUT /api/v1/restaurants/:id/business-hours", () => {
  it("updates business hours", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/business-hours`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        schedules: [
          {
            dayOfWeek: 1,
            isClosed: false,
            periods: [
              { openTime: "08:00", closeTime: "12:00", order: 0 },
              { openTime: "13:00", closeTime: "18:00", order: 1 },
            ],
          },
          {
            dayOfWeek: 2,
            isClosed: false,
            periods: [{ openTime: "09:00", closeTime: "17:00", order: 0 }],
          },
          { dayOfWeek: 3, isClosed: true, periods: [] },
          { dayOfWeek: 4, isClosed: false, periods: [] },
          { dayOfWeek: 5, isClosed: false, periods: [] },
          { dayOfWeek: 6, isClosed: true, periods: [] },
          { dayOfWeek: 7, isClosed: true, periods: [] },
        ],
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.restaurantId).toBe(testRestaurantId);
    expect(res.body.message).toBe("Business hours updated successfully");

    const monday = res.body.data.schedules[0];
    expect(monday.dayOfWeek).toBe(1);
    expect(monday.periods).toHaveLength(2);
    expect(monday.periods[0].openTime).toBe("08:00");
    expect(monday.periods[1].openTime).toBe("13:00");

    const wednesday = res.body.data.schedules[2];
    expect(wednesday.isClosed).toBe(true);
    expect(wednesday.periods).toHaveLength(0);
  });

  it("validates request body", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/business-hours`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        schedules: [
          {
            dayOfWeek: 0,
            isClosed: false,
            periods: [],
          },
        ],
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("validates time format", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/business-hours`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        schedules: [
          {
            dayOfWeek: 1,
            isClosed: false,
            periods: [{ openTime: "25:00", closeTime: "17:00", order: 0 }],
          },
        ],
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/business-hours`)
      .send({ schedules: [{ dayOfWeek: 1, isClosed: false, periods: [] }] })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
