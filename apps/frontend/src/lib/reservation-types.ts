export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type ReservationSource = string;

export type CalendarViewType = 'day' | 'week' | 'month' | 'timeline' | 'agenda';

export interface ReservationSummary {
  id: string;
  restaurantId: string;
  reservationNumber: string;
  customerId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: ReservationStatus;
  source: string;
  createdAt: string;
}

export interface ReservationDTO {
  id: string;
  restaurantId: string;
  reservationNumber: string;
  customerId: string | null;
  tableId: string | null;
  tableGroupId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: ReservationStatus;
  source: string;
  notes: string | null;
  specialRequests: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
}

export interface ReservationCreateInput {
  reservationNumber: string;
  customerId?: string | null;
  tableId?: string | null;
  tableGroupId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  source: string;
  notes?: string | null;
  specialRequests?: string | null;
}

export interface ReservationUpdateInput {
  customerId?: string | null;
  tableId?: string | null;
  tableGroupId?: string | null;
  date?: string;
  startTime?: string;
  endTime?: string;
  partySize?: number;
  notes?: string | null;
  specialRequests?: string | null;
}

export interface ReservationListParams {
  status?: ReservationStatus;
  date?: string;
  customerId?: string;
}

export const RESERVATION_STATUS_OPTIONS: { value: ReservationStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'seated', label: 'Seated' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

export const RESERVATION_STATUS_VARIANTS: Record<ReservationStatus, 'warning' | 'info' | 'success' | 'default' | 'secondary' | 'danger'> = {
  pending: 'warning',
  confirmed: 'info',
  checked_in: 'info',
  seated: 'info',
  completed: 'success',
  cancelled: 'secondary',
  no_show: 'danger',
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  seated: 'Seated',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const RESERVATION_SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'staff', label: 'Staff' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'online', label: 'Online' },
  { value: 'walk_in', label: 'Walk In' },
  { value: 'partner', label: 'Partner' },
];

export const CALENDAR_VIEW_OPTIONS: { value: CalendarViewType; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'agenda', label: 'Agenda' },
];

export const ACTIVE_STATUSES: ReservationStatus[] = ['pending', 'confirmed', 'checked_in', 'seated'];
export const TERMINAL_STATUSES: ReservationStatus[] = ['completed', 'cancelled', 'no_show'];

export const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ['confirmed', 'cancelled', 'no_show'],
  confirmed: ['cancelled', 'no_show', 'checked_in', 'completed'],
  checked_in: ['cancelled', 'seated'],
  seated: ['no_show', 'completed'],
  completed: [],
  cancelled: [],
  no_show: [],
};
