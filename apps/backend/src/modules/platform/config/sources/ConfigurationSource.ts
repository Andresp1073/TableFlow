import type { ConfigSource, ConfigValue } from "../types.js";

export abstract class BaseSource implements ConfigSource {
  abstract readonly name: string;
  abstract readonly priority: number;
  readonly enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  abstract get(key: string): Promise<ConfigValue | undefined>;

  async getMany(keys: string[]): Promise<Map<string, ConfigValue | undefined>> {
    const results = new Map<string, ConfigValue | undefined>();

    for (const key of keys) {
      results.set(key, await this.get(key));
    }

    return results;
  }

  abstract has(key: string): Promise<boolean>;

  abstract getAll(): Promise<Map<string, ConfigValue>>;
}
