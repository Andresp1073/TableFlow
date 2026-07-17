import type { AIRequestRepository } from "../../domain/repositories/AIRequestRepository.js";
import type { PredictionJobRepository } from "../../domain/repositories/PredictionJobRepository.js";
import type { ForecastRepository } from "../../domain/repositories/ForecastRepository.js";
import type { RecommendationRepository } from "../../domain/repositories/RecommendationRepository.js";
import type { PromptTemplateRepository } from "../../domain/repositories/PromptTemplateRepository.js";
import type { SafetyAuditRepository } from "../../domain/repositories/SafetyAuditRepository.js";
import { AIManager } from "../../domain/services/AIManager.js";
import { AIRequest } from "../../domain/models/AIRequest.js";
import { AIResponse } from "../../domain/models/AIResponse.js";
import { AIProvider } from "../../domain/models/AIProvider.js";
import { SafetyConfig } from "../../domain/models/SafetyConfig.js";
import type { AIProvider as AIProviderType } from "../../domain/models/AIProvider.js";
import type { ForecastType } from "../../domain/models/Forecast.js";
import type { RecommendationType, RecommendationPriority } from "../../domain/models/Recommendation.js";
import type { JobType } from "../../domain/models/PredictionJob.js";
import type { PromptTemplateCategory, PromptVariable } from "../../domain/models/PromptTemplate.js";
import { toAIRequestDto, type AIRequestDto } from "../dtos/AIRequestDto.js";
import { toAIResponseDto, type AIResponseDto } from "../dtos/AIResponseDto.js";
import { toForecastDto, type ForecastDto } from "../dtos/ForecastDto.js";
import { toRecommendationDto, type RecommendationDto } from "../dtos/RecommendationDto.js";
import { toPredictionJobDto, type PredictionJobDto } from "../dtos/PredictionJobDto.js";

export class AIApplicationService {
  private readonly manager: AIManager;

  constructor(
    requestRepo: AIRequestRepository,
    jobRepo: PredictionJobRepository,
    forecastRepo: ForecastRepository,
    recommendationRepo: RecommendationRepository,
    templateRepo: PromptTemplateRepository,
    auditRepo: SafetyAuditRepository,
  ) {
    this.manager = new AIManager(
      requestRepo, jobRepo, forecastRepo, recommendationRepo, templateRepo, auditRepo,
    );
  }

  getManager(): AIManager {
    return this.manager;
  }

  async registerProvider(provider: AIProviderType): Promise<void> {
    await this.manager.registerProvider(provider);
  }

  getProvider(id: string): AIProviderType | undefined {
    return this.manager.getProvider(id);
  }

  listProviders(restaurantId: string): AIProviderType[] {
    return this.manager.listProviders(restaurantId);
  }

  async executePrompt(
    request: AIRequest,
    provider: AIProviderType,
  ): Promise<{ requestDto: AIRequestDto; responseDto: AIResponseDto }> {
    const result = await this.manager.executePrompt(request, provider);
    return {
      requestDto: toAIRequestDto(result.request),
      responseDto: toAIResponseDto(result.response),
    };
  }

  async createJob(
    restaurantId: string,
    type: JobType,
    priority: number,
    payload: Record<string, unknown>,
    maxRetries: number = 3,
    createdBy: string,
  ): Promise<PredictionJobDto> {
    const job = await this.manager.createJob(restaurantId, type, priority, payload, maxRetries, createdBy);
    return toPredictionJobDto(job);
  }

  async executeJob(jobId: string): Promise<PredictionJobDto> {
    const job = await this.manager.jobRepo.findById(jobId);
    if (!job) throw new Error(`Prediction job not found: ${jobId}`);
    const completed = await this.manager.executeJob(job);
    return toPredictionJobDto(completed);
  }

  async processQueue(limit: number = 10): Promise<PredictionJobDto[]> {
    const jobs = await this.manager.processQueue(limit);
    return jobs.map(toPredictionJobDto);
  }

  async generateForecast(
    restaurantId: string,
    type: ForecastType,
    periodStart: Date,
    periodEnd: Date,
    historicalValues: number[],
    createdBy: string,
  ): Promise<ForecastDto> {
    const forecast = await this.manager.generateForecast(
      restaurantId, type, periodStart, periodEnd, historicalValues, createdBy,
    );
    return toForecastDto(forecast);
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
  ): Promise<RecommendationDto> {
    const recommendation = await this.manager.generateRecommendation(
      restaurantId, type, priority, title, description, reasoning,
      expectedImpact, confidence, data, createdBy,
    );
    return toRecommendationDto(recommendation);
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
  ): Promise<import("../dtos/PromptTemplateDto.js").PromptTemplateDto> {
    const pt = await this.manager.createPromptTemplate(
      restaurantId, name, category, template, variables, tags, createdBy, description,
    );
    const { toPromptTemplateDto } = await import("../dtos/PromptTemplateDto.js");
    return toPromptTemplateDto(pt);
  }

  async setSafetyConfig(config: SafetyConfig): Promise<void> {
    await this.manager.setSafetyConfig(config);
  }

  async getForecasts(restaurantId: string): Promise<ForecastDto[]> {
    const forecasts = await this.manager.getForecasts(restaurantId);
    return forecasts.map(toForecastDto);
  }

  async getRecommendations(restaurantId: string): Promise<RecommendationDto[]> {
    const recommendations = await this.manager.getRecommendations(restaurantId);
    return recommendations.map(toRecommendationDto);
  }

  async getJobs(restaurantId: string): Promise<PredictionJobDto[]> {
    const jobs = await this.manager.getJobs(restaurantId);
    return jobs.map(toPredictionJobDto);
  }

  async getRequests(restaurantId: string): Promise<AIRequestDto[]> {
    const requests = await this.manager.getRequests(restaurantId);
    return requests.map(toAIRequestDto);
  }
}
