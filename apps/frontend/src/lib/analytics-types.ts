'use client';

export type DateRangePreset = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'thisYear' | 'lastYear' | 'custom';

export type ReportCategory = 'executive' | 'sales' | 'reservations' | 'occupancy' | 'inventory' | 'kitchen' | 'customers' | 'financial' | 'audit';

export interface DateRange {
  from: string;
  to: string;
  preset?: DateRangePreset;
}

export interface ReportFilters {
  restaurantId?: string;
  dateRange: DateRange;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface KpiMetric {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  icon?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondary?: number;
  category?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

export interface ExecutiveDashboardData {
  revenue: KpiMetric;
  orders: KpiMetric;
  reservations: KpiMetric;
  occupancy: KpiMetric;
  averageTicket: KpiMetric;
  topProducts: { name: string; revenue: number; quantity: number }[];
  topCustomers: { name: string; totalSpent: number; visits: number }[];
  inventoryValue: KpiMetric;
  revenueChart: ChartDataPoint[];
  ordersByDay: ChartDataPoint[];
  reservationStatus: PieChartData[];
  recentActivity: { id: string; action: string; entity: string; description: string; userName: string; createdAt: string }[];
}

export interface SalesReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    cancelledOrders: number;
    refundedAmount: number;
  };
  revenueByPeriod: ChartDataPoint[];
  ordersByPeriod: ChartDataPoint[];
  revenueByPaymentMethod: PieChartData[];
  topSellingItems: { name: string; quantity: number; revenue: number }[];
  salesByHour: ChartDataPoint[];
}

export interface ReservationReportData {
  summary: {
    totalReservations: number;
    confirmed: number;
    cancelled: number;
    noShows: number;
    completed: number;
    averagePartySize: number;
    cancellationRate: number;
    noShowRate: number;
  };
  reservationsByPeriod: ChartDataPoint[];
  reservationsByStatus: PieChartData[];
  reservationsByHour: ChartDataPoint[];
  peakHours: { hour: string; count: number }[];
  tableUtilization: { name: string; reservations: number; utilizationRate: number }[];
}

export interface OccupancyReportData {
  summary: {
    averageOccupancyRate: number;
    peakOccupancyRate: number;
    totalTables: number;
    totalCapacity: number;
    averageGuestsPerDay: number;
  };
  occupancyByDay: ChartDataPoint[];
  occupancyByHour: ChartDataPoint[];
  occupancyByArea: { area: string; rate: number; totalTables: number; occupiedTables: number }[];
  peakTimes: { dayOfWeek: string; hour: string; occupancyRate: number }[];
}

export interface InventoryReportData {
  summary: {
    totalProducts: number;
    totalStockValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    pendingOrders: number;
    monthlyConsumption: number;
    wasteValue: number;
  };
  stockValueByCategory: PieChartData[];
  consumptionByPeriod: ChartDataPoint[];
  topConsumedItems: { name: string; quantity: number; cost: number }[];
  lowStockAlerts: { name: string; currentStock: number; reorderLevel: number; supplier: string }[];
  movementHistory: ChartDataPoint[];
}

export interface KitchenPerformanceData {
  summary: {
    totalTickets: number;
    completedTickets: number;
    pendingTickets: number;
    preparingTickets: number;
    delayedTickets: number;
    averagePrepTime: number;
    onTimeRate: number;
  };
  ticketsByPeriod: ChartDataPoint[];
  ticketsByStation: PieChartData[];
  averagePrepTimeByStation: ChartDataPoint[];
  delayedOrders: { id: string; items: string; station: string; elapsedTime: number; status: string }[];
  performanceTrend: ChartDataPoint[];
}

export interface CustomerAnalyticsData {
  summary: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    vipCustomers: number;
    averageCustomerLifetimeValue: number;
    averageVisitsPerCustomer: number;
    loyaltyMembers: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
  };
  customersByPeriod: ChartDataPoint[];
  customersByStatus: PieChartData[];
  topCustomers: { name: string; totalSpent: number; visits: number; lastVisit: string }[];
  spendingSegments: PieChartData[];
  loyaltyActivity: ChartDataPoint[];
  visitsByDayOfWeek: ChartDataPoint[];
}

export interface FinancialReportData {
  summary: {
    totalRevenue: number;
    totalTaxes: number;
    totalDiscounts: number;
    totalRefunds: number;
    netRevenue: number;
    averageTransactionValue: number;
    cashRevenue: number;
    cardRevenue: number;
    otherRevenue: number;
  };
  revenueByPeriod: ChartDataPoint[];
  revenueByPaymentMethod: PieChartData[];
  discountsByPeriod: ChartDataPoint[];
  refundsByPeriod: ChartDataPoint[];
  taxesByPeriod: ChartDataPoint[];
  revenueVsTarget: ChartDataPoint[];
}

export interface AuditReportData {
  summary: {
    totalEvents: number;
    criticalEvents: number;
    warningEvents: number;
    infoEvents: number;
    uniqueUsers: number;
    timeRange: string;
  };
  eventsByPeriod: ChartDataPoint[];
  eventsBySeverity: PieChartData[];
  eventsByEntity: PieChartData[];
  recentEvents: { id: string; action: string; entity: string; entityId: string; description: string; userName: string; severity: string; createdAt: string }[];
  topUsers: { userName: string; eventCount: number; lastAction: string }[];
}

export interface ExportConfig {
  filename: string;
  format: 'csv' | 'json' | 'print';
  data: Record<string, unknown>[];
  columns: { key: string; label: string }[];
}

export interface ReportMeta {
  title: string;
  description: string;
  category: ReportCategory;
  icon: string;
}

export const REPORT_META: Record<string, ReportMeta> = {
  executive: { title: 'Executive Dashboard', description: 'High-level business performance overview', category: 'executive', icon: 'BarChart3' },
  sales: { title: 'Sales Report', description: 'Revenue, orders, and sales performance analysis', category: 'sales', icon: 'TrendingUp' },
  reservations: { title: 'Reservation Report', description: 'Reservation trends, cancellations, and no-shows', category: 'reservations', icon: 'CalendarCheck' },
  occupancy: { title: 'Occupancy Report', description: 'Table utilization and occupancy rates', category: 'occupancy', icon: 'Table2' },
  inventory: { title: 'Inventory Report', description: 'Stock levels, consumption, and valuation', category: 'inventory', icon: 'Package' },
  kitchen: { title: 'Kitchen Performance', description: 'Ticket times, station performance, and delays', category: 'kitchen', icon: 'ChefHat' },
  customers: { title: 'Customer Analytics', description: 'Customer behavior, segments, and loyalty', category: 'customers', icon: 'Users' },
  financial: { title: 'Financial Report', description: 'Revenue, taxes, discounts, and payment methods', category: 'financial', icon: 'DollarSign' },
  audit: { title: 'Audit Report', description: 'Security events, user activity, and system changes', category: 'audit', icon: 'Shield' },
};

export const DATE_RANGE_PRESETS: { label: string; value: DateRangePreset; days: number }[] = [
  { label: 'Today', value: 'today', days: 0 },
  { label: 'Yesterday', value: 'yesterday', days: 1 },
  { label: 'This Week', value: 'thisWeek', days: 7 },
  { label: 'Last Week', value: 'lastWeek', days: 7 },
  { label: 'This Month', value: 'thisMonth', days: 30 },
  { label: 'Last Month', value: 'lastMonth', days: 30 },
  { label: 'This Quarter', value: 'thisQuarter', days: 90 },
  { label: 'Last Quarter', value: 'lastQuarter', days: 90 },
  { label: 'This Year', value: 'thisYear', days: 365 },
  { label: 'Last Year', value: 'lastYear', days: 365 },
];

export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  const end = now.toISOString();
  let start: string;

  switch (preset) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      break;
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString();
      break;
    }
    case 'thisWeek': {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      start = weekStart.toISOString();
      break;
    }
    case 'lastWeek': {
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - lastWeek.getDay() - 7);
      start = lastWeek.toISOString();
      const lastWeekEnd = new Date(lastWeek);
      lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
      return { from: start, to: lastWeekEnd.toISOString(), preset };
    }
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      break;
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      return { from: start, to: new Date(now.getFullYear(), now.getMonth(), 0).toISOString(), preset };
    case 'thisQuarter': {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qStart, 1).toISOString();
      break;
    }
    case 'lastQuarter': {
      const lqStart = Math.floor(now.getMonth() / 3) * 3 - 3;
      const qStartMonth = lqStart < 0 ? 9 : lqStart;
      const qYear = lqStart < 0 ? now.getFullYear() - 1 : now.getFullYear();
      start = new Date(qYear, qStartMonth, 1).toISOString();
      return { from: start, to: new Date(qYear, qStartMonth + 3, 0).toISOString(), preset };
    }
    case 'thisYear':
      start = new Date(now.getFullYear(), 0, 1).toISOString();
      break;
    case 'lastYear':
      start = new Date(now.getFullYear() - 1, 0, 1).toISOString();
      return { from: start, to: new Date(now.getFullYear() - 1, 11, 31).toISOString(), preset };
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }

  return { from: start, to: end, preset };
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
