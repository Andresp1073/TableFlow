import type {
  InvalidationRule,
  InvalidationContext,
  CacheInvalidationResult,
  CacheProvider,
} from "./types.js";

export class CacheInvalidationCoordinator {
  private readonly rules: Map<string, InvalidationRule> = new Map();

  constructor(private readonly cacheProvider: CacheProvider) {}

  registerRule(rule: InvalidationRule): void {
    this.rules.set(rule.name, rule);
  }

  unregisterRule(name: string): void {
    this.rules.delete(name);
  }

  getRule(name: string): InvalidationRule | undefined {
    return this.rules.get(name);
  }

  listRules(): InvalidationRule[] {
    return Array.from(this.rules.values());
  }

  async invalidate(context: InvalidationContext): Promise<CacheInvalidationResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    let rulesApplied = 0;
    let invalidatedKeys = 0;

    const sortedRules = this.getSortedRules();

    for (const rule of sortedRules) {
      if (!this.matchesContext(rule, context)) {
        continue;
      }

      try {
        const keys = rule.getKeys(context);

        if (keys.length > 0) {
          const deleted = await this.cacheProvider.mdelete(keys);

          invalidatedKeys += deleted;
        }

        rulesApplied++;
      } catch (error) {
        errors.push(`Rule "${rule.name}": ${(error as Error).message}`);
      }
    }

    const duration = performance.now() - startTime;

    return {
      success: errors.length === 0,
      invalidatedKeys,
      rulesApplied,
      errors,
      duration,
    };
  }

  async invalidateEntity(entityType: string, entityId: string): Promise<CacheInvalidationResult> {
    return this.invalidate({ entityType, entityId, strategy: "entity" });
  }

  async invalidateModule(module: string): Promise<CacheInvalidationResult> {
    return this.invalidate({ module, strategy: "module" });
  }

  async invalidatePattern(pattern: string): Promise<CacheInvalidationResult> {
    return this.invalidate({ pattern, strategy: "pattern" });
  }

  async invalidateAll(keys: string[]): Promise<CacheInvalidationResult> {
    const startTime = performance.now();
    let invalidatedKeys = 0;

    try {
      invalidatedKeys = await this.cacheProvider.mdelete(keys);
    } catch (error) {
      const duration = performance.now() - startTime;

      return {
        success: false,
        invalidatedKeys: 0,
        rulesApplied: 0,
        errors: [(error as Error).message],
        duration,
      };
    }

    const duration = performance.now() - startTime;

    return {
      success: true,
      invalidatedKeys,
      rulesApplied: 0,
      errors: [],
      duration,
    };
  }

  async clear(): Promise<void> {
    this.rules.clear();
  }

  private getSortedRules(): InvalidationRule[] {
    return Array.from(this.rules.values()).sort((a, b) => b.priority - a.priority);
  }

  private matchesContext(rule: InvalidationRule, context: InvalidationContext): boolean {
    switch (rule.strategy) {
      case "entity": {
        return rule.entityType === context.entityType;
      }
      case "module": {
        return rule.module === context.module;
      }
      case "pattern": {
        if (!rule.pattern) {
          return false;
        }

        if (!context.pattern) {
          return true;
        }

        return context.pattern.includes(rule.pattern) || rule.pattern.includes(context.pattern);
      }
      case "dependency": {
        if (!rule.entityType) {
          return false;
        }

        return rule.entityType === context.entityType;
      }
      default: {
        return false;
      }
    }
  }
}
