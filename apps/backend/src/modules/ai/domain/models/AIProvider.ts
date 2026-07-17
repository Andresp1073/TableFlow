export type ProviderType =
  | "openai"
  | "anthropic"
  | "gemini"
  | "azure_openai"
  | "ollama"
  | "lm_studio"
  | "custom";

export type ProviderStatus = "active" | "inactive" | "error" | "deprecated";

export interface AIProviderConfig {
  id: string;
  restaurantId: string;
  name: string;
  type: ProviderType;
  baseUrl?: string;
  apiKeyRef: string;
  models: string[];
  defaultModel: string;
  status: ProviderStatus;
  capabilities: ProviderCapabilities;
  rateLimit: RateLimitConfig;
  retryPolicy: RetryPolicyConfig;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ProviderCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
  embeddings: boolean;
  maxContextTokens: number;
  maxOutputTokens: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  concurrentRequests: number;
}

export interface RetryPolicyConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export class AIProvider {
  private constructor(private readonly config: AIProviderConfig) {}

  static create(config: Omit<AIProviderConfig, "createdAt" | "updatedAt">): AIProvider {
    const now = new Date();
    return new AIProvider({ ...config, createdAt: now, updatedAt: now });
  }

  static reconstitute(config: AIProviderConfig): AIProvider {
    return new AIProvider(config);
  }

  get id(): string { return this.config.id; }
  get restaurantId(): string { return this.config.restaurantId; }
  get name(): string { return this.config.name; }
  get type(): ProviderType { return this.config.type; }
  get baseUrl(): string | undefined { return this.config.baseUrl; }
  get apiKeyRef(): string { return this.config.apiKeyRef; }
  get models(): string[] { return this.config.models; }
  get defaultModel(): string { return this.config.defaultModel; }
  get status(): ProviderStatus { return this.config.status; }
  get capabilities(): ProviderCapabilities { return this.config.capabilities; }
  get rateLimit(): RateLimitConfig { return this.config.rateLimit; }
  get retryPolicy(): RetryPolicyConfig { return this.config.retryPolicy; }
  get priority(): number { return this.config.priority; }
  get isActive(): boolean { return this.config.isActive; }
  get createdAt(): Date { return this.config.createdAt; }
  get updatedAt(): Date { return this.config.updatedAt; }

  activate(): AIProvider {
    return AIProvider.reconstitute({ ...this.config, isActive: true, status: "active", updatedAt: new Date() });
  }

  deactivate(): AIProvider {
    return AIProvider.reconstitute({ ...this.config, isActive: false, status: "inactive", updatedAt: new Date() });
  }

  markError(): AIProvider {
    return AIProvider.reconstitute({ ...this.config, status: "error", updatedAt: new Date() });
  }

  supportsModel(model: string): boolean {
    return this.config.models.includes(model) || model === this.config.defaultModel;
  }
}
