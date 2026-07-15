import { describe, it, expect } from "vitest";
import { DashboardDefinition } from "../DashboardDefinition.js";
import { MonitoringValidationError } from "../errors.js";

describe("DashboardDefinition", () => {
  const section = { title: "CPU", type: "chart" as const, metric: "cpu_usage", width: 6 as const, height: 300 };

  it("creates a platform dashboard", () => {
    const dashboard = DashboardDefinition.createPlatform("platform-overview", [section]);
    expect(dashboard.name).toBe("platform-overview");
    expect(dashboard.type).toBe("platform");
    expect(dashboard.title).toBe("Platform Overview");
  });

  it("creates an application dashboard", () => {
    const dashboard = DashboardDefinition.createApplication("app-perf", [section]);
    expect(dashboard.type).toBe("application");
    expect(dashboard.autoRefreshMs).toBe(15_000);
  });

  it("creates an infrastructure dashboard", () => {
    const dashboard = DashboardDefinition.createInfrastructure("infra-health", [section]);
    expect(dashboard.type).toBe("infrastructure");
    expect(dashboard.autoRefreshMs).toBe(60_000);
  });

  it("creates a business dashboard", () => {
    const dashboard = DashboardDefinition.createBusiness("business-kpi", [section]);
    expect(dashboard.type).toBe("business");
    expect(dashboard.timeRangeDefaultMs).toBe(86_400_000);
  });

  it("throws on empty name", () => {
    expect(() =>
      new DashboardDefinition({ name: "", type: "platform", title: "Test", sections: [section] }),
    ).toThrow(MonitoringValidationError);
  });

  it("throws on invalid type", () => {
    expect(() =>
      new DashboardDefinition({ name: "test", type: "invalid" as never, title: "Test", sections: [section] }),
    ).toThrow(MonitoringValidationError);
  });

  it("throws on empty sections", () => {
    expect(() =>
      new DashboardDefinition({ name: "test", type: "platform", title: "Test", sections: [] }),
    ).toThrow(MonitoringValidationError);
  });

  it("converts to result", () => {
    const dashboard = DashboardDefinition.createPlatform("metrics", [
      { title: "CPU", type: "chart", metric: "cpu", width: 6, height: 300 },
      { title: "Memory", type: "stat", metric: "memory", width: 3, height: 200 },
    ]);

    const result = dashboard.toResult();
    expect(result.name).toBe("metrics");
    expect(result.sections).toHaveLength(2);
    expect(result.tags).toContain("platform");
  });
});
