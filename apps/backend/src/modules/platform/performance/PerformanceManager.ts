import type {
  PerformanceMetric,
  AnalysisResult,
  Bottleneck,
  OptimizationRecommendation,
  PerformanceProfile,
  PerformanceProfileResult,
  AnalyzeOptions,
  OptimizeOptions,
  PerformanceProfileOptions,
  PerformanceAnalyzer,
  BottleneckDetector,
  OptimizationEngine,
} from "./types.js";
import { PerformanceProfileBuilder } from "./PerformanceProfile.js";
import { PerformanceAnalyzerImpl } from "./PerformanceAnalyzer.js";
import { BottleneckDetectorImpl } from "./BottleneckDetector.js";
import { OptimizationEngineImpl } from "./OptimizationEngine.js";
import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";
import { publishPerformanceEvent } from "./events.js";

export class PerformanceManager {
  private readonly analyzer: PerformanceAnalyzer;
  private readonly bottleneckDetector: BottleneckDetector;
  private readonly optimizationEngine: OptimizationEngineImpl;
  private readonly profiles: Map<string, PerformanceProfile> = new Map();
  private readonly analysisHistory: Map<string, AnalysisResult[]> = new Map();
  private readonly logger?: Logger;
  private readonly eventPublisher?: EventPublisher;

  constructor(options?: PerformanceProfileOptions & { logger?: Logger; eventPublisher?: EventPublisher }) {
    this.analyzer = options?.analyzer ?? new PerformanceAnalyzerImpl();
    this.bottleneckDetector = options?.bottleneckDetector ?? new BottleneckDetectorImpl();
    this.optimizationEngine = options?.optimizationEngine ?? new OptimizationEngineImpl();
    this.logger = options?.logger;
    this.eventPublisher = options?.eventPublisher;
  }

  // Profile Management
  registerProfile(config: PerformanceProfileBuilder | PerformanceProfile): PerformanceProfile {
    const builder = config instanceof PerformanceProfileBuilder
      ? config
      : PerformanceProfileBuilder.fromProfile(config);
    const profile = builder.build();
    this.profiles.set(profile.name, profile);
    return profile;
  }

  getProfile(name: string): PerformanceProfile | undefined {
    return this.profiles.get(name);
  }

  listProfiles(): PerformanceProfile[] {
    return Array.from(this.profiles.values());
  }

  // Full lifecycle analysis
  async analyzePerformance(
    metrics: PerformanceMetric[],
    profileName?: string,
    options?: AnalyzeOptions,
  ): Promise<PerformanceProfileResult> {
    const profile = profileName
      ? this.profiles.get(profileName) ?? this.buildDefaultProfile(profileName)
      : this.buildDefaultProfile("default");

    const analysis = await this.analyzer.analyze(metrics, options);
    this.analysisHistory.set(profile.name, analysis);

    this.publishEventsForAnalysis(analysis);

    const bottlenecks = this.bottleneckDetector.detect(analysis, options);

    this.publishEventsForBottlenecks(bottlenecks);

    const recommendations = bottlenecks.length > 0
      ? this.optimizationEngine.suggest(bottlenecks, profile)
      : [];

    this.publishEventsForRecommendations(recommendations);

    return { profile, analysis, bottlenecks, recommendations };
  }

  // Detection shortcut
  async detectBottlenecks(
    metrics: PerformanceMetric[],
    options?: AnalyzeOptions,
  ): Promise<Bottleneck[]> {
    const analysis = await this.analyzer.analyze(metrics, options);
    return this.bottleneckDetector.detect(analysis, options);
  }

  // Optimization
  suggestOptimizations(
    bottlenecks: Bottleneck[],
    profile: PerformanceProfile,
    options?: OptimizeOptions,
  ): OptimizationRecommendation[] {
    return this.optimizationEngine.suggest(bottlenecks, profile, options);
  }

  applyOptimization(recommendation: OptimizationRecommendation): OptimizationRecommendation {
    const result = this.optimizationEngine.apply(recommendation);
    publishPerformanceEvent(
      this.eventPublisher,
      this.logger,
      "optimization.applied",
      recommendation.id,
      { area: recommendation.area, title: recommendation.title },
    );
    return result;
  }

  dismissOptimization(recommendation: OptimizationRecommendation): OptimizationRecommendation {
    return this.optimizationEngine.dismiss(recommendation);
  }

  getRecommendation(id: string): OptimizationRecommendation | undefined {
    return this.optimizationEngine.getRecommendation(id);
  }

  listRecommendations(status?: "pending" | "applied" | "dismissed"): OptimizationRecommendation[] {
    return this.optimizationEngine.listRecommendations(status);
  }

  // Raw access to components
  getAnalyzer(): PerformanceAnalyzer {
    return this.analyzer;
  }

  getBottleneckDetector(): BottleneckDetector {
    return this.bottleneckDetector;
  }

  getOptimizationEngine(): OptimizationEngineImpl {
    return this.optimizationEngine;
  }

  // Analysis History
  getAnalysisHistory(profileName: string): AnalysisResult[] | undefined {
    return this.analysisHistory.get(profileName);
  }

  // Private helpers
  private buildDefaultProfile(name: string): PerformanceProfile {
    const builder = PerformanceProfileBuilder.createDefault(name);
    const profile = builder.build();
    this.profiles.set(profile.name, profile);
    return profile;
  }

  private publishEventsForAnalysis(analysis: AnalysisResult[]): void {
    for (const result of analysis) {
      if (result.severity === "critical" || result.severity === "high") {
        publishPerformanceEvent(
          this.eventPublisher,
          this.logger,
          "performance.issue_detected",
          result.metric.name,
          {
            analysisType: result.metric.type,
            severity: result.severity,
            currentValue: result.metric.value,
            warningThreshold: result.threshold.warning,
            criticalThreshold: result.threshold.critical,
          },
        );
      }
    }
  }

  private publishEventsForBottlenecks(bottlenecks: Bottleneck[]): void {
    for (const bottleneck of bottlenecks) {
      publishPerformanceEvent(
        this.eventPublisher,
        this.logger,
        "performance.issue_detected",
        bottleneck.resource,
        {
          bottleneckType: bottleneck.type,
          severity: bottleneck.severity,
          currentValue: bottleneck.currentValue,
          threshold: bottleneck.threshold,
        },
      );
    }
  }

  private publishEventsForRecommendations(recommendations: OptimizationRecommendation[]): void {
    for (const rec of recommendations) {
      publishPerformanceEvent(
        this.eventPublisher,
        this.logger,
        "optimization.suggested",
        rec.id,
        {
          area: rec.area,
          severity: rec.severity,
          title: rec.title,
          effort: rec.effort,
        },
      );
    }
  }
}
