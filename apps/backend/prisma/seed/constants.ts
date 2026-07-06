export const RESERVATION_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
} as const;

export const TABLE_STATUSES = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  OCCUPIED: "occupied",
  CLEANING: "cleaning",
  MAINTENANCE: "maintenance",
  UNAVAILABLE: "unavailable",
} as const;

export const NOTIFICATION_TYPES = {
  RESERVATION_CREATED: "reservation_created",
  RESERVATION_UPDATED: "reservation_updated",
  RESERVATION_CANCELLED: "reservation_cancelled",
  REMINDER: "reminder",
  PROMOTION: "promotion",
} as const;

export const RESERVATION_SOURCES = {
  PHONE: "phone",
  WALK_IN: "walk_in",
  ONLINE: "online",
  STAFF: "staff",
} as const;

export const RISK_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;
