export type AIRequestStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
export type AIExecutionMode = "sync" | "async" | "streaming" | "batch";

export interface AIRequestConfig {
  id: string;
  restaurantId: string;
  promptTemplateId?: string;
  provider: string;
  model: string;
  prompt: string;
  variables: Record<string, unknown>;
  executionMode: AIExecutionMode;
  maxTokens: number;
  temperature: number;
  status: AIRequestStatus;
  result?: string;
  error?: string;
  processingTimeMs?: number;
  tokenUsage?: TokenUsage;
  requestedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export class AIRequest {
  private constructor(private readonly config: AIRequestConfig) {}

  static create(config: Omit<AIRequestConfig, "status" | "requestedAt">): AIRequest {
    return new AIRequest({ ...config, status: "pending", requestedAt: new Date() });
  }

  static reconstitute(config: AIRequestConfig): AIRequest {
    return new AIRequest(config);
  }

  get id(): string { return this.config.id; }
  get restaurantId(): string { return this.config.restaurantId; }
  get promptTemplateId(): string | undefined { return this.config.promptTemplateId; }
  get provider(): string { return this.config.provider; }
  get model(): string { return this.config.model; }
  get prompt(): string { return this.config.prompt; }
  get variables(): Record<string, unknown> { return this.config.variables; }
  get executionMode(): AIExecutionMode { return this.config.executionMode; }
  get maxTokens(): number { return this.config.maxTokens; }
  get temperature(): number { return this.config.temperature; }
  get status(): AIRequestStatus { return this.config.status; }
  get result(): string | undefined { return this.config.result; }
  get error(): string | undefined { return this.config.error; }
  get processingTimeMs(): number | undefined { return this.config.processingTimeMs; }
  get tokenUsage(): TokenUsage | undefined { return this.config.tokenUsage; }
  get requestedAt(): Date { return this.config.requestedAt; }
  get completedAt(): Date | undefined { return this.config.completedAt; }

  markProcessing(): AIRequest {
    return AIRequest.reconstitute({ ...this.config, status: "processing" });
  }

  complete(result: string, tokenUsage: TokenUsage, processingTimeMs: number): AIRequest {
    return AIRequest.reconstitute({
      ...this.config,
      status: "completed",
      result,
      tokenUsage,
      processingTimeMs,
      completedAt: new Date(),
    });
  }

  fail(error: string): AIRequest {
    return AIRequest.reconstitute({
      ...this.config,
      status: "failed",
      error,
      completedAt: new Date(),
    });
  }

  cancel(): AIRequest {
    return AIRequest.reconstitute({ ...this.config, status: "cancelled" });
  }

  isTerminal(): boolean {
    return this.config.status === "completed" || this.config.status === "failed" || this.config.status === "cancelled";
  }

  duration(): number | undefined {
    if (!this.config.completedAt) return undefined;
    return this.config.completedAt.getTime() - this.config.requestedAt.getTime();
  }
}
