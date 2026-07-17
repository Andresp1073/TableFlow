export class PromptExecuted {
  constructor(
    public readonly requestId: string,
    public readonly restaurantId: string,
    public readonly promptTemplateId: string | undefined,
    public readonly provider: string,
    public readonly model: string,
    public readonly processingTimeMs: number,
    public readonly tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number },
    public readonly occurredAt: Date = new Date(),
  ) {}
}
