import { describe, it, expect } from "vitest";
import { ImageMetadata, OCI_VERSION, TABLEFLOW_LABEL_PREFIX } from "../ImageMetadata.js";

describe("ImageMetadata", () => {
  it("creates image metadata", () => {
    const meta = new ImageMetadata({
      name: "backend",
      version: "1.0.0",
      description: "Backend service",
      vendor: "TableFlow",
      labels: { "com.tableflow.team": "platform" },
      annotations: { "com.tableflow.commit": "abc123" },
      licenses: ["MIT"],
    });

    expect(meta.name).toBe("backend");
    expect(meta.version).toBe("1.0.0");
    expect(meta.vendor).toBe("TableFlow");
  });

  it("generates OCI-compliant labels", () => {
    const meta = new ImageMetadata({
      name: "backend",
      version: "2.0.0",
      description: "API Backend",
      vendor: "TableFlow",
      labels: {},
      annotations: {},
    });

    const labels = meta.toLabels();
    expect(labels["org.opencontainers.image.title"]).toBe("backend");
    expect(labels["org.opencontainers.image.version"]).toBe("2.0.0");
    expect(labels["org.opencontainers.image.description"]).toBe("API Backend");
    expect(labels["org.opencontainers.image.vendor"]).toBe("TableFlow");
  });

  it("generates tableflow-specific labels", () => {
    const meta = ImageMetadata.createDefault("backend", "1.0.0");
    const labels = meta.toLabels();

    expect(labels[`${TABLEFLOW_LABEL_PREFIX}.name`]).toBe("backend");
    expect(labels[`${TABLEFLOW_LABEL_PREFIX}.version`]).toBe("1.0.0");
  });

  it("generates annotations", () => {
    const meta = new ImageMetadata({
      name: "backend",
      version: "1.0.0",
      description: "",
      labels: {},
      annotations: { "com.tableflow.commit": "abc123" },
    });

    const annotations = meta.toAnnotations();
    expect(annotations["com.tableflow.commit"]).toBe("abc123");
  });

  it("produces a result object", () => {
    const meta = ImageMetadata.createDefault("backend", "1.0.0");
    const result = meta.toResult();

    expect(result.ociVersion).toBe(OCI_VERSION);
    expect(result.labels).toBeDefined();
    expect(result.created).toBeDefined();
  });

  it("creates default metadata for backend", () => {
    const meta = ImageMetadata.createBackend("1.0.0");
    expect(meta.name).toBe("backend");
    expect(meta.licenses).toContain("MIT");
    expect(meta.sourceRepository).toContain("github.com");
  });

  it("creates default metadata for frontend", () => {
    const meta = ImageMetadata.createFrontend("2.0.0");
    expect(meta.name).toBe("frontend");
    expect(meta.version).toBe("2.0.0");
  });

  it("includes custom labels", () => {
    const meta = new ImageMetadata({
      name: "backend",
      version: "1.0.0",
      description: "",
      labels: { "custom.label": "custom-value" },
      annotations: {},
    });

    const labels = meta.toLabels();
    expect(labels["custom.label"]).toBe("custom-value");
  });

  it("handles empty licenses", () => {
    const meta = new ImageMetadata({
      name: "backend",
      version: "1.0.0",
      description: "",
      labels: {},
      annotations: {},
    });

    const labels = meta.toLabels();
    expect(labels["org.opencontainers.image.licenses"]).toBe("");
  });

  it("exports OCI_VERSION constant", () => {
    expect(OCI_VERSION).toBe("1.1.0");
  });
});
