import { describe, it, expect } from "vitest";
import { AuditAction } from "../domain/models/AuditAction.js";
import { AuditModule } from "../domain/models/AuditModule.js";

describe("AuditAction", () => {
  it("creates from valid action", () => {
    const action = AuditAction.create("create");
    expect(action.value).toBe("create");
  });

  it("is case insensitive", () => {
    const action = AuditAction.create("CREATE");
    expect(action.value).toBe("create");
  });

  it("trims whitespace", () => {
    const action = AuditAction.create("  update  ");
    expect(action.value).toBe("update");
  });

  it("throws for invalid action", () => {
    expect(() => AuditAction.create("invalid_action")).toThrow();
  });

  it("supports all valid actions", () => {
    const actions = [
      "create", "update", "delete", "archive", "restore",
      "login", "logout", "activate", "deactivate", "assign", "revoke",
    ];
    for (const a of actions) {
      expect(AuditAction.create(a).value).toBe(a);
    }
  });

  it("reconstitute creates without validation", () => {
    const action = AuditAction.reconstitute("create");
    expect(action.value).toBe("create");
  });

  it("equals returns true for same value", () => {
    const a = AuditAction.create("create");
    const b = AuditAction.create("create");
    expect(a.equals(b)).toBe(true);
  });

  it("equals returns false for different values", () => {
    const a = AuditAction.create("create");
    const b = AuditAction.create("delete");
    expect(a.equals(b)).toBe(false);
  });
});

describe("AuditModule", () => {
  it("creates from valid module", () => {
    const mod = AuditModule.create("restaurant");
    expect(mod.value).toBe("restaurant");
  });

  it("is case insensitive", () => {
    const mod = AuditModule.create("RESERVATION");
    expect(mod.value).toBe("reservation");
  });

  it("throws for invalid module", () => {
    expect(() => AuditModule.create("invalid_module")).toThrow();
  });

  it("supports all valid modules", () => {
    const mods = [
      "restaurant", "table", "reservation", "customer", "employee",
      "user", "role", "permission", "auth", "audit",
      "notification", "organization", "branch", "settings", "system",
    ];
    for (const m of mods) {
      expect(AuditModule.create(m).value).toBe(m);
    }
  });

  it("reconstitute creates without validation", () => {
    const mod = AuditModule.reconstitute("restaurant");
    expect(mod.value).toBe("restaurant");
  });

  it("equals returns true for same value", () => {
    const a = AuditModule.create("user");
    const b = AuditModule.create("user");
    expect(a.equals(b)).toBe(true);
  });
});
