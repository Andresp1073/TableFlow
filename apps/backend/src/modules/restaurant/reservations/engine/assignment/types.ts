export interface AssignmentContext {
  restaurantId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  partySize: number;
  preferredDiningAreaId?: string | null;
  preferredTableTypeId?: string | null;
  isAccessibleRequired?: boolean;
  excludeReservationId?: string | null;
}

export interface AssignmentCandidate {
  tableId: string;
  partySize: number;
  isTableGroup: boolean;
  tableGroupId: string | null;
  diningAreaId: string | null;
  tableTypeId: string | null;
  minimumCapacity: number;
  maximumCapacity: number;
  isAccessible: boolean;
  isAvailable: boolean;
  availabilityReason: string | null;
}

export interface AssignmentScore {
  candidate: AssignmentCandidate;
  totalScore: number;
  capacityFit: number;
  availabilityQuality: number;
  diningAreaFit: number;
  utilizationScore: number;
}

export interface ScoringFactors {
  capacityFitWeight: number;
  availabilityWeight: number;
  diningAreaWeight: number;
  utilizationWeight: number;
}
