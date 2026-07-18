export type TicketStatus =
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export type KitchenPriority = 'normal' | 'high' | 'urgent' | 'vip' | 'delayed';

export type SLAStatus = 'on_track' | 'warning' | 'delayed';

export type StationType =
  | 'grill'
  | 'bar'
  | 'dessert'
  | 'cold'
  | 'preparation'
  | 'custom';

export type StationStatus = 'active' | 'inactive' | 'paused' | 'closed';

export type OrderSource = 'pos' | 'online' | 'walk_in' | 'phone' | 'tablet';

export interface KitchenTicketItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  status: TaskStatus;
  stationId: string;
  modifiers: string[];
  notes?: string;
  estimatedPrepTimeSeconds?: number;
}

export interface KitchenTicket {
  id: string;
  restaurantId: string;
  kitchenId: string;
  orderId: string;
  stationId: string;
  priority: KitchenPriority;
  status: TicketStatus;
  items: KitchenTicketItem[];
  notes: string[];
  tableId?: string;
  customerName?: string;
  customerCount?: number;
  source?: OrderSource;
  posReference?: string;
  createdAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  deliveredAt: string | null;
}

export interface KitchenStationInfo {
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
  customTypeLabel?: string;
}

export interface KitchenStats {
  totalOrders: number;
  pending: number;
  preparing: number;
  ready: number;
  completed: number;
  averagePrepTime: number;
  slaLate: number;
}

export interface CreateKitchenTicketInput {
  restaurantId: string;
  kitchenId: string;
  orderId: string;
  stationId: string;
  tableId?: string;
  customerName?: string;
  customerCount?: number;
  priority: KitchenPriority;
  items: {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    stationId: string;
    modifiers?: string[];
    notes?: string;
    estimatedPrepTimeSeconds?: number;
  }[];
  notes?: string[];
}

export interface OrderBoardColumn {
  id: TicketStatus;
  label: string;
  tickets: KitchenTicket[];
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  new: 'New',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const TICKET_STATUS_VARIANTS: Record<TicketStatus, 'warning' | 'info' | 'success' | 'secondary' | 'danger' | 'default'> = {
  new: 'warning',
  accepted: 'info',
  preparing: 'info',
  ready: 'success',
  delivered: 'default',
  cancelled: 'secondary',
};

export const STATION_TYPE_LABELS: Record<StationType, string> = {
  grill: 'Grill',
  bar: 'Bar',
  dessert: 'Dessert',
  cold: 'Cold Kitchen',
  preparation: 'Preparation',
  custom: 'Custom',
};

export const TICKET_STATUS_ORDER: TicketStatus[] = [
  'new',
  'accepted',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
];

export const ACTIVE_TICKET_STATUSES: TicketStatus[] = [
  'new',
  'accepted',
  'preparing',
  'ready',
];

export const TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  new: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export const PRIORITY_ORDER: KitchenPriority[] = [
  'delayed',
  'vip',
  'urgent',
  'high',
  'normal',
];

export const PRIORITY_LABELS: Record<KitchenPriority, string> = {
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
  vip: 'VIP',
  delayed: 'Delayed',
};

export const PRIORITY_COLORS: Record<KitchenPriority, string> = {
  normal: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
  vip: 'bg-purple-500',
  delayed: 'bg-rose-600',
};

export const SLA_TIME_LIMITS_MS: Record<KitchenPriority, number> = {
  normal: 600_000,
  high: 450_000,
  urgent: 300_000,
  vip: 180_000,
  delayed: 300_000,
};

export const KDS_REFRESH_INTERVAL_MS = 10_000;
