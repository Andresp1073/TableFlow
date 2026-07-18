export enum OrderStatus {
  Draft = "draft",
  Submitted = "submitted",
  InProgress = "in_progress",
  Ready = "ready",
  Completed = "completed",
  Cancelled = "cancelled",
}

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.Draft]: [OrderStatus.Submitted, OrderStatus.Cancelled],
  [OrderStatus.Submitted]: [OrderStatus.InProgress, OrderStatus.Cancelled],
  [OrderStatus.InProgress]: [OrderStatus.Ready, OrderStatus.Cancelled],
  [OrderStatus.Ready]: [OrderStatus.Completed, OrderStatus.Cancelled],
  [OrderStatus.Completed]: [],
  [OrderStatus.Cancelled]: [],
};

export const ORDER_STATUSES: readonly OrderStatus[] = Object.values(OrderStatus);
