import type { SecretSource, SecretType, Secret, SecretPayload } from "./types.js";

export class SecretResolver {
  private readonly sources: Map<string, SecretSource> = new Map();

  addSource(source: SecretSource): void {
    this.sources.set(source.name, source);
  }

  removeSource(name: string): void {
    this.sources.delete(name);
  }

  getSources(): SecretSource[] {
    return Array.from(this.sources.values());
  }

  getSortedSources(): SecretSource[] {
    return Array.from(this.sources.values())
      .filter((s) => s.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  hasSource(name: string): boolean {
    return this.sources.has(name);
  }

  async resolve<T extends SecretPayload>(type: SecretType, key: string): Promise<Secret | null> {
    const sortedSources = this.getSortedSources();

    for (const source of sortedSources) {
      const secret = await source.get(type, key);

      if (secret !== null) {
        return secret;
      }
    }

    return null;
  }

  async exists(type: SecretType, key: string): Promise<boolean> {
    const sortedSources = this.getSortedSources();

    for (const source of sortedSources) {
      const found = await source.has(type, key);

      if (found) {
        return true;
      }
    }

    return false;
  }

  async resolveAll(): Promise<Secret[]> {
    const sortedSources = this.getSortedSources();
    const secrets = new Map<string, Secret>();

    for (const source of sortedSources) {
      const sourceSecrets = await source.getAll();

      for (const secret of sourceSecrets) {
        const existingKey = `${secret.metadata.type}:${secret.metadata.key}`;

        if (!secrets.has(existingKey)) {
          secrets.set(existingKey, secret);
        }
      }
    }

    return Array.from(secrets.values());
  }
}
