export const Events = {
  RESERVATION_CREATED: 'reservation:created',
  RESERVATION_UPDATED: 'reservation:updated',
  RESERVATION_CANCELLED: 'reservation:cancelled',
  RESERVATION_CHECKED_IN: 'reservation:checked_in',
  RESERVATION_NO_SHOW: 'reservation:no_show',
  CUSTOMER_CREATED: 'customer:created',
  CUSTOMER_UPDATED: 'customer:updated',
  USER_CREATED: 'user:created',
  USER_INVITED: 'user:invited',
  TABLE_STATUS_CHANGED: 'table:status_changed',
  NOTIFICATION_SENT: 'notification:sent',
  AUDIT_LOG_CREATED: 'audit_log:created',
} as const;
