import { describe, it, expect } from "vitest";
import { DeploymentTarget, DeploymentTargetFactory } from "../DeploymentTarget.js";
import { PipelineValidationError } from "../errors.js";

describe("DeploymentTarget", () => {
  it("creates a deployment target", () => {
    const target = new DeploymentTarget({
      type: "production",
      name: "Production",
      url: "https://app.tableflow.com",
      requiredApproval: true,
    });

    expect(target.type).toBe("production");
    expect(target.name).toBe("Production");
    expect(target.requiredApproval).toBe(true);
    expect(target.autoRollback).toBe(true);
  });

  it("throws on invalid type", () => {
    expect(() =>
      new DeploymentTarget({
        type: "invalid_type" as never,
        name: "Bad",
      }),
    ).toThrow(PipelineValidationError);
  });

  it("accepts valid deployment target types", () => {
    const types = ["development", "testing", "staging", "production"] as const;

    for (const type of types) {
      const target = new DeploymentTarget({ type, name: type });
      expect(target.type).toBe(type);
    }
  });

  it("checks branch authorization", () => {
    const target = new DeploymentTarget({
      type: "production",
      name: "Production",
      allowedBranches: ["main", "master"],
    });

    expect(target.canDeploy("main").allowed).toBe(true);
    expect(target.canDeploy("develop").allowed).toBe(false);
    expect(target.canDeploy(undefined).allowed).toBe(false);
  });

  it("allows any branch when no restrictions set", () => {
    const target = new DeploymentTarget({
      type: "development",
      name: "Dev",
    });

    expect(target.canDeploy("feature/test").allowed).toBe(true);
    expect(target.canDeploy(undefined).allowed).toBe(true);
  });

  it("checks approval requirement", () => {
    const autoTarget = new DeploymentTarget({ type: "production", name: "Prod", requiredApproval: true });
    expect(autoTarget.requiresApproval()).toBe(true);

    const directTarget = new DeploymentTarget({ type: "development", name: "Dev", requiredApproval: false });
    expect(directTarget.requiresApproval()).toBe(false);
  });

  it("creates a deployment result", () => {
    const target = new DeploymentTarget({
      type: "production",
      name: "Production",
      url: "https://app.tableflow.com",
    });

    const result = target.createDeploymentResult("deploying");

    expect(result.type).toBe("production");
    expect(result.name).toBe("Production");
    expect(result.status).toBe("deploying");
    expect(result.url).toBe("https://app.tableflow.com");
  });

  it("creates a deployment result with overrides", () => {
    const target = new DeploymentTarget({
      type: "production",
      name: "Production",
    });

    const now = new Date();
    const result = target.createDeploymentResult("deployed", {
      deployedAt: now,
      deployedBy: "ci-bot",
      version: "1.0.0",
    });

    expect(result.status).toBe("deployed");
    expect(result.deployedAt).toEqual(now);
    expect(result.deployedBy).toBe("ci-bot");
    expect(result.version).toBe("1.0.0");
  });
});

describe("DeploymentTargetFactory", () => {
  it("creates development target", () => {
    const target = DeploymentTargetFactory.createDevelopment();
    expect(target.type).toBe("development");
    expect(target.requiredApproval).toBe(false);
    expect(target.autoRollback).toBe(false);
  });

  it("creates testing target", () => {
    const target = DeploymentTargetFactory.createTesting();
    expect(target.type).toBe("testing");
    expect(target.requiredApproval).toBe(false);
    expect(target.allowedBranches).toContain("develop");
    expect(target.requiredChecks).toContain("unit_tests");
  });

  it("creates staging target", () => {
    const target = DeploymentTargetFactory.createStaging();
    expect(target.type).toBe("staging");
    expect(target.requiredApproval).toBe(true);
    expect(target.allowedBranches).toContain("release/*");
    expect(target.requiredChecks).toContain("security_scan");
  });

  it("creates production target", () => {
    const target = DeploymentTargetFactory.createProduction();
    expect(target.type).toBe("production");
    expect(target.requiredApproval).toBe(true);
    expect(target.allowedBranches).toContain("main");
    expect(target.requiredChecks).toContain("coverage");
    expect(target.maxConcurrentDeployments).toBe(1);
    expect(target.autoRollback).toBe(true);
  });

  it("creates targets with overrides", () => {
    const target = DeploymentTargetFactory.createProduction({
      url: "https://app.tableflow.com",
      maxConcurrentDeployments: 2,
    });

    expect(target.url).toBe("https://app.tableflow.com");
    expect(target.maxConcurrentDeployments).toBe(2);
  });
});
