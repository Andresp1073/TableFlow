import type { RestaurantCapacity, DiningAreaConfig } from "../models/RestaurantCapacity.js";

export interface CapacityAnalysisResult {
  totalCapacity: number;
  activeAreas: number;
  totalAreaCapacity: number;
  averageDiningDuration: number;
  estimatedTurnsPerSlot: Record<string, number>;
  unusedCapacity: number;
  recommendations: string[];
}

export class CapacityAnalyzer {
  analyze(capacity: RestaurantCapacity, currentOccupancy: number): CapacityAnalysisResult {
    const activeAreas = capacity.getActiveDiningAreas();
    const totalAreaCapacity = activeAreas.reduce((s, a) => s + a.capacity, 0);
    const avgDuration = activeAreas.length > 0
      ? activeAreas.reduce((s, a) => s + a.averageDiningDurationMinutes, 0) / activeAreas.length
      : 60;

    const estimatedTurns: Record<string, number> = {};
    for (const [slot, duration] of Object.entries(capacity.timeSlotDurations)) {
      const operatingMinutes = duration;
      const turnDuration = activeAreas.length > 0
        ? activeAreas.reduce((s, a) => s + a.averageDiningDurationMinutes, 0) / activeAreas.length
        : 60;
      estimatedTurns[slot] = Math.floor(operatingMinutes / turnDuration);
    }

    const occupied = totalAreaCapacity * currentOccupancy;
    const unusedCapacity = Math.max(0, totalAreaCapacity - occupied);

    const recommendations: string[] = [];
    if (unusedCapacity > totalAreaCapacity * 0.3) {
      recommendations.push("Significant unused capacity detected. Consider promotions for low-demand periods.");
    }
    if (currentOccupancy > 0.85) {
      recommendations.push("High occupancy detected. Consider optimizing table turns or expanding capacity.");
    }

    return {
      totalCapacity: capacity.totalCapacity,
      activeAreas: activeAreas.length,
      totalAreaCapacity,
      averageDiningDuration: avgDuration,
      estimatedTurnsPerSlot: estimatedTurns,
      unusedCapacity,
      recommendations,
    };
  }

  canAccommodate(capacity: RestaurantCapacity, partySize: number, currentOccupancy: number, timeSlot: string): boolean {
    if (partySize < capacity.minPartySize || partySize > capacity.maxPartySize) return false;
    const slotCap = capacity.getTotalCapacityForTimeSlot(timeSlot as any);
    const available = slotCap - (slotCap * currentOccupancy);
    return available >= partySize;
  }

  estimateTableTurnTime(area: DiningAreaConfig): number {
    return area.averageDiningDurationMinutes + 15;
  }

  calculateMaxCovers(area: DiningAreaConfig, operatingMinutes: number): number {
    const turnTime = this.estimateTableTurnTime(area);
    const turns = Math.floor(operatingMinutes / turnTime);
    return area.tableCount * turns * Math.floor(area.capacity / area.tableCount);
  }
}
