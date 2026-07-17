export interface PromptContextConfig {
  id: string;
  restaurantId: string;
  requestId: string;
  promptTemplateId?: string;
  renderedPrompt: string;
  variables: Record<string, unknown>;
  validationErrors: string[];
  renderedAt: Date;
  metadata?: Record<string, unknown>;
}

export class PromptContext {
  private constructor(private readonly config: PromptContextConfig) {}

  static create(config: Omit<PromptContextConfig, "renderedAt">): PromptContext {
    return new PromptContext({ ...config, renderedAt: new Date() });
  }

  static reconstitute(config: PromptContextConfig): PromptContext {
    return new PromptContext(config);
  }

  get id(): string { return this.config.id; }
  get restaurantId(): string { return this.config.restaurantId; }
  get requestId(): string { return this.config.requestId; }
  get promptTemplateId(): string | undefined { return this.config.promptTemplateId; }
  get renderedPrompt(): string { return this.config.renderedPrompt; }
  get variables(): Record<string, unknown> { return this.config.variables; }
  get validationErrors(): string[] { return this.config.validationErrors; }
  get renderedAt(): Date { return this.config.renderedAt; }

  isValid(): boolean {
    return this.config.validationErrors.length === 0;
  }
}
