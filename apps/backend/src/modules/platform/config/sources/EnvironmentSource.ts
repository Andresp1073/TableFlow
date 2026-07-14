import { BaseSource } from "./ConfigurationSource.js";
import type { ConfigValue } from "../types.js";
import { coerceValue } from "../ConfigValue.js";

export class EnvironmentSource extends BaseSource {
  readonly name = "environment";
  readonly priority: number;
  private readonly prefix: string;
  private readonly separator: string;

  constructor(priority = 0, prefix = "", separator = "__", enabled = true) {
    super(enabled);
    this.priority = priority;
    this.prefix = prefix;
    this.separator = separator;
  }

  async get(key: string): Promise<ConfigValue | undefined> {
    const envKey = this.toEnvKey(key);
    const value = process.env[envKey];

    if (value === undefined) {
      return undefined;
    }

    return this.parseValue(value);
  }

  async has(key: string): Promise<boolean> {
    const envKey = this.toEnvKey(key);

    return process.env[envKey] !== undefined;
  }

  async getAll(): Promise<Map<string, ConfigValue>> {
    const result = new Map<string, ConfigValue>();

    for (const [envKey, value] of Object.entries(process.env)) {
      if (this.prefix && !envKey.startsWith(this.prefix)) {
        continue;
      }

      const configKey = this.fromEnvKey(envKey);

      if (value !== undefined) {
        result.set(configKey, this.parseValue(value));
      }
    }

    return result;
  }

  private toEnvKey(key: string): string {
    const envKey = key.replace(/\./g, this.separator).replace(/-/g, "_").toUpperCase();

    return this.prefix ? `${this.prefix}${envKey}` : envKey;
  }

  private fromEnvKey(envKey: string): string {
    let key = this.prefix ? envKey.slice(this.prefix.length) : envKey;

    key = key.replace(/_/g, ".").toLowerCase();

    return key;
  }

  private parseValue(value: string): ConfigValue {
    const lower = value.toLowerCase();

    if (lower === "true") { return true; }
    if (lower === "false") { return false; }

    const num = Number(value);

    if (!Number.isNaN(num) && value.trim() !== "") {
      return num;
    }

    if (value.startsWith("{") || value.startsWith("[")) {
      try {
        return JSON.parse(value) as ConfigValue;
      } catch {
        return value;
      }
    }

    return value;
  }
}
