export interface SafetyConfigData {
  id: string;
  restaurantId: string;
  promptValidation: PromptValidationConfig;
  outputValidation: OutputValidationConfig;
  piiMasking: PIIMaskingConfig;
  rateLimiting: RateLimitingConfig;
  auditTrail: AuditTrailConfig;
  usageTracking: UsageTrackingConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptValidationConfig {
  enabled: boolean;
  maxPromptLength: number;
  blockedPatterns: string[];
  allowedCategories: string[];
}

export interface OutputValidationConfig {
  enabled: boolean;
  maxOutputLength: number;
  blockedContentPatterns: string[];
  requireJsonFormat: boolean;
}

export interface PIIMaskingConfig {
  enabled: boolean;
  patterns: PIIPattern[];
  replacementText: string;
}

export interface PIIPattern {
  name: string;
  pattern: string;
  description?: string;
}

export interface RateLimitingConfig {
  enabled: boolean;
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
  maxConcurrentRequests: number;
}

export interface AuditTrailConfig {
  enabled: boolean;
  retentionDays: number;
  logPromptContents: boolean;
  logResponseContents: boolean;
}

export interface UsageTrackingConfig {
  enabled: boolean;
  trackTokenUsage: boolean;
  trackCost: boolean;
  costPerPromptToken: number;
  costPerCompletionToken: number;
}

export class SafetyConfig {
  private constructor(private readonly config: SafetyConfigData) {}

  static create(config: Omit<SafetyConfigData, "createdAt" | "updatedAt">): SafetyConfig {
    const now = new Date();
    return new SafetyConfig({ ...config, createdAt: now, updatedAt: now });
  }

  static reconstitute(config: SafetyConfigData): SafetyConfig {
    return new SafetyConfig(config);
  }

  get id(): string { return this.config.id; }
  get restaurantId(): string { return this.config.restaurantId; }
  get promptValidation(): PromptValidationConfig { return this.config.promptValidation; }
  get outputValidation(): OutputValidationConfig { return this.config.outputValidation; }
  get piiMasking(): PIIMaskingConfig { return this.config.piiMasking; }
  get rateLimiting(): RateLimitingConfig { return this.config.rateLimiting; }
  get auditTrail(): AuditTrailConfig { return this.config.auditTrail; }
  get usageTracking(): UsageTrackingConfig { return this.config.usageTracking; }
  get isActive(): boolean { return this.config.isActive; }

  validatePrompt(prompt: string): string[] {
    const errors: string[] = [];
    if (!this.config.promptValidation.enabled) return errors;
    if (prompt.length > this.config.promptValidation.maxPromptLength) {
      errors.push(`Prompt exceeds max length of ${this.config.promptValidation.maxPromptLength}`);
    }
    for (const pattern of this.config.promptValidation.blockedPatterns) {
      const regex = new RegExp(pattern, "i");
      if (regex.test(prompt)) {
        errors.push(`Prompt contains blocked pattern: ${pattern}`);
      }
    }
    return errors;
  }

  validateOutput(output: string): string[] {
    const errors: string[] = [];
    if (!this.config.outputValidation.enabled) return errors;
    if (output.length > this.config.outputValidation.maxOutputLength) {
      errors.push(`Output exceeds max length of ${this.config.outputValidation.maxOutputLength}`);
    }
    for (const pattern of this.config.outputValidation.blockedContentPatterns) {
      const regex = new RegExp(pattern, "i");
      if (regex.test(output)) {
        errors.push(`Output contains blocked content pattern: ${pattern}`);
      }
    }
    if (this.config.outputValidation.requireJsonFormat) {
      try { JSON.parse(output); } catch { errors.push("Output is not valid JSON"); }
    }
    return errors;
  }

  maskPII(text: string): string {
    if (!this.config.piiMasking.enabled) return text;
    let masked = text;
    for (const pattern of this.config.piiMasking.patterns) {
      const regex = new RegExp(pattern.pattern, "gi");
      masked = masked.replace(regex, this.config.piiMasking.replacementText);
    }
    return masked;
  }

  calculateCost(promptTokens: number, completionTokens: number): number {
    if (!this.config.usageTracking.enabled || !this.config.usageTracking.trackCost) return 0;
    return (promptTokens * this.config.usageTracking.costPerPromptToken) +
           (completionTokens * this.config.usageTracking.costPerCompletionToken);
  }
}
