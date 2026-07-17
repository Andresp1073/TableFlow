import type { TokenUsage } from "./AIRequest.js";

export interface AIResponseConfig {
  id: string;
  requestId: string;
  content: string;
  model: string;
  provider: string;
  finishReason: FinishReason;
  tokenUsage: TokenUsage;
  processingTimeMs: number;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export type FinishReason = "stop" | "length" | "content_filter" | "error" | "unknown";

export class AIResponse {
  private constructor(private readonly config: AIResponseConfig) {}

  static create(config: Omit<AIResponseConfig, "createdAt">): AIResponse {
    return new AIResponse({ ...config, createdAt: new Date() });
  }

  static reconstitute(config: AIResponseConfig): AIResponse {
    return new AIResponse(config);
  }

  get id(): string { return this.config.id; }
  get requestId(): string { return this.config.requestId; }
  get content(): string { return this.config.content; }
  get model(): string { return this.config.model; }
  get provider(): string { return this.config.provider; }
  get finishReason(): FinishReason { return this.config.finishReason; }
  get tokenUsage(): TokenUsage { return this.config.tokenUsage; }
  get processingTimeMs(): number { return this.config.processingTimeMs; }
  get createdAt(): Date { return this.config.createdAt; }

  succeeded(): boolean {
    return this.config.finishReason === "stop";
  }

  truncated(): boolean {
    return this.config.finishReason === "length";
  }

  filtered(): boolean {
    return this.config.finishReason === "content_filter";
  }
}
