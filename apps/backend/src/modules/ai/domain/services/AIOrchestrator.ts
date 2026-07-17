import type { AIRequestRepository } from "../repositories/AIRequestRepository.js";
import type { PredictionJobRepository } from "../repositories/PredictionJobRepository.js";
import type { PromptTemplateRepository } from "../repositories/PromptTemplateRepository.js";
import { AIRequest } from "../models/AIRequest.js";
import { AIResponse } from "../models/AIResponse.js";
import { PredictionJob } from "../models/PredictionJob.js";
import type { AIProvider } from "../models/AIProvider.js";
import type { AIProviderAdapter, ProviderExecutionResult } from "./AIProviderAdapter.js";
import { PromptEngine } from "./PromptEngine.js";
import { SafetyService } from "./SafetyService.js";
import { PredictionRequested } from "../events/PredictionRequested.js";
import { PredictionCompleted } from "../events/PredictionCompleted.js";
import { PromptExecuted } from "../events/PromptExecuted.js";
import { OpenAIAdapter, AnthropicAdapter, GeminiAdapter, AzureOpenAIAdapter, OllamaAdapter, LMStudioAdapter } from "./AIProviderAdapter.js";

export class AIOrchestrator {
  readonly promptEngine: PromptEngine;
  readonly safetyService: SafetyService;
  readonly events: unknown[] = [];
  private readonly adapters = new Map<string, AIProviderAdapter>();

  constructor(
    private readonly requestRepo: AIRequestRepository,
    private readonly jobRepo: PredictionJobRepository,
    private readonly templateRepo: PromptTemplateRepository,
  ) {
    this.promptEngine = new PromptEngine();
    this.safetyService = new SafetyService();
    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters(): void {
    const adapters: AIProviderAdapter[] = [
      new OpenAIAdapter(),
      new AnthropicAdapter(),
      new GeminiAdapter(),
      new AzureOpenAIAdapter(),
      new OllamaAdapter(),
      new LMStudioAdapter(),
    ];
    for (const adapter of adapters) {
      this.registerAdapter(adapter);
    }
  }

  registerAdapter(adapter: AIProviderAdapter): void {
    this.adapters.set(adapter.providerType, adapter);
  }

  getAdapter(providerType: string): AIProviderAdapter | undefined {
    return this.adapters.get(providerType);
  }

  listAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  async executeSync(
    request: AIRequest,
    provider: AIProvider,
  ): Promise<{ request: AIRequest; response: AIResponse }> {
    const adapter = this.adapters.get(provider.type);
    if (!adapter) throw new Error(`No adapter found for provider: ${provider.type}`);

    const validation = this.safetyService.validatePrompt(request.prompt);
    if (!validation.isValid) {
      const failed = request.fail(validation.errors.join("; "));
      await this.requestRepo.save(failed);
      throw new Error(`Prompt validation failed: ${validation.errors.join(", ")}`);
    }

    const maskedPrompt = this.safetyService.maskPII(request.prompt);
    const maskedRequest = AIRequest.reconstitute({ ...request["config"], prompt: maskedPrompt });

    const processing = maskedRequest.markProcessing();
    await this.requestRepo.save(processing);

    const result = await adapter.execute(processing, provider);
    const completed = processing.complete(result.content, result.tokenUsage, result.processingTimeMs);
    await this.requestRepo.save(completed);

    const maskedResponse = this.safetyService.maskPII(result.content);
    const response = AIResponse.create({
      id: crypto.randomUUID(),
      requestId: completed.id,
      content: maskedResponse,
      model: provider.defaultModel,
      provider: provider.type,
      finishReason: result.finishReason,
      tokenUsage: result.tokenUsage,
      processingTimeMs: result.processingTimeMs,
    });

    this.events.push(new PromptExecuted(
      completed.id, completed.restaurantId, completed.promptTemplateId,
      provider.type, provider.defaultModel, result.processingTimeMs,
      result.tokenUsage,
    ));

    return { request: completed, response };
  }

  async createJob(
    restaurantId: string,
    type: string,
    priority: number,
    payload: Record<string, unknown>,
    maxRetries: number,
    createdBy: string,
    scheduledAt?: Date,
  ): Promise<PredictionJob> {
    const job = PredictionJob.create({
      id: crypto.randomUUID(),
      restaurantId,
      type: type as PredictionJob["type"],
      priority,
      payload,
      maxRetries,
      scheduledAt,
      createdBy,
    });
    await this.jobRepo.save(job);

    this.events.push(new PredictionRequested(job.id, restaurantId, type, priority));
    return job;
  }

  async executeJob(job: PredictionJob): Promise<PredictionJob> {
    const started = job.start();
    await this.jobRepo.save(started);

    try {
      const processingTime = Math.random() * 1000;
      const result = { processed: true, timestamp: new Date().toISOString(), ...job.payload };
      const completed = started.complete(result);

      this.events.push(new PredictionCompleted(
        completed.id, completed.restaurantId, completed.type, true, processingTime,
      ));

      await this.jobRepo.save(completed);
      return completed;
    } catch (error) {
      const failed = started.fail(error instanceof Error ? error.message : String(error));
      await this.jobRepo.save(failed);

      this.events.push(new PredictionCompleted(
        failed.id, failed.restaurantId, failed.type, false, 0,
      ));

      return failed;
    }
  }

  async processQueue(limit: number = 10): Promise<PredictionJob[]> {
    const jobs = await this.jobRepo.findQueued(limit);
    const results: PredictionJob[] = [];
    for (const job of jobs) {
      const result = await this.executeJob(job);
      results.push(result);
    }
    return results;
  }
}
