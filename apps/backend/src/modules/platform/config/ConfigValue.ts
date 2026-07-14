import type { DurationConfig } from "./types.js";

export function createDuration(value: number, unit: DurationConfig["unit"]): DurationConfig {
  return { value, unit };
}

export function durationToMs(duration: DurationConfig): number {
  switch (duration.unit) {
    case "ms": { return duration.value; }
    case "s": { return duration.value * 1000; }
    case "m": { return duration.value * 60 * 1000; }
    case "h": { return duration.value * 60 * 60 * 1000; }
    case "d": { return duration.value * 24 * 60 * 60 * 1000; }
  }
}

export function durationToString(duration: DurationConfig): string {
  return `${duration.value}${duration.unit}`;
}

export function parseDuration(value: string): DurationConfig | undefined {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(value.trim().toLowerCase());

  if (!match) {
    return undefined;
  }

  return { value: parseInt(match[1], 10), unit: match[2] as DurationConfig["unit"] };
}

export function coerceValue(value: unknown, targetType: string): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  switch (targetType) {
    case "string": {
      if (typeof value === "string") { return value; }

      return String(value);
    }
    case "number": {
      if (typeof value === "number") { return value; }

      const parsed = Number(value);

      return Number.isNaN(parsed) ? undefined : parsed;
    }
    case "boolean": {
      if (typeof value === "boolean") { return value; }

      if (typeof value === "string") {
        if (["true", "1", "yes", "on"].includes(value.toLowerCase())) { return true; }

        if (["false", "0", "no", "off"].includes(value.toLowerCase())) { return false; }
      }

      if (typeof value === "number") {
        return value !== 0;
      }

      return undefined;
    }
    case "duration": {
      if (typeof value === "object" && value !== null && "value" in value && "unit" in value) {
        return value as DurationConfig;
      }

      if (typeof value === "string") {
        return parseDuration(value);
      }

      return undefined;
    }
    case "array": {
      if (Array.isArray(value)) { return value; }

      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);

          return Array.isArray(parsed) ? parsed : [value];
        } catch {
          return value.split(",").map((s) => s.trim());
        }
      }

      return [value];
    }
    case "object": {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return value as Record<string, unknown>;
      }

      if (typeof value === "string") {
        try {
          return JSON.parse(value) as Record<string, unknown>;
        } catch {
          return undefined;
        }
      }

      return undefined;
    }
    default: {
      return value;
    }
  }
}
