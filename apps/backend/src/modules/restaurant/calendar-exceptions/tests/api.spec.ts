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

function futureDateStr(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

beforeAll(async () => {
  testOrgId = crypto.randomUUID();

  await prisma.organization.create({
    data: {
      id: testOrgId,
      name: "CE API Test Org",
      slug: `ce-api-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `ce-api-${Date.now()}@test.com`,
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
    "restaurants.calendar-exceptions.read",
    "restaurants.calendar-exceptions.create",
    "restaurants.calendar-exceptions.update",
    "restaurants.calendar-exceptions.delete",
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
          resource: "calendar-exceptions",
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
      email: `ce-api-user-${Date.now()}@test.com`,
      passwordHash,
      firstName: "CE",
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
      name: "CE Test Restaurant",
      slug: `ce-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `ce-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@restaurant.com`,
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

describe("GET /api/v1/restaurants/:restaurantId/calendar-exceptions", () => {
  it("returns empty list when no exceptions exist", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/calendar-exceptions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/calendar-exceptions`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/v1/restaurants/:restaurantId/calendar-exceptions", () => {
  const title = "Christmas Closure";
  const date = futureDateStr();

  it("creates a calendar exception", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/calendar-exceptions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title,
        type: "holiday",
        date,
        isClosed: true,
        allDay: true,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(title);
    expect(res.body.data.type).toBe("holiday");
    expect(res.body.data.date).toBe(date);
    expect(res.body.data.isClosed).toBe(true);
    expect(res.body.data.allDay).toBe(true);
    expect(res.body.data.priority).toBe(50);
    expect(res.body.data.restaurantId).toBe(testRestaurantId);
  });

  it("creates an exception with opening hours", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/calendar-exceptions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Special Opening",
        type: "special_opening",
        date: futureDateStr(),
        isClosed: false,
        openTime: "10:00",
        closeTime: "18:00",
        allDay: false,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.isClosed).toBe(false);
    expect(res.body.data.openTime).toBe("10:00");
    expect(res.body.data.closeTime).toBe("18:00");
  });

  it("rejects duplicate exception on same date/type", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/calendar-exceptions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Another Christmas",
        type: "holiday",
        date,
        isClosed: true,
        allDay: true,
      })
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it("validates request body", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/calendar-exceptions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "",
        type: "invalid",
        date: "not-a-date",
        isClosed: true,
        allDay: true,
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("rejects closed exception with opening hours", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/calendar-exceptions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Contradictory",
        type: "holiday",
        date: futureDateStr(),
        isClosed: true,
        openTime: "09:00",
        closeTime: "17:00",
        allDay: false,
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("rejects non-closed exception without opening hours", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/calendar-exceptions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "No Hours",
        type: "special_opening",
        date: futureDateStr(),
        isClosed: false,
        allDay: false,
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/calendar-exceptions`)
      .send({
        title: "Test",
        type: "holiday",
        date: futureDateStr(),
        isClosed: true,
        allDay: true,
      })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("PUT /api/v1/restaurants/:restaurantId/calendar-exceptions/:id", () => {
  let createdId: string;
  const date = futureDateStr();

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/calendar-exceptions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Update Test",
        type: "maintenance",
        date,
        isClosed: true,
        allDay: true,
      })
      .expect(201);
    createdId = res.body.data.id;
  });

  it("updates an existing exception", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/calendar-exceptions/${createdId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Updated Maintenance",
        type: "maintenance",
        date,
        isClosed: false,
        openTime: "08:00",
        closeTime: "20:00",
        allDay: false,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Updated Maintenance");
    expect(res.body.data.isClosed).toBe(false);
    expect(res.body.data.openTime).toBe("08:00");
    expect(res.body.data.closeTime).toBe("20:00");
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/calendar-exceptions/${createdId}`)
      .send({
        title: "Test",
        type: "holiday",
        date,
        isClosed: true,
        allDay: true,
      })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("DELETE /api/v1/restaurants/:restaurantId/calendar-exceptions/:id", () => {
  let createdId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/calendar-exceptions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Delete Test",
        type: "emergency_closure",
        date: futureDateStr(),
        isClosed: true,
        allDay: true,
      })
      .expect(201);
    createdId = res.body.data.id;
  });

  it("deletes an existing exception", async () => {
    const res = await request(app)
      .delete(`${API}/${testRestaurantId}/calendar-exceptions/${createdId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    expect(res.noContent).toBe(true);
  });

  it("returns 404 for already deleted exception", async () => {
    const res = await request(app)
      .delete(`${API}/${testRestaurantId}/calendar-exceptions/${createdId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  it("requires authentication", async () => {
    const otherId = crypto.randomUUID();
    const res = await request(app)
      .delete(`${API}/${testRestaurantId}/calendar-exceptions/${otherId}`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
