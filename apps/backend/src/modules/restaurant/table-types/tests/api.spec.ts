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
      name: "TableType API Test Org",
      slug: `tt-api-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `tt-api-${Date.now()}@test.com`,
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
    "table-types.create",
    "table-types.read",
    "table-types.update",
    "table-types.archive",
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
          module: "tables",
          resource: "table-types",
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
      email: `tt-api-user-${Date.now()}@test.com`,
      passwordHash,
      firstName: "TableType",
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
      name: "TableType Test Restaurant",
      slug: `tt-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: `tt-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@restaurant.com`,
      timezone: "America/New_York",
      currency: "USD",
      language: "en",
    })
    .expect(201);

  testRestaurantId = restaurantRes.body.data.id;
});

afterAll(async () => {
  if (testOrgId) {
    await prisma.tableType.deleteMany({ where: { restaurantId: testRestaurantId } }).catch(() => {});
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

describe("POST /api/v1/restaurants/:id/table-types", () => {
  it("creates a table type", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/table-types`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Standard",
        code: "STANDARD",
        defaultCapacity: 4,
        minimumCapacity: 1,
        maximumCapacity: 8,
        shape: "rectangle",
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Standard");
    expect(res.body.data.code).toBe("STANDARD");
    expect(res.body.data.defaultCapacity).toBe(4);
    expect(res.body.data.minimumCapacity).toBe(1);
    expect(res.body.data.maximumCapacity).toBe(8);
    expect(res.body.data.shape).toBe("rectangle");
    expect(res.body.data.status).toBe("active");
    expect(res.body.data.isReservable).toBe(true);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/table-types`)
      .send({
        name: "Test",
        code: "TEST",
        defaultCapacity: 4,
        minimumCapacity: 1,
        maximumCapacity: 8,
        shape: "rectangle",
      })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("rejects duplicate name", async () => {
    await request(app)
      .post(`${API}/${testRestaurantId}/table-types`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Duplicate Name",
        code: "DUP_NAME",
        defaultCapacity: 4,
        minimumCapacity: 1,
        maximumCapacity: 8,
        shape: "square",
      })
      .expect(201);

    const res = await request(app)
      .post(`${API}/${testRestaurantId}/table-types`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Duplicate Name",
        code: "DUP_NAME2",
        defaultCapacity: 4,
        minimumCapacity: 1,
        maximumCapacity: 8,
        shape: "square",
      })
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it("rejects empty name", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/table-types`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "",
        code: "EMPTY",
        defaultCapacity: 4,
        minimumCapacity: 1,
        maximumCapacity: 8,
        shape: "rectangle",
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("rejects invalid shape", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/table-types`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Invalid Shape",
        code: "INVALID",
        defaultCapacity: 4,
        minimumCapacity: 1,
        maximumCapacity: 8,
        shape: "hexagon",
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("rejects invalid capacity range", async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/table-types`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Bad Range",
        code: "BAD_RNG",
        defaultCapacity: 10,
        minimumCapacity: 1,
        maximumCapacity: 8,
        shape: "rectangle",
      })
      .expect(422);

    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/v1/restaurants/:id/table-types", () => {
  it("lists table types", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/table-types`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/table-types`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/v1/restaurants/:id/table-types/:tableTypeId", () => {
  let createdId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/table-types`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Get Test Type",
        code: "GET_TEST",
        defaultCapacity: 6,
        minimumCapacity: 2,
        maximumCapacity: 10,
        shape: "round",
      })
      .expect(201);
    createdId = res.body.data.id;
  });

  it("returns a table type by ID", async () => {
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/table-types/${createdId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdId);
    expect(res.body.data.name).toBe("Get Test Type");
  });

  it("returns 404 for non-existent type", async () => {
    const fakeId = crypto.randomUUID();
    const res = await request(app)
      .get(`${API}/${testRestaurantId}/table-types/${fakeId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});

describe("PUT /api/v1/restaurants/:id/table-types/:tableTypeId", () => {
  let typeId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/table-types`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Update Test",
        code: "UPD_TEST",
        defaultCapacity: 4,
        minimumCapacity: 1,
        maximumCapacity: 8,
        shape: "rectangle",
      })
      .expect(201);
    typeId = res.body.data.id;
  });

  it("updates a table type", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/table-types/${typeId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Updated Type",
        code: "UPDATED",
        defaultCapacity: 6,
        minimumCapacity: 2,
        maximumCapacity: 12,
        shape: "oval",
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Updated Type");
    expect(res.body.data.code).toBe("UPDATED");
    expect(res.body.data.defaultCapacity).toBe(6);
    expect(res.body.data.shape).toBe("oval");
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .put(`${API}/${testRestaurantId}/table-types/${typeId}`)
      .send({
        name: "Test",
        code: "TEST",
        defaultCapacity: 4,
        minimumCapacity: 1,
        maximumCapacity: 8,
        shape: "rectangle",
      })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("PATCH /api/v1/restaurants/:id/table-types/:tableTypeId/archive", () => {
  let typeId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/${testRestaurantId}/table-types`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Archive Test",
        code: "ARCHIVE",
        defaultCapacity: 4,
        minimumCapacity: 1,
        maximumCapacity: 8,
        shape: "rectangle",
      })
      .expect(201);
    typeId = res.body.data.id;
  });

  it("archives a table type", async () => {
    const res = await request(app)
      .patch(`${API}/${testRestaurantId}/table-types/${typeId}/archive`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("archived");
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .patch(`${API}/${testRestaurantId}/table-types/${typeId}/archive`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
