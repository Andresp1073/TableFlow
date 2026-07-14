import { describe, it, expect } from "vitest";
import { ConfigurationValidator, validateValue } from "../ConfigurationValidator.js";
import type { ConfigSchema } from "../types.js";

describe("ConfigurationValidator", () => {
  let validator: ConfigurationValidator;

  const schemas: ConfigSchema[] = [
    { key: "app.name", type: "string", required: true },
    { key: "app.port", type: "number", required: true, min: 80, max: 65535 },
    { key: "app.debug", type: "boolean", defaultValue: false },
    { key: "app.timeout", type: "duration", defaultValue: { value: 30, unit: "s" } },
    { key: "app.allowed_origins", type: "array", itemSchema: { key: "origin", type: "string" } },
    { key: "app.config", type: "object", properties: { db: { key: "db", type: "string", required: true }, pool: { key: "pool", type: "number", defaultValue: 10 } } },
    { key: "app.log_level", type: "enum", enumValues: ["debug", "info", "warn", "error"], defaultValue: "info" },
    { key: "app.host", type: "string", pattern: "^[a-zA-Z0-9.-]+$" },
  ];

  beforeEach(() => {
    validator = new ConfigurationValidator();
    validator.registerSchemas(schemas);
  });

  it("validates a correct value", () => {
    const result = validator.validate("app.name", "TableFlow");

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("reports missing required value", () => {
    const result = validator.validate("app.name", undefined);

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("missing_required");
  });

  it("reports type mismatch", () => {
    const result = validator.validate("app.port", "not_a_number");

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("type_mismatch");
  });

  it("reports value out of range", () => {
    const result = validator.validate("app.port", 70000);

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("value_out_of_range");
  });

  it("reports value below minimum", () => {
    const result = validator.validate("app.port", 10);

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("value_out_of_range");
  });

  it("validates enum values", () => {
    expect(validator.validate("app.log_level", "info").valid).toBe(true);
    expect(validator.validate("app.log_level", "invalid").valid).toBe(false);
    expect(validator.validate("app.log_level", "invalid").errors[0].code).toBe("invalid_enum");
  });

  it("validates pattern", () => {
    expect(validator.validate("app.host", "valid-host.com").valid).toBe(true);
    expect(validator.validate("app.host", "invalid host!").valid).toBe(false);
    expect(validator.validate("app.host", "invalid host!").errors[0].code).toBe("pattern_mismatch");
  });

  it("applies defaults for undefined values", () => {
    const result = validator.applyDefaults(undefined, "app.debug");

    expect(result).toBe(false);
  });

  it("returns original value when no default", () => {
    const result = validator.applyDefaults(undefined, "app.name");

    expect(result).toBeUndefined();
  });

  it("returns original value when value is defined", () => {
    const result = validator.applyDefaults("custom", "app.debug");

    expect(result).toBe("custom");
  });

  it("validates all values", () => {
    const values = new Map([
      ["app.name", "TableFlow"],
      ["app.port", 3000],
      ["app.debug", true],
      ["app.log_level", "invalid"],
    ]);

    const result = validator.validateAll(values);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].key).toBe("app.log_level");
  });

  it("returns valid for unknown keys", () => {
    const result = validator.validate("unknown.key", "value");

    expect(result.valid).toBe(true);
  });

  it("validates nested object properties", () => {
    const result = validator.validate("app.config", { db: "postgres", pool: 20 });

    expect(result.valid).toBe(true);
  });

  it("reports missing required nested property", () => {
    const result = validator.validate("app.config", { pool: 20 });

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("missing_required");
  });

  it("validates array items", () => {
    const result = validator.validate("app.allowed_origins", ["https://example.com", "https://app.com"]);

    expect(result.valid).toBe(true);
  });

  it("supports custom validators", () => {
    const customSchema: ConfigSchema = {
      key: "app.custom",
      type: "string",
      validator: (value) => {
        if (typeof value === "string" && value.startsWith("cfg_")) {
          return { valid: true, errors: [] };
        }

        return { valid: false, errors: [{ key: "app.custom", message: "Must start with cfg_", code: "custom_validation_failed" as const }] };
      },
    };

    validator.registerSchema(customSchema);

    expect(validator.validate("app.custom", "cfg_valid").valid).toBe(true);
    expect(validator.validate("app.custom", "invalid").valid).toBe(false);
  });
});

describe("validateValue standalone", () => {
  it("returns valid for no schema", () => {
    const result = validateValue("value", { key: "test", type: "string" });

    expect(result.valid).toBe(true);
  });

  it("reports undefined required with no type", () => {
    const result = validateValue(undefined, { key: "test", type: "string", required: true });

    expect(result.valid).toBe(false);
  });
});
