import type { DemandSnapshot } from "../models/DemandSnapshot.js";
import type { RestaurantCapacity } from "../models/RestaurantCapacity.js";
import { OccupancyForecast, ForecastConfidence } from "../models/OccupancyForecast.js";

export class ForecastService {
  generateOccupancyForecast(
    snapshots: DemandSnapshot[],
    capacity: RestaurantCapacity,
    targetDate: string,
    targetTimeSlot: string,
  ): OccupancyForecast {
    const relevant = snapshots.filter((s) => s.timeSlot === targetTimeSlot);
    if (relevant.length === 0) {
      return OccupancyForecast.create({
        id: crypto.randomUUID(),
        restaurantId: capacity.restaurantId,
        date: targetDate,
        timeSlot: targetTimeSlot,
        predictedOccupancyRate: 0.5,
        predictedCovers: Math.round(capacity.getTotalCapacityForTimeSlot(targetTimeSlot as any) * 0.5),
        predictedRevenue: 0,
        confidence: ForecastConfidence.VeryLow,
        lowerBound: 0.2,
        upperBound: 0.8,
        factors: [{ name: "insufficient_data", impact: -1, description: "Not enough historical data" }],
        validUntil: new Date(Date.now() + 86400000),
      });
    }

    const avgOccupancy = relevant.reduce((s, d) => s + d.occupancyRate, 0) / relevant.length;
    const avgRevenue = relevant.reduce((s, d) => s + d.revenueGenerated, 0) / relevant.length;
    const avgCovers = relevant.reduce((s, d) => s + d.coversServed, 0) / relevant.length;

    const slotCapacity = capacity.getTotalCapacityForTimeSlot(targetTimeSlot as any);
    const totalCapacity = capacity.totalCapacity;
    const variance = relevant.reduce((s, d) => s + Math.pow(d.occupancyRate - avgOccupancy, 2), 0) / relevant.length;
    const stdDev = Math.sqrt(variance);

    let confidence: ForecastConfidence;
    if (relevant.length >= 30) confidence = ForecastConfidence.High;
    else if (relevant.length >= 14) confidence = ForecastConfidence.Medium;
    else if (relevant.length >= 7) confidence = ForecastConfidence.Low;
    else confidence = ForecastConfidence.VeryLow;

    const predictedCovers = Math.round(avgCovers);
    const predictedRevenue = Math.round(avgRevenue * 100) / 100;

    const holidayFactor = relevant.filter((s) => s.isHoliday).length / Math.max(1, relevant.length);
    const factors = [
      { name: "historical_average", impact: avgOccupancy, description: `Based on ${relevant.length} historical records` },
      { name: "volatility", impact: stdDev, description: `Standard deviation of ${stdDev.toFixed(2)}` },
    ];
    if (holidayFactor > 0.1) {
      factors.push({ name: "holiday_pattern", impact: holidayFactor, description: `${Math.round(holidayFactor * 100)}% of records are holidays` });
    }

    return OccupancyForecast.create({
      id: crypto.randomUUID(),
      restaurantId: capacity.restaurantId,
      date: targetDate,
      timeSlot: targetTimeSlot,
      predictedOccupancyRate: avgOccupancy,
      predictedCovers: Math.round(slotCapacity * avgOccupancy),
      predictedRevenue,
      confidence,
      lowerBound: Math.max(0, avgOccupancy - stdDev),
      upperBound: Math.min(1, avgOccupancy + stdDev),
      factors,
      validUntil: new Date(Date.now() + 86400000),
    });
  }

  aggregateForecasts(forecasts: OccupancyForecast[]): { totalPredictedRevenue: number; averageOccupancy: number; bestSlot: string; worstSlot: string } {
    if (forecasts.length === 0) return { totalPredictedRevenue: 0, averageOccupancy: 0, bestSlot: "", worstSlot: "" };

    let totalRev = 0;
    let totalOcc = 0;
    let bestSlot = "";
    let bestOcc = 0;
    let worstSlot = "";
    let worstOcc = 1;

    for (const f of forecasts) {
      totalRev += f.predictedRevenue;
      totalOcc += f.predictedOccupancyRate;
      if (f.predictedOccupancyRate > bestOcc) { bestOcc = f.predictedOccupancyRate; bestSlot = f.timeSlot; }
      if (f.predictedOccupancyRate < worstOcc) { worstOcc = f.predictedOccupancyRate; worstSlot = f.timeSlot; }
    }

    return {
      totalPredictedRevenue: Math.round(totalRev * 100) / 100,
      averageOccupancy: totalOcc / forecasts.length,
      bestSlot,
      worstSlot,
    };
  }
}
