export interface CalendarReservationSummary {
  id: string;
  reservationNumber: string;
  customerId: string | null;
  tableId: string | null;
  tableGroupId: string | null;
  startTime: Date;
  endTime: Date;
  partySize: number;
  status: string;
  source: string;
  notes: string | null;
}

export interface CalendarTimeSlot {
  hour: number;
  minute: number;
  label: string;
}

export interface CalendarDayView {
  date: Date;
  restaurantId: string;
  reservations: CalendarReservationSummary[];
  occupancy: OccupancyView;
  availability: CalendarAvailabilityView;
  conflicts: CalendarConflictView;
}

export interface CalendarWeekView {
  startDate: Date;
  endDate: Date;
  restaurantId: string;
  days: CalendarDayView[];
  summary: WeeklySummary;
}

export interface WeeklySummary {
  totalReservations: number;
  totalGuests: number;
  averagePartySize: number;
  averageOccupancyRate: number;
  totalConflicts: number;
  blockedConflicts: number;
}

export interface CalendarTimelineSlot {
  time: CalendarTimeSlot;
  reservations: CalendarReservationSummary[];
  availableCount: number;
  occupiedCount: number;
}

export interface CalendarTimelineView {
  date: Date;
  restaurantId: string;
  slots: CalendarTimelineSlot[];
  reservations: CalendarReservationSummary[];
}

export interface HourlyOccupancy {
  hour: number;
  totalTables: number;
  occupiedTables: number;
  occupancyRate: number;
  totalCapacity: number;
  occupiedCapacity: number;
  capacityRate: number;
}

export interface OccupancyView {
  date: Date;
  restaurantId: string;
  totalTables: number;
  totalCapacity: number;
  occupiedTables: number;
  occupiedCapacity: number;
  occupancyRate: number;
  capacityRate: number;
  peakOccupancyHour: number | null;
  hourlyBreakdown: HourlyOccupancy[];
}

export interface TimeSlotAvailability {
  time: CalendarTimeSlot;
  availableTables: number;
  availableCapacity: number;
  isFullyBooked: boolean;
}

export interface CalendarAvailabilityView {
  date: Date;
  restaurantId: string;
  totalTables: number;
  totalCapacity: number;
  maxAvailableCapacity: number;
  availableTables: number;
  availableCapacity: number;
  isFullyBooked: boolean;
  timeSlots: TimeSlotAvailability[];
}

export interface AggregatedConflict {
  code: string;
  severity: string;
  reason: string;
  count: number;
  rule: string;
  reservationIds: string[];
}

export interface CalendarConflictView {
  date: Date;
  restaurantId: string;
  totalConflicts: number;
  blockingConflicts: number;
  warningConflicts: number;
  infoConflicts: number;
  conflicts: AggregatedConflict[];
}

export interface CalendarQuery {
  restaurantId: string;
  date: Date;
}

export interface CalendarWeekQuery {
  restaurantId: string;
  startDate: Date;
}
