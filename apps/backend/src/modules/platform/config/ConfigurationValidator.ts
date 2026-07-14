import type { ConfigSchema, ConfigValue, ConfigValidationResult, ConfigValidationError, ConfigValueType } from "./types.js";

export function validateValue(value: ConfigValue | undefined, schema: ConfigSchema): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  if (value === undefined || value === null) {
    if (schema.required) {
      errors.push({
        key: schema.key,
        message: `Required configuration "${schema.key}" is missing`,
        code: "missing_required",
      });
    }

    return { valid: errors.length === 0, errors };
  }

  if (schema.type === "object" && schema.properties) {
    return validateObject(value as Record<string, unknown>, schema);
  }

  if (schema.type === "array" && schema.itemSchema && Array.isArray(value)) {
    return validateArrayItems(value as unknown[], schema);
  }

  validateType(value, schema, errors);
  validateRange(value, schema, errors);
  validateAllowedValues(value, schema, errors);
  validatePattern(value, schema, errors);
  validateLength(value, schema, errors);
  validateEnum(value, schema, errors);
  validateCustom(value, schema, errors);

  return { valid: errors.length === 0, errors };
}

export function validateObject(obj: Record<string, unknown>, schema: ConfigSchema): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  if (!schema.properties) {
    return { valid: true, errors: [] };
  }

  for (const [propKey, propSchema] of Object.entries(schema.properties)) {
    const propValue = propKey in obj ? obj[propKey] : undefined;

    if (propValue === undefined && propSchema.defaultValue !== undefined) {
      obj[propKey] = propSchema.defaultValue;

      continue;
    }

    const result = validateValue(propValue as ConfigValue, propSchema);

    errors.push(...result.errors);
  }

  return { valid: errors.length === 0, errors };
}

export function validateArrayItems(arr: unknown[], schema: ConfigSchema): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  if (!schema.itemSchema) {
    return { valid: true, errors: [] };
  }

  for (let i = 0; i < arr.length; i++) {
    const result = validateValue(arr[i] as ConfigValue, {
      ...schema.itemSchema,
      key: `${schema.key}[${i}]`,
    });

    errors.push(...result.errors);
  }

  return { valid: errors.length === 0, errors };
}

export class ConfigurationValidator {
  private readonly schemas: Map<string, ConfigSchema> = new Map();

  registerSchema(schema: ConfigSchema): void {
    this.schemas.set(schema.key, schema);
  }

  registerSchemas(schemas: ConfigSchema[]): void {
    for (const schema of schemas) {
      this.schemas.set(schema.key, schema);
    }
  }

  getSchema(key: string): ConfigSchema | undefined {
    return this.schemas.get(key);
  }

  validate(key: string, value: ConfigValue | undefined): ConfigValidationResult {
    const schema = this.schemas.get(key);

    if (!schema) {
      return { valid: true, errors: [] };
    }

    return validateValue(value, schema);
  }

  validateAll(values: Map<string, ConfigValue | undefined>): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];

    for (const [key, value] of values) {
      const result = this.validate(key, value);

      errors.push(...result.errors);
    }

    return { valid: errors.length === 0, errors };
  }

  applyDefaults(value: ConfigValue | undefined, key: string): ConfigValue | undefined {
    if (value !== undefined && value !== null) {
      return value;
    }

    const schema = this.schemas.get(key);

    if (schema && schema.defaultValue !== undefined) {
      return schema.defaultValue;
    }

    return value;
  }
}

function validateType(value: unknown, schema: ConfigSchema, errors: ConfigValidationError[]): void {
  const typeValid = checkType(value, schema.type);

  if (!typeValid) {
    errors.push({
      key: schema.key,
      message: `Expected type "${schema.type}" but got "${typeof value}"`,
      code: "type_mismatch",
      expected: schema.type,
      actual: typeof value,
    });
  }
}

function checkType(value: unknown, type: ConfigValueType): boolean {
  switch (type) {
    case "string": { return typeof value === "string"; }
    case "number": { return typeof value === "number" && !Number.isNaN(value); }
    case "boolean": { return typeof value === "boolean"; }
    case "duration": { return typeof value === "object" && value !== null && "value" in value && "unit" in value; }
    case "array": { return Array.isArray(value); }
    case "object": { return typeof value === "object" && value !== null && !Array.isArray(value); }
    case "enum": { return typeof value === "string"; }
    default: { return true; }
  }
}

function validateRange(value: unknown, schema: ConfigSchema, errors: ConfigValidationError[]): void {
  if (schema.type === "number" && typeof value === "number") {
    if (schema.min !== undefined && value < schema.min) {
      errors.push({
        key: schema.key,
        message: `Value ${value} is below minimum ${schema.min}`,
        code: "value_out_of_range",
        expected: `>= ${schema.min}`,
        actual: String(value),
      });
    }

    if (schema.max !== undefined && value > schema.max) {
      errors.push({
        key: schema.key,
        message: `Value ${value} exceeds maximum ${schema.max}`,
        code: "value_out_of_range",
        expected: `<= ${schema.max}`,
        actual: String(value),
      });
    }
  }
}

function validateAllowedValues(value: unknown, schema: ConfigSchema, errors: ConfigValidationError[]): void {
  if (!schema.allowedValues || schema.allowedValues.length === 0) {
    return;
  }

  const isAllowed = schema.allowedValues.some((av) => av === value);

  if (!isAllowed) {
    errors.push({
      key: schema.key,
      message: `Value "${String(value)}" is not in allowed values: ${schema.allowedValues.join(", ")}`,
      code: "value_not_allowed",
      expected: schema.allowedValues.join(", "),
      actual: String(value),
    });
  }
}

function validatePattern(value: unknown, schema: ConfigSchema, errors: ConfigValidationError[]): void {
  if (!schema.pattern || typeof value !== "string") {
    return;
  }

  const regex = new RegExp(schema.pattern);

  if (!regex.test(value)) {
    errors.push({
      key: schema.key,
      message: `Value "${value}" does not match pattern ${schema.pattern}`,
      code: "pattern_mismatch",
      expected: schema.pattern,
      actual: value,
    });
  }
}

function validateLength(value: unknown, schema: ConfigSchema, errors: ConfigValidationError[]): void {
  if (typeof value !== "string") {
    return;
  }

  if (schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push({
      key: schema.key,
      message: `Length ${value.length} is below minimum ${schema.minLength}`,
      code: "min_length_exceeded",
      expected: `>= ${schema.minLength}`,
      actual: String(value.length),
    });
  }

  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    errors.push({
      key: schema.key,
      message: `Length ${value.length} exceeds maximum ${schema.maxLength}`,
      code: "max_length_exceeded",
      expected: `<= ${schema.maxLength}`,
      actual: String(value.length),
    });
  }
}

function validateEnum(value: unknown, schema: ConfigSchema, errors: ConfigValidationError[]): void {
  if (schema.type !== "enum" || !schema.enumValues || typeof value !== "string") {
    return;
  }

  const isValid = schema.enumValues.includes(value);

  if (!isValid) {
    errors.push({
      key: schema.key,
      message: `Value "${value}" is not a valid enum value. Allowed: ${schema.enumValues.join(", ")}`,
      code: "invalid_enum",
      expected: schema.enumValues.join(", "),
      actual: value,
    });
  }
}

function validateCustom(value: ConfigValue, schema: ConfigSchema, errors: ConfigValidationError[]): void {
  if (!schema.validator) {
    return;
  }

  try {
    const result = schema.validator(value, schema);

    if (!result.valid) {
      errors.push(...result.errors);
    }
  } catch (error) {
    errors.push({
      key: schema.key,
      message: `Custom validation threw: ${error instanceof Error ? error.message : String(error)}`,
      code: "custom_validation_failed",
    });
  }
}
