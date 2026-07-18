export interface TodayReservationsData {
  total: number;
  pending: number;
  confirmed: number;
  seated: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface CurrentOccupancyData {
  totalTables: number;
  occupiedTables: number;
  occupancyRate: number;
  totalCapacity: number;
  currentGuests: number;
}

export interface AvailableTablesData {
  total: number;
  available: number;
  reserved: number;
  occupied: number;
  maintenance: number;
}

export interface UpcomingReservationItem {
  id: string;
  customerName: string;
  customerEmail: string | null;
  partySize: number;
  startTime: string;
  status: string;
  tableNumber: string | null;
  notes: string | null;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  userName: string;
  createdAt: string;
}

export interface QuickStatisticsData {
  totalCustomers: number;
  averagePartySize: number;
  totalReservationsToday: number;
  cancellationRate: number;
  noShowRate: number;
  peakHour: string;
}

export interface KitchenStatusData {
  totalOrders: number;
  pending: number;
  preparing: number;
  ready: number;
  completed: number;
}

export interface PendingOrdersData {
  total: number;
  items: unknown[];
}

export interface LowInventoryAlertItem {
  id: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
}

export interface LowInventoryAlertsData {
  total: number;
  items: LowInventoryAlertItem[];
}

export interface RevenueSummaryData {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface DashboardData {
  todayReservations: TodayReservationsData;
  currentOccupancy: CurrentOccupancyData;
  availableTables: AvailableTablesData;
  upcomingReservations: UpcomingReservationItem[];
  recentActivity: RecentActivityItem[];
  quickStatistics: QuickStatisticsData;
  kitchenStatus: KitchenStatusData;
  pendingOrders: PendingOrdersData;
  lowInventoryAlerts: LowInventoryAlertsData;
  revenueSummary: RevenueSummaryData;
}

export type WidgetType =
  | 'todayReservations'
  | 'currentOccupancy'
  | 'availableTables'
  | 'kitchenStatus'
  | 'pendingOrders'
  | 'lowInventoryAlerts'
  | 'revenueSummary'
  | 'recentActivity'
  | 'upcomingReservations'
  | 'quickStatistics';

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

export interface WidgetConfig {
  type: WidgetType;
  size: WidgetSize;
  title: string;
  minPermission?: string;
}
