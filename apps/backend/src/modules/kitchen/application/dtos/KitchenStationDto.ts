import type { StationType, StationStatus } from "../../domain/models/KitchenStation.js";

export interface CreateKitchenStationDto {
  kitchenId: string;
  name: string;
  type: StationType;
  displayOrder: number;
  maxConcurrentTickets: number;
  customTypeLabel?: string;
}

export interface KitchenStationResponseDto {
  id: string;
  kitchenId: string;
  name: string;
  type: StationType;
  status: StationStatus;
  displayOrder: number;
  maxConcurrentTickets: number;
  currentTickets: number;
  assignedStaff: string[];
  isAvailable: boolean;
}
