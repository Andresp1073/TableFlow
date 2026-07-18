export type OrderStatus = 'draft' | 'submitted' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
export type OrderSource = 'pos' | 'online' | 'walk_in' | 'phone' | 'tablet';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  modifiers: string[];
  notes: string | null;
  stationId: string | null;
}

export interface SalesOrder {
  id: string;
  restaurantId: string;
  tableId: string | null;
  customerId: string | null;
  customerName: string | null;
  customerCount: number | null;
  status: OrderStatus;
  source: OrderSource;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentTransactionId: string | null;
  posReference: string | null;
  notes: string[];
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

export interface OrderDashboard {
  total: number;
  active: number;
  submitted: number;
  inProgress: number;
  ready: number;
  completed: number;
  cancelled: number;
  todayRevenue: number;
}

export interface CreateOrderInput {
  tableId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerCount?: number | null;
  source?: OrderSource;
  items?: CreateOrderItemInput[];
  notes?: string[];
}

export interface CreateOrderItemInput {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  modifiers?: string[];
  notes?: string | null;
  stationId?: string | null;
}

export interface SubmitOrderInput {
  kitchenId: string;
}

export interface ProcessPaymentInput {
  providerId: string;
  methodType: string;
  tipAmount?: number;
}

export interface SubmitOrderResult {
  orderId: string;
  status: string;
  total: number;
  kitchenTickets: string[];
  ticketCount: number;
}

export interface PaymentResult {
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentTransactionId: string;
  total: number;
  paid: number;
  tip: number;
  change: number;
  providerReference: string | null;
}

export interface OrderStatusResult {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  kitchenTickets: Array<{
    id: string;
    status: string;
    stationId: string;
  }>;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_progress: 'In Progress',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_VARIANTS: Record<OrderStatus, 'warning' | 'info' | 'success' | 'secondary' | 'danger' | 'default'> = {
  draft: 'warning',
  submitted: 'info',
  in_progress: 'info',
  ready: 'success',
  completed: 'default',
  cancelled: 'secondary',
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  'draft', 'submitted', 'in_progress', 'ready', 'completed', 'cancelled',
];

export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  pos: 'POS',
  online: 'Online',
  walk_in: 'Walk-in',
  phone: 'Phone',
  tablet: 'Tablet',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: 'text-orange-500',
  paid: 'text-green-500',
  refunded: 'text-blue-500',
  partially_refunded: 'text-yellow-500',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getOrderStatusColor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    draft: 'text-yellow-500',
    submitted: 'text-blue-500',
    in_progress: 'text-indigo-500',
    ready: 'text-green-500',
    completed: 'text-gray-500',
    cancelled: 'text-red-500',
  };
  return map[status] ?? 'text-gray-500';
}
