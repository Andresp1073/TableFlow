import type { DemandSnapshot, DemandSummary } from "../models/DemandSnapshot.js";
import type { RestaurantCapacity } from "../models/RestaurantCapacity.js";

export interface DemandAnalysisResult {
  summary: DemandSummary;
  peakDemandSlot: { timeSlot: string; occupancy: number };
  lowDemandSlot: { timeSlot: string; occupancy: number };
  opportunities: Array<{ timeSlot: string; currentOccupancy: number; potentialCovers: number }>;
}

export class DemandAnalyzer {
  analyze(snapshots: DemandSnapshot[], capacity: RestaurantCapacity): DemandAnalysisResult {
    if (snapshots.length === 0) {
      throw new Error("No demand snapshots available for analysis");
    }

    const bySlot = new Map<string, { reservations: number; walkIns: number; turnaways: number; occupancy: number[]; covers: number[]; revenue: number[] }>();

    for (const s of snapshots) {
      const key = s.timeSlot;
      if (!bySlot.has(key)) {
        bySlot.set(key, { reservations: 0, walkIns: 0, turnaways: 0, occupancy: [], covers: [], revenue: [] });
      }
      const slot = bySlot.get(key)!;
      slot.reservations += s.reservationVolume;
      slot.walkIns += s.walkInVolume;
      slot.turnaways += s.turnawayCount;
      slot.occupancy.push(s.occupancyRate);
      slot.covers.push(s.coversServed);
      slot.revenue.push(s.revenueGenerated);
    }

    let totalReservations = 0;
    let totalWalkIns = 0;
    let totalTurnaways = 0;
    let totalOccupancy = 0;
    let totalCovers = 0;
    let count = snapshots.length;
    let peakSlot = "";
    let peakOcc = 0;
    let lowSlot = "";
    let lowOcc = 100;
    const opportunities: DemandAnalysisResult["opportunities"] = [];

    for (const [slot, data] of bySlot) {
      const avgOcc = data.occupancy.reduce((a, b) => a + b, 0) / data.occupancy.length;
      totalReservations += data.reservations;
      totalWalkIns += data.walkIns;
      totalTurnaways += data.turnaways;
      totalOccupancy += avgOcc * data.occupancy.length;
      totalCovers += data.covers.reduce((a, b) => a + b, 0);

      if (avgOcc > peakOcc) { peakOcc = avgOcc; peakSlot = slot; }
      if (avgOcc < lowOcc) { lowOcc = avgOcc; lowSlot = slot; }

      if (avgOcc < 0.7) {
        const cap = capacity.getTotalCapacityForTimeSlot(slot as any);
        const potential = Math.round(cap - (cap * avgOcc));
        opportunities.push({ timeSlot: slot, currentOccupancy: avgOcc, potentialCovers: Math.max(0, potential) });
      }
    }

    const summary: DemandSummary = {
      totalReservations,
      totalWalkIns,
      totalTurnaways,
      averageOccupancyRate: count > 0 ? totalOccupancy / count : 0,
      peakSlot,
      peakOccupancy: peakOcc,
      lowSlot,
      lowOccupancy: lowOcc,
      averagePartySize: snapshots.reduce((s, d) => s + d.averagePartySize, 0) / snapshots.length,
      totalCovers,
    };

    return { summary, peakDemandSlot: { timeSlot: peakSlot, occupancy: peakOcc }, lowDemandSlot: { timeSlot: lowSlot, occupancy: lowOcc }, opportunities };
  }

  calculateOccupancyRate(reservations: number, walkIns: number, capacity: number): number {
    if (capacity <= 0) return 0;
    return Math.min(1, (reservations + walkIns) / capacity);
  }

  detectTrend(snapshots: DemandSnapshot[]): "increasing" | "decreasing" | "stable" {
    if (snapshots.length < 7) return "stable";
    const recent = snapshots.slice(-7);
    const firstAvg = recent.slice(0, 3).reduce((s, d) => s + d.occupancyRate, 0) / 3;
    const lastAvg = recent.slice(-3).reduce((s, d) => s + d.occupancyRate, 0) / 3;
    const diff = lastAvg - firstAvg;
    if (diff > 0.05) return "increasing";
    if (diff < -0.05) return "decreasing";
    return "stable";
  }
}
