export interface OrderItemDto {
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

export interface OrderDto {
  id: string;
  restaurantId: string;
  tableId: string | null;
  customerId: string | null;
  customerName: string | null;
  customerCount: number | null;
  status: string;
  source: string;
  items: OrderItemDto[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentStatus: string;
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

export interface OrderDashboardDto {
  total: number;
  active: number;
  submitted: number;
  inProgress: number;
  ready: number;
  completed: number;
  cancelled: number;
  todayRevenue: number;
}
