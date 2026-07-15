import type { DemandSnapshot } from "../../domain/models/DemandSnapshot.js";

export type DemandSnapshotDto = {
  id: string;
  restaurantId: string;
  date: string;
  timeSlot: string;
  reservationVolume: number;
  walkInVolume: number;
  occupancyRate: number;
  totalCapacity: number;
  coversServed: number;
  averagePartySize: number;
  averageDiningDurationMinutes: number;
  revenueGenerated: number;
  recordedAt: string;
};

export function toDemandSnapshotDto(s: DemandSnapshot): DemandSnapshotDto {
  return {
    id: s.id, restaurantId: s.restaurantId, date: s.date,
    timeSlot: s.timeSlot, reservationVolume: s.reservationVolume,
    walkInVolume: s.walkInVolume, occupancyRate: s.occupancyRate,
    totalCapacity: s.totalCapacity, coversServed: s.coversServed,
    averagePartySize: s.averagePartySize,
    averageDiningDurationMinutes: s.averageDiningDurationMinutes,
    revenueGenerated: s.revenueGenerated,
    recordedAt: s.recordedAt.toISOString(),
  };
}
