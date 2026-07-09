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
      name: "Asset API Test Org",
      slug: `asset-api-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `asset-api-${Date.now()}@test.com`,
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
    "restaurants.assets.read",
    "restaurants.assets.upload",
    "restaurants.assets.delete",
    "restaurants.assets.update",
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
          resource: "assets",
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
      email: `asset-api-user-${Date.now()}@test.com`,
      passwordHash,
      firstName: "Asset",
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
      name: "Asset Test Restaurant",
      slug: `asset-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `asset-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@restaurant.com`,
      timezone: "America/New_York",
      currency: "USD",
      language: "en",
    })
    .expect(201);

  testRestaurantId = restaurantRes.body.data.id;
});

afterAll(async () => {
  if (testOrgId) {
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

describe("POST /api/v1/restaurants/:restaurantId/assets", () => {
  it("uploads an asset", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/assets`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("fake-png-data"), "test-logo.png")
      .field("type", "logo")
      .field("name", "Test Logo")
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe("logo");
    expect(res.body.data.originalFilename).toBe("test-logo.png");
    expect(res.body.data.restaurantId).toBe(testRestaurantId);
    expect(res.body.data.isPrimary).toBe(false);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/assets`)
      .attach("file", Buffer.from("test"), "test.png")
      .field("type", "logo")
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("rejects invalid asset type", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/assets`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("test"), "test.png")
      .field("type", "invalid_type")
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/v1/restaurants/:restaurantId/assets", () => {
  it("returns previously uploaded assets", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/assets`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/assets`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/v1/restaurants/:restaurantId/assets/:assetId", () => {
  let createdId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/assets`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("get-test-data"), "get-test.png")
      .field("type", "cover")
      .field("name", "Get Test Cover")
      .expect(201);
    createdId = res.body.data.id;
  });

  it("returns a single asset by ID", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/assets/${createdId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdId);
    expect(res.body.data.type).toBe("cover");
  });

  it("returns 404 for non-existent asset", async () => {
    const fakeId = crypto.randomUUID();
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/assets/${fakeId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});

describe("PATCH /api/v1/restaurants/:restaurantId/assets/:assetId/primary", () => {
  let assetId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/assets`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("primary-test-data"), "primary-test.png")
      .field("type", "gallery")
      .field("name", "Primary Test")
      .expect(201);
    assetId = res.body.data.id;
  });

  it("sets an asset as primary", async () => {
    const res = await request(app)
      .patch(`${API}/${testRestaurantId}/assets/${assetId}/primary`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.isPrimary).toBe(true);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .patch(`${API}/${testRestaurantId}/assets/${assetId}/primary`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("DELETE /api/v1/restaurants/:restaurantId/assets/:assetId", () => {
  let createdId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/assets`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("delete-test-data"), "delete-test.png")
      .field("type", "gallery")
      .field("name", "Delete Test")
      .expect(201);
    createdId = res.body.data.id;
  });

  it("deletes an existing asset", async () => {
    const res = await request(app)
      .delete(`${API}/${testRestaurantId}/assets/${createdId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    expect(res.noContent).toBe(true);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .delete(`${API}/${testRestaurantId}/assets/${createdId}`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
