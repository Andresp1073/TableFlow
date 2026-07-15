import { describe, it, expect } from "vitest";
import { ArtifactDefinition } from "../ArtifactDefinition.js";
import { PipelineValidationError } from "../errors.js";

describe("ArtifactDefinition", () => {
  it("creates an artifact definition", () => {
    const artifact = new ArtifactDefinition({
      type: "backend_package",
      name: "Backend Package",
      path: "dist/backend.tar.gz",
    });

    expect(artifact.type).toBe("backend_package");
    expect(artifact.name).toBe("Backend Package");
    expect(artifact.path).toBe("dist/backend.tar.gz");
    expect(artifact.retentionDays).toBe(90);
    expect(artifact.compress).toBe(true);
  });

  it("throws on invalid type", () => {
    expect(() =>
      new ArtifactDefinition({
        type: "invalid_type" as never,
        name: "Bad",
        path: "/tmp",
      }),
    ).toThrow(PipelineValidationError);
  });

  it("accepts valid artifact types", () => {
    const types = ["backend_package", "docker_image", "documentation", "coverage_report", "openapi_specification"] as const;

    for (const type of types) {
      const artifact = new ArtifactDefinition({ type, name: type, path: `/tmp/${type}` });
      expect(artifact.type).toBe(type);
    }
  });

  it("creates a published artifact result", () => {
    const artifact = new ArtifactDefinition({
      type: "backend_package",
      name: "Backend",
      path: "dist/pkg.tar.gz",
      retentionDays: 30,
    });

    const result = artifact.createResult("1.0.0", "published");

    expect(result.id).toBeDefined();
    expect(result.type).toBe("backend_package");
    expect(result.name).toBe("Backend");
    expect(result.version).toBe("1.0.0");
    expect(result.status).toBe("published");
    expect(result.path).toBe("dist/pkg.tar.gz");
    expect(result.retentionExpiresAt).toBeDefined();
  });

  it("creates a pending artifact result", () => {
    const artifact = new ArtifactDefinition({
      type: "docker_image",
      name: "Docker Image",
      path: "tableflow:latest",
    });

    const result = artifact.createResult("2.0.0", "building");

    expect(result.status).toBe("building");
    expect(result.publishedAt).toBeUndefined();
  });

  it("creates a failed artifact result", () => {
    const artifact = new ArtifactDefinition({
      type: "documentation",
      name: "Docs",
      path: "docs/",
    });

    const result = artifact.createResult("1.0.0", "failed");

    expect(result.status).toBe("failed");
    expect(result.publishedAt).toBeUndefined();
  });
});
