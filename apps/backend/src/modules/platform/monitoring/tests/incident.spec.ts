import { describe, it, expect } from "vitest";
import { IncidentDefinition, IncidentManager } from "../IncidentDefinition.js";
import { MonitoringValidationError } from "../errors.js";

describe("IncidentDefinition", () => {
  it("creates a sev0 incident", () => {
    const incident = IncidentDefinition.createSev0("Production Down", "API is not responding", "backend");
    expect(incident.title).toBe("Production Down");
    expect(incident.severity).toBe("sev0");
    expect(incident.tags).toContain("sev0");
  });

  it("creates a sev1 incident", () => {
    const incident = IncidentDefinition.createSev1("High Error Rate", "5xx errors above 5%", "api");
    expect(incident.severity).toBe("sev1");
  });

  it("creates a sev2 incident", () => {
    const incident = IncidentDefinition.createSev2("Elevated Latency", "P99 latency above 500ms");
    expect(incident.severity).toBe("sev2");
  });

  it("throws on empty title", () => {
    expect(() =>
      new IncidentDefinition({ title: "", description: "desc", severity: "sev2" }),
    ).toThrow(MonitoringValidationError);
  });

  it("throws on empty description", () => {
    expect(() =>
      new IncidentDefinition({ title: "title", description: "", severity: "sev2" }),
    ).toThrow(MonitoringValidationError);
  });

  it("creates a result with timeline", () => {
    const definition = IncidentDefinition.createSev0("Outage", "Service down", "backend");
    const result = definition.createResult();
    expect(result.status).toBe("firing");
    expect(result.timeline).toHaveLength(1);
    expect(result.timeline[0]!.type).toBe("created");
    expect(result.id).toBeDefined();
  });
});

describe("IncidentManager", () => {
  it("creates and retrieves an incident", () => {
    const manager = new IncidentManager();
    const incident = manager.create({
      title: "Database Slow",
      description: "Query times increasing",
      severity: "sev2",
      service: "database",
    });

    expect(incident.id).toBeDefined();
    expect(incident.status).toBe("firing");

    const retrieved = manager.get(incident.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.title).toBe("Database Slow");
  });

  it("updates incident status", () => {
    const manager = new IncidentManager();
    const incident = manager.create({
      title: "API Errors",
      description: "Error rate spike",
      severity: "sev1",
    });

    const acknowledged = manager.updateStatus(incident.id, "acknowledged", "oncall@example.com");
    expect(acknowledged).toBeDefined();
    expect(acknowledged!.status).toBe("acknowledged");
    expect(acknowledged!.acknowledgedAt).toBeDefined();

    const resolved = manager.updateStatus(incident.id, "resolved", "engineer@example.com", "Fixed by scaling up");
    expect(resolved!.status).toBe("resolved");
    expect(resolved!.resolvedAt).toBeDefined();
    expect(resolved!.durationMs).toBeDefined();
  });

  it("adds timeline entries", () => {
    const manager = new IncidentManager();
    const incident = manager.create({
      title: "Cache Miss",
      description: "Redis cache miss rate high",
      severity: "sev3",
    });

    const updated = manager.addTimelineEntry(incident.id, "note", "Investigating root cause", "sre@example.com");
    expect(updated).toBeDefined();
    expect(updated!.timeline).toHaveLength(2);
  });

  it("returns undefined for unknown incident ops", () => {
    const manager = new IncidentManager();
    expect(manager.get("unknown")).toBeUndefined();
    expect(manager.updateStatus("unknown", "resolved")).toBeUndefined();
    expect(manager.addTimelineEntry("unknown", "note", "test")).toBeUndefined();
  });

  it("lists incidents filtered by status", () => {
    const manager = new IncidentManager();
    manager.create({ title: "Incident A", description: "Desc A", severity: "sev2" });

    const sev2List = manager.list();
    expect(sev2List.length).toBeGreaterThan(0);

    const resolvedList = manager.list("resolved");
    expect(resolvedList).toHaveLength(0);
  });
});
