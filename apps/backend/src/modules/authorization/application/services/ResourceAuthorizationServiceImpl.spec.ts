import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthorizationContext } from "../../domain/models/AuthorizationContext.js";
import type { ResourceContext } from "../../domain/models/ResourceContext.js";
import { ResourceAuthorizationServiceImpl } from "./ResourceAuthorizationServiceImpl.js";
import { PlatformAdminPolicy } from "./PlatformAdminPolicy.js";
import { SameRestaurantPolicy } from "./SameRestaurantPolicy.js";
import { OwnerPolicy } from "./OwnerPolicy.js";
import { AssignedEmployeePolicy } from "./AssignedEmployeePolicy.js";
import { PolicyEvaluatorImpl } from "./PolicyEvaluatorImpl.js";

vi.mock("../../../config/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn(),
    })),
  },
}));

function orgScopeUser(overrides?: Partial<AuthorizationContext>): AuthorizationContext {
  return {
    userId: "user-1",
    organizationId: "restaurant-1",
    roles: [{ roleId: "r1", roleCode: "manager", roleName: "Manager", restaurantId: "restaurant-1", branchId: null }],
    permissions: ["reservations.update", "employees.manage"],
    scope: { type: "organization", organizationId: "restaurant-1" },
    ...overrides,
  };
}

function globalScopeUser(overrides?: Partial<AuthorizationContext>): AuthorizationContext {
  return {
    userId: "admin-1",
    organizationId: "restaurant-1",
    roles: [{ roleId: "r-sys", roleCode: "super-admin", roleName: "Super Admin", restaurantId: null, branchId: null }],
    permissions: ["*"],
    scope: { type: "global" },
    ...overrides,
  };
}

function makeReservation(overrides?: Partial<ResourceContext>): ResourceContext {
  return {
    resourceType: "reservation",
    resourceId: "res-1",
    restaurantId: "restaurant-1",
    ownerUserId: "owner-1",
    assignedUserId: "waiter-1",
    ...overrides,
  };
}

function makeEmployee(overrides?: Partial<ResourceContext>): ResourceContext {
  return {
    resourceType: "employee",
    resourceId: "emp-1",
    restaurantId: "restaurant-1",
    employeeUserId: "emp-user-1",
    ...overrides,
  };
}

function makeUser(overrides?: Partial<ResourceContext>): ResourceContext {
  return {
    resourceType: "user",
    resourceId: "target-user-1",
    restaurantId: "restaurant-1",
    ownerUserId: "user-1",
    createdByUserId: "creator-1",
    ...overrides,
  };
}

// ── PlatformAdminPolicy ──────────────────────────────────────────────────────

describe("PlatformAdminPolicy", () => {
  const policy = new PlatformAdminPolicy();

  it("allows users with global scope", async () => {
    const user = globalScopeUser();
    const resource = makeReservation();
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(true);
  });

  it("denies users with organization scope", async () => {
    const user = orgScopeUser();
    const resource = makeReservation();
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(false);
  });
});

// ── SameRestaurantPolicy ─────────────────────────────────────────────────────

describe("SameRestaurantPolicy", () => {
  const policy = new SameRestaurantPolicy();

  it("allows when user org matches resource restaurant", async () => {
    const user = orgScopeUser();
    const resource = makeReservation({ restaurantId: "restaurant-1" });
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(true);
  });

  it("denies when user org differs from resource restaurant", async () => {
    const user = orgScopeUser();
    const resource = makeReservation({ restaurantId: "restaurant-2" });
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(false);
  });

  it("allows platform admin regardless of restaurant mismatch", async () => {
    const user = globalScopeUser();
    const resource = makeReservation({ restaurantId: "restaurant-999" });
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(true);
  });
});

// ── OwnerPolicy ──────────────────────────────────────────────────────────────

describe("OwnerPolicy", () => {
  it("allows when user is the resource owner", async () => {
    const policy = new OwnerPolicy("ownerUserId");
    const user = orgScopeUser();
    const resource = makeReservation({ ownerUserId: "user-1" });
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(true);
  });

  it("denies when user is not the resource owner", async () => {
    const policy = new OwnerPolicy("ownerUserId");
    const user = orgScopeUser();
    const resource = makeReservation({ ownerUserId: "someone-else" });
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(false);
  });

  it("denies when resource has no owner", async () => {
    const policy = new OwnerPolicy("ownerUserId");
    const user = orgScopeUser();
    const resource = makeReservation({ ownerUserId: undefined });
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(false);
  });

  it("allows platform admin regardless of owner mismatch", async () => {
    const policy = new OwnerPolicy("ownerUserId");
    const user = globalScopeUser();
    const resource = makeReservation({ ownerUserId: "someone-else" });
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(true);
  });

  it("checks the configured field (createdByUserId)", async () => {
    const policy = new OwnerPolicy("createdByUserId");
    const user = orgScopeUser({ userId: "creator-1" });
    const resource = makeReservation({ createdByUserId: "creator-1" });
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(true);
  });
});

// ── AssignedEmployeePolicy ───────────────────────────────────────────────────

describe("AssignedEmployeePolicy", () => {
  const policy = new AssignedEmployeePolicy();

  it("allows when user is the assigned employee", async () => {
    const user = orgScopeUser({ userId: "waiter-1" });
    const resource = makeReservation({ assignedUserId: "waiter-1" });
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(true);
  });

  it("denies when user is not the assigned employee", async () => {
    const user = orgScopeUser();
    const resource = makeReservation({ assignedUserId: "other-waiter" });
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(false);
  });

  it("denies when resource has no assigned user", async () => {
    const user = orgScopeUser();
    const resource = makeReservation({ assignedUserId: undefined });
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(false);
  });

  it("allows platform admin regardless of assignment", async () => {
    const user = globalScopeUser();
    const resource = makeReservation({ assignedUserId: "some-waiter" });
    const result = await policy.evaluate(user, resource);
    expect(result.allowed).toBe(true);
  });
});

// ── PolicyEvaluatorImpl ──────────────────────────────────────────────────────

describe("PolicyEvaluatorImpl", () => {
  const evaluator = new PolicyEvaluatorImpl();

  it("returns allow when all policies pass", async () => {
    const user = orgScopeUser();
    const resource = makeReservation({ restaurantId: "restaurant-1", ownerUserId: "user-1" });
    const result = await evaluator.evaluate(user, resource, [
      new SameRestaurantPolicy(),
      new OwnerPolicy("ownerUserId"),
    ]);
    expect(result.allowed).toBe(true);
  });

  it("returns deny with first failing policy reason", async () => {
    const user = orgScopeUser();
    const resource = makeReservation({ restaurantId: "restaurant-2" });
    const result = await evaluator.evaluate(user, resource, [
      new SameRestaurantPolicy(),
      new OwnerPolicy("ownerUserId"),
    ]);
    expect(result.allowed).toBe(false);
    expect(result.policyName).toBe("SameRestaurantPolicy");
  });

  it("evaluateAll returns results for all policies", async () => {
    const user = orgScopeUser();
    const resource = makeReservation({ restaurantId: "restaurant-1", ownerUserId: "user-1" });
    const results = await evaluator.evaluateAll(user, resource, [
      new SameRestaurantPolicy(),
      new OwnerPolicy("ownerUserId"),
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].allowed).toBe(true);
    expect(results[1].allowed).toBe(true);
  });
});

// ── ResourceAuthorizationServiceImpl ─────────────────────────────────────────

describe("ResourceAuthorizationServiceImpl", () => {
  let service: ResourceAuthorizationServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ResourceAuthorizationServiceImpl();
  });

  describe("canAccessRestaurant", () => {
    it("allows access when user belongs to the restaurant", async () => {
      const user = orgScopeUser();
      const result = await service.canAccessRestaurant(user, "restaurant-1");
      expect(result).toBe(true);
    });

    it("denies access when user belongs to a different restaurant", async () => {
      const user = orgScopeUser();
      const result = await service.canAccessRestaurant(user, "restaurant-2");
      expect(result).toBe(false);
    });

    it("allows platform admin to access any restaurant", async () => {
      const user = globalScopeUser();
      const result = await service.canAccessRestaurant(user, "any-restaurant");
      expect(result).toBe(true);
    });
  });

  describe("canModifyReservation", () => {
    it("allows owner to modify their reservation", async () => {
      const user = orgScopeUser({ userId: "owner-1" });
      const resource = makeReservation({ ownerUserId: "owner-1", restaurantId: "restaurant-1" });
      const result = await service.canModifyReservation(user, resource);
      expect(result).toBe(true);
    });

    it("allows assigned employee to modify reservation", async () => {
      const user = orgScopeUser({ userId: "waiter-1" });
      const resource = makeReservation({ ownerUserId: "owner-1", assignedUserId: "waiter-1", restaurantId: "restaurant-1" });
      const result = await service.canModifyReservation(user, resource);
      expect(result).toBe(true);
    });

    it("allows platform admin to modify any reservation", async () => {
      const user = globalScopeUser();
      const resource = makeReservation({ restaurantId: "other-restaurant", ownerUserId: "someone", assignedUserId: "someone" });
      const result = await service.canModifyReservation(user, resource);
      expect(result).toBe(true);
    });

    it("denies when user is neither owner nor assigned", async () => {
      const user = orgScopeUser();
      const resource = makeReservation({ ownerUserId: "other-owner", assignedUserId: "other-waiter" });
      const result = await service.canModifyReservation(user, resource);
      expect(result).toBe(false);
    });

    it("denies cross-tenant reservation access", async () => {
      const user = orgScopeUser();
      const resource = makeReservation({ restaurantId: "restaurant-2", ownerUserId: "user-1" });
      const result = await service.canModifyReservation(user, resource);
      expect(result).toBe(false);
    });
  });

  describe("canManageEmployee", () => {
    it("allows manager in same restaurant", async () => {
      const user = orgScopeUser();
      const resource = makeEmployee({ restaurantId: "restaurant-1" });
      const result = await service.canManageEmployee(user, resource);
      expect(result).toBe(true);
    });

    it("denies cross-tenant employee management", async () => {
      const user = orgScopeUser();
      const resource = makeEmployee({ restaurantId: "restaurant-2" });
      const result = await service.canManageEmployee(user, resource);
      expect(result).toBe(false);
    });

    it("allows platform admin to manage any employee", async () => {
      const user = globalScopeUser();
      const resource = makeEmployee({ restaurantId: "any-restaurant" });
      const result = await service.canManageEmployee(user, resource);
      expect(result).toBe(true);
    });
  });

  describe("canAccessUser", () => {
    it("allows user to access their own profile (owner)", async () => {
      const user = orgScopeUser({ userId: "user-1" });
      const resource = makeUser({ ownerUserId: "user-1" });
      const result = await service.canAccessUser(user, resource);
      expect(result).toBe(true);
    });

    it("allows user to access profile they created", async () => {
      const user = orgScopeUser({ userId: "creator-1" });
      const resource = makeUser({ ownerUserId: "someone-else", createdByUserId: "creator-1" });
      const result = await service.canAccessUser(user, resource);
      expect(result).toBe(true);
    });

    it("denies access to unrelated user profile", async () => {
      const user = orgScopeUser();
      const resource = makeUser({ ownerUserId: "stranger", createdByUserId: "other-creator" });
      const result = await service.canAccessUser(user, resource);
      expect(result).toBe(false);
    });

    it("allows platform admin to access any user", async () => {
      const user = globalScopeUser();
      const resource = makeUser({ ownerUserId: "stranger", restaurantId: "other-restaurant" });
      const result = await service.canAccessUser(user, resource);
      expect(result).toBe(true);
    });
  });

  describe("evaluatePolicy", () => {
    it("evaluates all policies when no names specified", async () => {
      const user = orgScopeUser();
      const resource = makeReservation({ restaurantId: "restaurant-2" });
      const result = await service.evaluatePolicy(user, resource);
      expect(result.allowed).toBe(false);
    });

    it("evaluates specific policies by name", async () => {
      const user = orgScopeUser({ userId: "owner-1" });
      const resource = makeReservation({ restaurantId: "restaurant-1", ownerUserId: "owner-1" });
      const result = await service.evaluatePolicy(user, resource, "OwnerPolicy");
      expect(result.allowed).toBe(true);
    });
  });
});
