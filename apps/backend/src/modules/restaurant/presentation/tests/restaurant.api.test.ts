import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Express } from "express";
import request from "supertest";
import { prisma } from "../../../../config/database.js";
import { env } from "../../../../config/env.js";
import { APP } from "../../../../config/constants.js";
import {
  requestId,
  requestLogger,
  errorHandler,
  rateLimiter,
} from "../../../../middlewares/index.js";
import { errorHandler as authErrorHandler } from "../../../../middlewares/errorHandler.js";
import restaurantRouter from "../routes/restaurant.routes.js";
import authRouter from "../../../auth/auth.routes.js";

let app: Express;
let accessToken: string;
let createdRestaurantId: string;

const API = `${APP.API_PREFIX}/restaurants`;
const AUTH_API = `${APP.API_PREFIX}/auth`;

const ADMIN_USER = {
  email: "admin@tableflow.io",
  password: "Admin123!",
};

beforeAll(async () => {
  await prisma.user.update({
    where: { email: ADMIN_USER.email },
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
    }),
  );
  app.use(AUTH_API, authRouter);
  app.use(API, restaurantRouter);
  app.use(authErrorHandler);

  const loginRes = await request(app)
    .post(`${AUTH_API}/login`)
    .send(ADMIN_USER)
    .expect(200);

  accessToken = loginRes.body.data.accessToken;
});

afterAll(async () => {
  if (createdRestaurantId) {
    await prisma.organization.deleteMany({
      where: { id: createdRestaurantId },
    }).catch(() => {});
  }
});

describe("POST /api/v1/restaurants", () => {
  it("creates a restaurant successfully", async () => {
    const res = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "API Test Restaurant",
        slug: "api-test-restaurant",
        email: "api-test@restaurant.com",
        phone: "+1234567890",
        timezone: "America/New_York",
        currency: "USD",
        language: "en",
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("API Test Restaurant");
    expect(res.body.data.slug).toBe("api-test-restaurant");
    expect(res.body.data.status).toBe("draft");
    expect(res.body.data.id).toBeDefined();
    expect(res.body.message).toBe("Restaurant created successfully");

    createdRestaurantId = res.body.data.id;
  });

  it("rejects duplicate slug", async () => {
    const res = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Another Restaurant",
        slug: "api-test-restaurant",
      })
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it("rejects invalid data", async () => {
    const res = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "", slug: "" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("validation.failed");
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .post(API)
      .send({ name: "Test", slug: "test" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/v1/restaurants", () => {
  it("lists restaurants", async () => {
    const res = await request(app)
      .get(API)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it("supports pagination", async () => {
    const res = await request(app)
      .get(`${API}?page=1&limit=5`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(5);
  });

  it("filters by status", async () => {
    const res = await request(app)
      .get(`${API}?status=draft`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/v1/restaurants/:id", () => {
  it("gets a restaurant by id", async () => {
    const res = await request(app)
      .get(`${API}/${createdRestaurantId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdRestaurantId);
    expect(res.body.data.name).toBe("API Test Restaurant");
  });

  it("returns 404 for non-existent restaurant", async () => {
    const res = await request(app)
      .get(`${API}/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  it("rejects invalid UUID", async () => {
    const res = await request(app)
      .get(`${API}/invalid-id`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

describe("PUT /api/v1/restaurants/:id", () => {
  it("updates a restaurant", async () => {
    const res = await request(app)
      .put(`${API}/${createdRestaurantId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Updated Restaurant Name" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Updated Restaurant Name");
    expect(res.body.message).toBe("Restaurant updated successfully");
  });

  it("returns 404 for non-existent restaurant", async () => {
    const res = await request(app)
      .put(`${API}/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Test" })
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});

describe("PATCH /api/v1/restaurants/:id/activate", () => {
  it("activates a restaurant", async () => {
    const res = await request(app)
      .patch(`${API}/${createdRestaurantId}/activate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("active");
    expect(res.body.message).toBe("Restaurant activated successfully");
  });

  it("returns 422 for invalid transition", async () => {
    const res = await request(app)
      .patch(`${API}/${createdRestaurantId}/activate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(422);

    expect(res.body.success).toBe(false);
  });
});

describe("PATCH /api/v1/restaurants/:id/suspend", () => {
  it("suspends an active restaurant", async () => {
    const res = await request(app)
      .patch(`${API}/${createdRestaurantId}/suspend`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ reason: "Temporary closure" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("suspended");
  });

  it("returns 422 for invalid transition", async () => {
    const res = await request(app)
      .patch(`${API}/${createdRestaurantId}/suspend`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(422);

    expect(res.body.success).toBe(false);
  });
});

describe("PATCH /api/v1/restaurants/:id/archive", () => {
  let archiveId: string;

  it("creates a draft restaurant for archive test", async () => {
    const res = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Archive Test",
        slug: `archive-test-${Date.now()}`,
      })
      .expect(201);

    archiveId = res.body.data.id;
  });

  it("archives a draft restaurant", async () => {
    const res = await request(app)
      .patch(`${API}/${archiveId}/archive`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("archived");
  });
});
