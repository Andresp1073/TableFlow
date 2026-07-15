import type { DemandSnapshot } from "../models/DemandSnapshot.js";
import type { RestaurantCapacity } from "../models/RestaurantCapacity.js";
import { OptimizationRecommendation, RecommendationType, RecommendationPriority } from "../models/OptimizationRecommendation.js";

export class OptimizationEngine {
  generateRecommendations(
    snapshots: DemandSnapshot[],
    capacity: RestaurantCapacity,
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    const peakSlot = this.findPeakSlot(snapshots);
    const lowSlot = this.findLowSlot(snapshots);

    if (peakSlot && peakSlot.occupancy > 0.85) {
      recommendations.push(this.createRecommendation({
        restaurantId: capacity.restaurantId,
        type: RecommendationType.IncreaseAvailability,
        priority: RecommendationPriority.High,
        title: "Increase capacity during peak hours",
        description: `Peak occupancy of ${Math.round(peakSlot.occupancy * 100)}% in ${peakSlot.timeSlot}. Consider adding tables or reducing dining duration.`,
        estimatedRevenueImpact: peakSlot.occupancy * 1000,
        estimatedCostImpact: 200,
        difficulty: "medium",
        suggestedActions: ["Add temporary seating", "Optimize table turn times", "Consider split shifts"],
        relevantTimeSlots: [peakSlot.timeSlot],
      }));
    }

    if (lowSlot && lowSlot.occupancy < 0.5) {
      recommendations.push(this.createRecommendation({
        restaurantId: capacity.restaurantId,
        type: RecommendationType.PromoteLowDemand,
        priority: RecommendationPriority.Medium,
        title: "Promote low-demand periods",
        description: `Low occupancy of ${Math.round(lowSlot.occupancy * 100)}% in ${lowSlot.timeSlot}. Run promotions to increase covers.`,
        estimatedRevenueImpact: (1 - lowSlot.occupancy) * 500,
        estimatedCostImpact: 100,
        difficulty: "easy",
        suggestedActions: ["Create time-based discounts", "Run social media campaigns", "Partner with local businesses"],
        relevantTimeSlots: [lowSlot.timeSlot],
      }));
    }

    const avgDuration = snapshots.reduce((s, d) => s + d.averageDiningDurationMinutes, 0) / Math.max(1, snapshots.length);
    if (avgDuration > 90) {
      recommendations.push(this.createRecommendation({
        restaurantId: capacity.restaurantId,
        type: RecommendationType.OptimizeTableAllocation,
        priority: RecommendationPriority.Medium,
        title: "Optimize table allocation",
        description: `Average dining duration of ${Math.round(avgDuration)} minutes is high. Consider optimizing table allocation.`,
        estimatedRevenueImpact: 300,
        estimatedCostImpact: 0,
        difficulty: "easy",
        suggestedActions: ["Implement time-limited seating", "Optimize table assignment", "Speed up service processes"],
        relevantTimeSlots: ["lunch", "dinner"],
      }));
    }

    return recommendations;
  }

  private createRecommendation(config: {
    restaurantId: string;
    type: RecommendationType;
    priority: RecommendationPriority;
    title: string;
    description: string;
    estimatedRevenueImpact: number;
    estimatedCostImpact: number;
    difficulty: string;
    suggestedActions: string[];
    relevantTimeSlots: string[];
  }): OptimizationRecommendation {
    return OptimizationRecommendation.create({
      id: crypto.randomUUID(),
      ...config,
      relevantDates: [],
      metrics: {},
    });
  }

  private findPeakSlot(snapshots: DemandSnapshot[]): { timeSlot: string; occupancy: number } | null {
    if (snapshots.length === 0) return null;
    const bySlot = new Map<string, number[]>();
    for (const s of snapshots) {
      if (!bySlot.has(s.timeSlot)) bySlot.set(s.timeSlot, []);
      bySlot.get(s.timeSlot)!.push(s.occupancyRate);
    }
    let peakSlot = "";
    let peakOcc = 0;
    for (const [slot, rates] of bySlot) {
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
      if (avg > peakOcc) { peakOcc = avg; peakSlot = slot; }
    }
    return peakSlot ? { timeSlot: peakSlot, occupancy: peakOcc } : null;
  }

  private findLowSlot(snapshots: DemandSnapshot[]): { timeSlot: string; occupancy: number } | null {
    if (snapshots.length === 0) return null;
    const bySlot = new Map<string, number[]>();
    for (const s of snapshots) {
      if (!bySlot.has(s.timeSlot)) bySlot.set(s.timeSlot, []);
      bySlot.get(s.timeSlot)!.push(s.occupancyRate);
    }
    let lowSlot = "";
    let lowOcc = 1;
    for (const [slot, rates] of bySlot) {
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
      if (avg < lowOcc) { lowOcc = avg; lowSlot = slot; }
    }
    return lowSlot ? { timeSlot: lowSlot, occupancy: lowOcc } : null;
  }
}
