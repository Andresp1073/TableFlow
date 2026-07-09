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
      name: "Dining Area API Test Org",
      slug: `da-api-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `da-api-${Date.now()}@test.com`,
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
    "restaurants.dining-areas.create",
    "restaurants.dining-areas.read",
    "restaurants.dining-areas.update",
    "restaurants.dining-areas.archive",
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
          resource: "dining-areas",
          action: code.split(".").pop()!,
          riskLevel: "low",
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
      email: `da-api-user-${Date.now()}@test.com`,
      passwordHash,
      firstName: "Dining",
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
      name: "Dining Area Test Restaurant",
      slug: `da-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `da-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@restaurant.com`,
      timezone: "America/New_York",
      currency: "USD",
      language: "en",
    })
    .expect(201);

  testRestaurantId = restaurantRes.body.data.id;
});

afterAll(async () => {
  if (testOrgId) {
    await prisma.diningArea.deleteMany({ where: { restaurantId: testRestaurantId } }).catch(() => {});
    await prisma.restaurantAsset.deleteMany({ where: { restaurantId: testRestaurantId } }).catch(() => {});
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

describe("POST /api/v1/restaurants/:id/dining-areas", () => {
  it("creates a dining area", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/dining-areas`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Main Hall", code: "MAIN_HALL" })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Main Hall");
    expect(res.body.data.code).toBe("MAIN_HALL");
    expect(res.body.data.status).toBe("active");
    expect(res.body.data.isReservable).toBe(true);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/dining-areas`)
      .send({ name: "Test", code: "TEST" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("rejects duplicate name", async () => {
    await request(app)
      .post(`${API}/${testRestaurantId}/dining-areas`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Duplicate", code: "DUP_1" })
      .expect(201);

    const res = await request(app)
      .post(`${API}/${testRestaurantId}/dining-areas`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Duplicate", code: "DUP_2" })
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it("rejects empty name", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/dining-areas`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "", code: "EMPTY" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/v1/restaurants/:id/dining-areas", () => {
  it("lists dining areas", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/dining-areas`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/dining-areas`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/v1/restaurants/:id/dining-areas/:diningAreaId", () => {
  let createdId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/dining-areas`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Get Test Area", code: "GET_TEST" })
      .expect(201);
    createdId = res.body.data.id;
  });

  it("returns a dining area by ID", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/dining-areas/${createdId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdId);
    expect(res.body.data.name).toBe("Get Test Area");
  });

  it("returns 404 for non-existent area", async () => {
    const fakeId = crypto.randomUUID();
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/dining-areas/${fakeId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});

describe("PUT /api/v1/restaurants/:id/dining-areas/:diningAreaId", () => {
  let areaId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/dining-areas`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Update Test", code: "UPD_TEST" })
      .expect(201);
    areaId = res.body.data.id;
  });

  it("updates a dining area", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/dining-areas/${areaId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Updated Name", code: "UPDATED" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Updated Name");
    expect(res.body.data.code).toBe("UPDATED");
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/dining-areas/${areaId}`)
      .send({ name: "Test", code: "TEST" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("PATCH /api/v1/restaurants/:id/dining-areas/:diningAreaId/archive", () => {
  let areaId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/dining-areas`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Archive Test", code: "ARCHIVE" })
      .expect(201);
    areaId = res.body.data.id;
  });

  it("archives a dining area", async () => {
    const res = await request(app)
      .patch(`${API}/${testRestaurantId}/dining-areas/${areaId}/archive`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("archived");
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .patch(`${API}/${testRestaurantId}/dining-areas/${areaId}/archive`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
