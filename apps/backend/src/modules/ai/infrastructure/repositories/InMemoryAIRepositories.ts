import type { AIRequestRepository } from "../../domain/repositories/AIRequestRepository.js";
import type { PredictionJobRepository } from "../../domain/repositories/PredictionJobRepository.js";
import type { ForecastRepository } from "../../domain/repositories/ForecastRepository.js";
import type { RecommendationRepository } from "../../domain/repositories/RecommendationRepository.js";
import type { PromptTemplateRepository } from "../../domain/repositories/PromptTemplateRepository.js";
import type { SafetyAuditRepository, SafetyAuditEvent } from "../../domain/repositories/SafetyAuditRepository.js";
import type { AIRequest, AIRequestStatus } from "../../domain/models/AIRequest.js";
import type { PredictionJob, JobStatus, JobType } from "../../domain/models/PredictionJob.js";
import type { Forecast, ForecastType } from "../../domain/models/Forecast.js";
import type { Recommendation, RecommendationType, RecommendationStatus } from "../../domain/models/Recommendation.js";
import type { PromptTemplate, PromptTemplateCategory } from "../../domain/models/PromptTemplate.js";
import type { SafetyConfig } from "../../domain/models/SafetyConfig.js";

export class InMemoryAIRequestRepository implements AIRequestRepository {
  private readonly requests = new Map<string, AIRequest>();

  async save(request: AIRequest): Promise<void> {
    this.requests.set(request.id, request);
  }

  async findById(id: string): Promise<AIRequest | null> {
    return this.requests.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<AIRequest[]> {
    return Array.from(this.requests.values()).filter((r) => r.restaurantId === restaurantId);
  }

  async findByStatus(restaurantId: string, status: AIRequestStatus): Promise<AIRequest[]> {
    return Array.from(this.requests.values()).filter(
      (r) => r.restaurantId === restaurantId && r.status === status,
    );
  }

  async findByProvider(restaurantId: string, provider: string): Promise<AIRequest[]> {
    return Array.from(this.requests.values()).filter(
      (r) => r.restaurantId === restaurantId && r.provider === provider,
    );
  }

  async delete(id: string): Promise<void> {
    this.requests.delete(id);
  }

  clear(): void {
    this.requests.clear();
  }
}

export class InMemoryPredictionJobRepository implements PredictionJobRepository {
  private readonly jobs = new Map<string, PredictionJob>();

  async save(job: PredictionJob): Promise<void> {
    this.jobs.set(job.id, job);
  }

  async findById(id: string): Promise<PredictionJob | null> {
    return this.jobs.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<PredictionJob[]> {
    return Array.from(this.jobs.values()).filter((j) => j.restaurantId === restaurantId);
  }

  async findByStatus(status: JobStatus): Promise<PredictionJob[]> {
    return Array.from(this.jobs.values()).filter((j) => j.status === status);
  }

  async findByType(restaurantId: string, type: JobType): Promise<PredictionJob[]> {
    return Array.from(this.jobs.values()).filter(
      (j) => j.restaurantId === restaurantId && j.type === type,
    );
  }

  async findQueued(limit?: number): Promise<PredictionJob[]> {
    const queued = Array.from(this.jobs.values())
      .filter((j) => j.status === "queued")
      .sort((a, b) => b.priority - a.priority);
    return limit ? queued.slice(0, limit) : queued;
  }

  async delete(id: string): Promise<void> {
    this.jobs.delete(id);
  }

  clear(): void {
    this.jobs.clear();
  }
}

export class InMemoryForecastRepository implements ForecastRepository {
  private readonly forecasts = new Map<string, Forecast>();

  async save(forecast: Forecast): Promise<void> {
    this.forecasts.set(forecast.id, forecast);
  }

  async findById(id: string): Promise<Forecast | null> {
    return this.forecasts.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<Forecast[]> {
    return Array.from(this.forecasts.values()).filter((f) => f.restaurantId === restaurantId);
  }

  async findByType(restaurantId: string, type: ForecastType): Promise<Forecast[]> {
    return Array.from(this.forecasts.values()).filter(
      (f) => f.restaurantId === restaurantId && f.type === type,
    );
  }

  async findByPeriod(restaurantId: string, start: Date, end: Date): Promise<Forecast[]> {
    return Array.from(this.forecasts.values()).filter(
      (f) =>
        f.restaurantId === restaurantId &&
        f.periodStart >= start &&
        f.periodEnd <= end,
    );
  }

  async findLatestByType(restaurantId: string, type: ForecastType): Promise<Forecast | null> {
    const matches = Array.from(this.forecasts.values())
      .filter((f) => f.restaurantId === restaurantId && f.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return matches[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    this.forecasts.delete(id);
  }

  clear(): void {
    this.forecasts.clear();
  }
}

export class InMemoryRecommendationRepository implements RecommendationRepository {
  private readonly recommendations = new Map<string, Recommendation>();

  async save(recommendation: Recommendation): Promise<void> {
    this.recommendations.set(recommendation.id, recommendation);
  }

  async findById(id: string): Promise<Recommendation | null> {
    return this.recommendations.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values()).filter((r) => r.restaurantId === restaurantId);
  }

  async findByType(restaurantId: string, type: RecommendationType): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values()).filter(
      (r) => r.restaurantId === restaurantId && r.type === type,
    );
  }

  async findByStatus(restaurantId: string, status: RecommendationStatus): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values()).filter(
      (r) => r.restaurantId === restaurantId && r.status === status,
    );
  }

  async findActive(restaurantId: string): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values()).filter(
      (r) => r.restaurantId === restaurantId && r.isActionable(),
    );
  }

  async delete(id: string): Promise<void> {
    this.recommendations.delete(id);
  }

  clear(): void {
    this.recommendations.clear();
  }
}

export class InMemoryPromptTemplateRepository implements PromptTemplateRepository {
  private readonly templates = new Map<string, PromptTemplate>();

  async save(template: PromptTemplate): Promise<void> {
    this.templates.set(template.id, template);
  }

  async findById(id: string): Promise<PromptTemplate | null> {
    return this.templates.get(id) ?? null;
  }

  async findByName(restaurantId: string, name: string): Promise<PromptTemplate | null> {
    return Array.from(this.templates.values()).find(
      (t) => t.restaurantId === restaurantId && t.name === name,
    ) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<PromptTemplate[]> {
    return Array.from(this.templates.values()).filter((t) => t.restaurantId === restaurantId);
  }

  async findByCategory(restaurantId: string, category: PromptTemplateCategory): Promise<PromptTemplate[]> {
    return Array.from(this.templates.values()).filter(
      (t) => t.restaurantId === restaurantId && t.category === category,
    );
  }

  async findActiveByCategory(restaurantId: string, category: PromptTemplateCategory): Promise<PromptTemplate[]> {
    return Array.from(this.templates.values()).filter(
      (t) => t.restaurantId === restaurantId && t.category === category && t.isActive,
    );
  }

  async delete(id: string): Promise<void> {
    this.templates.delete(id);
  }

  clear(): void {
    this.templates.clear();
  }
}

export class InMemorySafetyAuditRepository implements SafetyAuditRepository {
  private readonly configs = new Map<string, SafetyConfig>();
  private readonly events: SafetyAuditEvent[] = [];

  async saveConfig(config: SafetyConfig): Promise<void> {
    this.configs.set(config.restaurantId, config);
  }

  async findConfigByRestaurant(restaurantId: string): Promise<SafetyConfig | null> {
    return this.configs.get(restaurantId) ?? null;
  }

  async logEvent(event: SafetyAuditEvent): Promise<void> {
    this.events.push(event);
  }

  async findEventsByRestaurant(restaurantId: string, limit?: number): Promise<SafetyAuditEvent[]> {
    const filtered = this.events.filter((e) => e.restaurantId === restaurantId);
    return limit ? filtered.slice(-limit) : filtered;
  }

  clear(): void {
    this.configs.clear();
    this.events.length = 0;
  }
}
