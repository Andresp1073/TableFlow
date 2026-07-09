import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../../middlewares/auth.js";
import { requirePermission, requireAnyPermission, requireRole, requireRestaurantAccess } from "./guards.js";

vi.mock("../../../config/logger.js", () => {
  const childFn = vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: childFn,
  }));
  return {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: childFn },
  };
});

function createMockReq(overrides?: Partial<AuthenticatedRequest>): AuthenticatedRequest {
  return {
    userId: "user-1",
    organizationId: "org-1",
    role: "Super Admin",
    permissions: [],
    jti: "jti-1",
    ip: "127.0.0.1",
    headers: {},
    params: {},
    ...overrides,
  } as unknown as AuthenticatedRequest;
}

function createMockRes() {
  return {} as Response;
}

function createNext() {
  return vi.fn() as NextFunction;
}

describe("requirePermission", () => {
  let req: AuthenticatedRequest;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = createMockReq();
    res = createMockRes();
    next = createNext();
  });

  it("passes when user has the permission in authContext", async () => {
    req.authContext = {
      userId: "user-1",
      organizationId: "org-1",
      roles: [],
      permissions: ["users.read", "users.write"],
      scope: { type: "organization", organizationId: "org-1" },
    };
    const middleware = requirePermission("users.read");
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("denies when user lacks the permission", async () => {
    req.authContext = {
      userId: "user-1",
      organizationId: "org-1",
      roles: [],
      permissions: ["orders.read"],
      scope: { type: "organization", organizationId: "org-1" },
    };
    const middleware = requirePermission("users.delete");
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it("denies when user is not authenticated", async () => {
    req.userId = undefined;
    const middleware = requirePermission("users.read");
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe("requireAnyPermission", () => {
  let req: AuthenticatedRequest;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = createMockReq();
    res = createMockRes();
    next = createNext();
  });

  it("passes when user has any of the required permissions", async () => {
    req.authContext = {
      userId: "user-1",
      organizationId: "org-1",
      roles: [],
      permissions: ["orders.create"],
      scope: { type: "organization", organizationId: "org-1" },
    };
    const middleware = requireAnyPermission(["orders.create", "orders.delete"]);
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("denies when user has none of the required permissions", async () => {
    req.authContext = {
      userId: "user-1",
      organizationId: "org-1",
      roles: [],
      permissions: ["menu.read"],
      scope: { type: "organization", organizationId: "org-1" },
    };
    const middleware = requireAnyPermission(["orders.create", "orders.delete"]);
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});

describe("requireRole", () => {
  let req: AuthenticatedRequest;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = createMockReq();
    res = createMockRes();
    next = createNext();
  });

  it("passes when user has the role in authContext.roles", async () => {
    req.authContext = {
      userId: "user-1",
      organizationId: "org-1",
      roles: [{ roleId: "r1", roleCode: "super-admin", roleName: "Super Admin", restaurantId: null, branchId: null }],
      permissions: [],
      scope: { type: "global" },
    };
    const middleware = requireRole("super-admin");
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("denies when user lacks the required role", async () => {
    req.authContext = {
      userId: "user-1",
      organizationId: "org-1",
      roles: [{ roleId: "r1", roleCode: "waiter", roleName: "Waiter", restaurantId: "org-1", branchId: null }],
      permissions: [],
      scope: { type: "organization", organizationId: "org-1" },
    };
    const middleware = requireRole("restaurant-owner");
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});

describe("requireRestaurantAccess", () => {
  let req: AuthenticatedRequest;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = createMockReq({ params: { restaurantId: "org-1" } });
    res = createMockRes();
    next = createNext();
  });

  it("passes when user has org scope matching target", async () => {
    req.authContext = {
      userId: "user-1",
      organizationId: "org-1",
      roles: [],
      permissions: [],
      scope: { type: "organization", organizationId: "org-1" },
    };
    const middleware = requireRestaurantAccess();
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("denies when user scope does not match target", async () => {
    req.authContext = {
      userId: "user-1",
      organizationId: "org-1",
      roles: [],
      permissions: [],
      scope: { type: "organization", organizationId: "org-1" },
    };
    req.params.restaurantId = "org-2";
    const middleware = requireRestaurantAccess();
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
