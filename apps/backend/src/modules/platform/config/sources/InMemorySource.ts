import { BaseSource } from "./ConfigurationSource.js";
import type { ConfigValue } from "../types.js";
import { coerceValue } from "../ConfigValue.js";

export class InMemorySource extends BaseSource {
  readonly name: string;
  readonly priority: number;
  private readonly values: Map<string, ConfigValue> = new Map();

  constructor(name: string, priority: number, values?: Record<string, ConfigValue>, enabled = true) {
    super(enabled);
    this.name = name;
    this.priority = priority;

    if (values) {
      for (const [key, value] of Object.entries(values)) {
        this.values.set(key, value);
      }
    }
  }

  async get(key: string): Promise<ConfigValue | undefined> {
    return this.values.get(key);
  }

  async has(key: string): Promise<boolean> {
    return this.values.has(key);
  }

  async getAll(): Promise<Map<string, ConfigValue>> {
    return new Map(this.values);
  }

  set(key: string, value: ConfigValue): void {
    this.values.set(key, value);
  }

  setMany(values: Record<string, ConfigValue>): void {
    for (const [key, value] of Object.entries(values)) {
      this.values.set(key, value);
    }
  }

  delete(key: string): boolean {
    return this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }

  size(): number {
    return this.values.size;
  }
}
