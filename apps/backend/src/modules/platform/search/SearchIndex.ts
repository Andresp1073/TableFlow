import type {
  SearchIndexConfig,
  SearchIndexSettings,
  SearchFieldMapping,
  SearchProviderConfig,
} from "./types.js";
import {
  IndexNotFoundError,
  IndexAlreadyExistsError,
  IndexOperationError,
} from "./errors.js";

export class SearchIndex {
  private readonly indexes = new Map<string, SearchIndexConfig>();

  constructor(private readonly config: SearchProviderConfig) {}

  create(config: SearchIndexConfig): boolean {
    const indexName = this.prefixedName(config.name);

    if (this.indexes.has(indexName)) {
      throw new IndexAlreadyExistsError(indexName);
    }

    const fullConfig: SearchIndexConfig = {
      ...config,
      name: indexName,
      settings: {
        ...config.settings,
      },
      mapping: config.mapping.map((m) => ({ ...m })),
    };

    this.indexes.set(indexName, fullConfig);
    return true;
  }

  delete(name: string): boolean {
    const indexName = this.resolveName(name);

    if (!this.indexes.has(indexName)) {
      return false;
    }

    this.indexes.delete(indexName);
    return true;
  }

  rebuild(name: string): boolean {
    const indexName = this.resolveName(name);
    const config = this.indexes.get(indexName);

    if (!config) {
      throw new IndexNotFoundError(indexName);
    }

    const newVersion = config.version + 1;
    this.indexes.set(indexName, { ...config, version: newVersion });
    return true;
  }

  refresh(name: string): boolean {
    const indexName = this.resolveName(name);

    if (!this.indexes.has(indexName)) {
      throw new IndexNotFoundError(indexName);
    }

    return true;
  }

  get(name: string): SearchIndexConfig | null {
    const indexName = this.resolveName(name);
    return this.indexes.get(indexName) ?? null;
  }

  list(): string[] {
    return Array.from(this.indexes.keys());
  }

  exists(name: string): boolean {
    const indexName = this.resolveName(name);
    return this.indexes.has(indexName);
  }

  count(): number {
    return this.indexes.size;
  }

  clear(): void {
    this.indexes.clear();
  }

  getVersion(name: string): number | null {
    const config = this.get(name);
    return config?.version ?? null;
  }

  addMapping(name: string, mapping: SearchFieldMapping): boolean {
    const indexName = this.resolveName(name);
    const config = this.indexes.get(indexName);

    if (!config) {
      throw new IndexNotFoundError(indexName);
    }

    config.mapping.push(mapping);
    return true;
  }

  get prefix(): string {
    return this.config.indexPrefix;
  }

  resolveName(name: string): string {
    return this.prefixedName(name);
  }

  private prefixedName(name: string): string {
    if (name.startsWith(this.config.indexPrefix)) {
      return name;
    }
    return `${this.config.indexPrefix}${name}`;
  }
}
