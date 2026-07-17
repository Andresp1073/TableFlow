import { describe, it, expect, beforeEach } from "vitest";
import { PredictionJobRunner } from "../domain/services/PredictionJobRunner.js";
import { InMemoryPredictionJobRepository, InMemoryForecastRepository, InMemoryRecommendationRepository } from "../infrastructure/repositories/InMemoryAIRepositories.js";
import { PredictionJob } from "../domain/models/PredictionJob.js";

describe("PredictionJobRunner", () => {
  let jobRepo: InMemoryPredictionJobRepository;
  let forecastRepo: InMemoryForecastRepository;
  let recommendationRepo: InMemoryRecommendationRepository;
  let runner: PredictionJobRunner;

  beforeEach(() => {
    jobRepo = new InMemoryPredictionJobRepository();
    forecastRepo = new InMemoryForecastRepository();
    recommendationRepo = new InMemoryRecommendationRepository();
    runner = new PredictionJobRunner(jobRepo, forecastRepo, recommendationRepo);
  });

  it("executes a forecast job and creates a forecast", async () => {
    const job = PredictionJob.create({
      id: "job-1", restaurantId: "rest-1", type: "forecast",
      priority: 5, payload: {
        forecastType: "demand",
        historicalValues: [100, 110, 120, 115, 105],
        periodStart: "2026-07-01",
        periodEnd: "2026-07-31",
      },
      maxRetries: 3, createdBy: "system",
    });

    await jobRepo.save(job);
    const completed = await runner.execute(job);

    expect(completed.status).toBe("completed");
    expect(completed.progress).toBe(100);
    expect(completed.result).toBeDefined();
    expect(completed.result!["forecastId"]).toBeDefined();
    expect(completed.result!["value"]).toBeGreaterThan(0);

    const saved = await jobRepo.findById("job-1");
    expect(saved?.status).toBe("completed");
  });

  it("executes a recommendation job", async () => {
    const job = PredictionJob.create({
      id: "job-2", restaurantId: "rest-1", type: "recommendation",
      priority: 5, payload: {
        recommendationType: "pricing",
        title: "Increase dinner prices",
        description: "Based on demand analysis",
        reasoning: "High demand period detected",
        expectedImpact: "+15% revenue",
        priority: "high",
        confidence: 0.85,
      },
      maxRetries: 3, createdBy: "system",
    });

    await jobRepo.save(job);
    const completed = await runner.execute(job);

    expect(completed.status).toBe("completed");
    expect(completed.result!["recommendationId"]).toBeDefined();
    expect(completed.result!["type"]).toBe("pricing");
  });

  it("executes an analysis job", async () => {
    const job = PredictionJob.create({
      id: "job-3", restaurantId: "rest-1", type: "analysis",
      priority: 3, payload: { data: [1, 2, 3] },
      maxRetries: 3, createdBy: "system",
    });

    await jobRepo.save(job);
    const completed = await runner.execute(job);

    expect(completed.status).toBe("completed");
    expect(completed.result!["analyzed"]).toBe(true);
  });

  it("executes a batch_inference job", async () => {
    const job = PredictionJob.create({
      id: "job-4", restaurantId: "rest-1", type: "batch_inference",
      priority: 3, payload: { items: ["a", "b", "c"] },
      maxRetries: 3, createdBy: "system",
    });

    await jobRepo.save(job);
    const completed = await runner.execute(job);

    expect(completed.status).toBe("completed");
    expect(completed.result!["totalItems"]).toBe(3);
    expect(completed.result!["results"]).toHaveLength(3);
  });

  it("handles job failure gracefully and retries", async () => {
    const job = PredictionJob.create({
      id: "job-5", restaurantId: "rest-1", type: "forecast",
      priority: 5, payload: { forecastType: "invalid_type" },
      maxRetries: 1, createdBy: "system",
    });

    await jobRepo.save(job);
    const failed = await runner.execute(job);

    expect(failed.status).toBe("failed");
    expect(failed.error).toBeDefined();

    const retried = await jobRepo.findById("job-5");
    expect(retried?.status).toBe("queued");
    expect(retried?.retryCount).toBe(1);
  });

  it("processes the queued jobs", async () => {
    const job1 = PredictionJob.create({
      id: "q-1", restaurantId: "rest-1", type: "analysis",
      priority: 1, payload: {}, maxRetries: 0, createdBy: "system",
    });
    const job2 = PredictionJob.create({
      id: "q-2", restaurantId: "rest-1", type: "analysis",
      priority: 1, payload: {}, maxRetries: 0, createdBy: "system",
    });

    await jobRepo.save(job1);
    await jobRepo.save(job2);

    const results = await runner.processQueue(10);
    expect(results.length).toBe(2);
    expect(results[0].status).toBe("completed");
    expect(results[1].status).toBe("completed");
  });

  it("emits PredictionCompleted event on success", async () => {
    const job = PredictionJob.create({
      id: "job-6", restaurantId: "rest-1", type: "analysis",
      priority: 1, payload: {}, maxRetries: 0, createdBy: "system",
    });

    await jobRepo.save(job);
    await runner.execute(job);

    expect(runner.events.length).toBeGreaterThan(0);
    const event = runner.events[runner.events.length - 1] as { jobId: string; success: boolean };
    expect(event.jobId).toBe("job-6");
    expect(event.success).toBe(true);
  });

  it("emits PredictionCompleted event on failure", async () => {
    const job = PredictionJob.create({
      id: "job-7", restaurantId: "rest-1", type: "forecast",
      priority: 1, payload: { forecastType: "invalid_type" }, maxRetries: 0, createdBy: "system",
    });

    await jobRepo.save(job);
    await runner.execute(job);

    const event = runner.events[runner.events.length - 1] as { jobId: string; success: boolean };
    expect(event.jobId).toBe("job-7");
    expect(event.success).toBe(false);
  });
});
