import type { AIRequestRepository } from "../repositories/AIRequestRepository.js";
import type { PredictionJobRepository } from "../repositories/PredictionJobRepository.js";
import type { ForecastRepository } from "../repositories/ForecastRepository.js";
import type { RecommendationRepository } from "../repositories/RecommendationRepository.js";
import type { PromptTemplateRepository } from "../repositories/PromptTemplateRepository.js";
import type { SafetyAuditRepository } from "../repositories/SafetyAuditRepository.js";
import { AIOrchestrator } from "./AIOrchestrator.js";
import { PredictionJobRunner } from "./PredictionJobRunner.js";
import { PromptEngine } from "./PromptEngine.js";
import { SafetyService } from "./SafetyService.js";
import { ForecastEngine } from "./ForecastEngine.js";
import { RecommendationEngine } from "./RecommendationEngine.js";
import type { Forecast, ForecastType } from "../models/Forecast.js";
import type { Recommendation, RecommendationType, RecommendationPriority } from "../models/Recommendation.js";
import type { AIRequest } from "../models/AIRequest.js";
import type { AIResponse } from "../models/AIResponse.js";
import type { AIProvider } from "../models/AIProvider.js";
import type { PredictionJob, JobType } from "../models/PredictionJob.js";
import type { PromptTemplate, PromptTemplateCategory, PromptVariable } from "../models/PromptTemplate.js";
import type { PromptContext } from "../models/PromptContext.js";
import type { SafetyConfig } from "../models/SafetyConfig.js";
import { AIProviderChanged } from "../events/AIProviderChanged.js";

export class AIManager {
  readonly orchestrator: AIOrchestrator;
  readonly jobRunner: PredictionJobRunner;
  readonly promptEngine: PromptEngine;
  readonly safetyService: SafetyService;
  readonly forecastEngine: ForecastEngine;
  readonly recommendationEngine: RecommendationEngine;
  readonly events: unknown[] = [];

  private readonly providers = new Map<string, AIProvider>();

  constructor(
    readonly requestRepo: AIRequestRepository,
    readonly jobRepo: PredictionJobRepository,
    readonly forecastRepo: ForecastRepository,
    readonly recommendationRepo: RecommendationRepository,
    readonly templateRepo: PromptTemplateRepository,
    readonly auditRepo: SafetyAuditRepository,
  ) {
    this.orchestrator = new AIOrchestrator(requestRepo, jobRepo, templateRepo);
    this.jobRunner = new PredictionJobRunner(jobRepo, forecastRepo, recommendationRepo);
    this.promptEngine = this.orchestrator.promptEngine;
    this.safetyService = this.orchestrator.safetyService;
    this.forecastEngine = this.jobRunner.forecastEngine;
    this.recommendationEngine = this.jobRunner.recommendationEngine;
  }

  async registerProvider(provider: AIProvider): Promise<void> {
    const existing = this.providers.get(provider.id);
    this.providers.set(provider.id, provider);

    if (existing) {
      this.events.push(new AIProviderChanged(
        provider.id, provider.restaurantId, provider.name, provider.type,
        existing.status, provider.status,
      ));
    }
  }

  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  listProviders(restaurantId: string): AIProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.restaurantId === restaurantId);
  }

  async executePrompt(request: AIRequest, provider: AIProvider): Promise<{ request: AIRequest; response: AIResponse }> {
    return this.orchestrator.executeSync(request, provider);
  }

  async createJob(
    restaurantId: string,
    type: JobType,
    priority: number,
    payload: Record<string, unknown>,
    maxRetries: number = 3,
    createdBy: string,
  ): Promise<PredictionJob> {
    return this.orchestrator.createJob(restaurantId, type, priority, payload, maxRetries, createdBy);
  }

  async executeJob(job: PredictionJob): Promise<PredictionJob> {
    return this.jobRunner.execute(job);
  }

  async processQueue(limit: number = 10): Promise<PredictionJob[]> {
    return this.jobRunner.processQueue(limit);
  }

  async generateForecast(
    restaurantId: string,
    type: ForecastType,
    periodStart: Date,
    periodEnd: Date,
    historicalValues: number[],
    createdBy: string,
  ): Promise<Forecast> {
    const forecast = this.forecastEngine.generate({
      restaurantId, type, periodStart, periodEnd, historicalValues, createdBy,
    });
    await this.forecastRepo.save(forecast);
    return forecast;
  }

  async generateRecommendation(
    restaurantId: string,
    type: RecommendationType,
    priority: RecommendationPriority,
    title: string,
    description: string,
    reasoning: string,
    expectedImpact: string,
    confidence: number,
    data: Record<string, unknown>,
    createdBy: string,
  ): Promise<Recommendation> {
    const recommendation = this.recommendationEngine.generate({
      restaurantId, type, priority, title, description, reasoning,
      expectedImpact, confidence, source: "ai_manager", data, createdBy,
    });
    await this.recommendationRepo.save(recommendation);
    return recommendation;
  }

  async createPromptTemplate(
    restaurantId: string,
    name: string,
    category: PromptTemplateCategory,
    template: string,
    variables: PromptVariable[],
    tags: string[],
    createdBy: string,
    description?: string,
  ): Promise<PromptTemplate> {
    const promptTemplate = this.promptEngine.createTemplate({
      restaurantId, name, description, category, template, variables, tags, createdBy,
    });
    await this.templateRepo.save(promptTemplate);
    return promptTemplate;
  }

  renderPrompt(template: PromptTemplate, variables: Record<string, unknown>, requestId: string, restaurantId: string): PromptContext {
    return this.promptEngine.renderTemplate({ restaurantId, requestId, template, variables });
  }

  async setSafetyConfig(config: SafetyConfig): Promise<void> {
    this.safetyService.setConfig(config);
    await this.auditRepo.saveConfig(config);
  }

  async getForecasts(restaurantId: string): Promise<Forecast[]> {
    return this.forecastRepo.findByRestaurant(restaurantId);
  }

  async getRecommendations(restaurantId: string): Promise<Recommendation[]> {
    return this.recommendationRepo.findByRestaurant(restaurantId);
  }

  async getJobs(restaurantId: string): Promise<PredictionJob[]> {
    return this.jobRepo.findByRestaurant(restaurantId);
  }

  async getRequests(restaurantId: string): Promise<AIRequest[]> {
    return this.requestRepo.findByRestaurant(restaurantId);
  }
}
