export type NotificationEventType =
  | "ReservationCreated"
  | "ReservationConfirmed"
  | "ReservationCancelled"
  | "ReservationCompleted"
  | "ReservationNoShow"
  | "WaitlistPromoted";

export type NotificationChannelType =
  | "email"
  | "sms"
  | "whatsapp"
  | "push"
  | "webhook"
  | "in_app";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type DeliveryStatus = "sent" | "failed" | "queued" | "skipped" | "pending";

export interface NotificationRecipient {
  email?: string;
  phone?: string;
  userId?: string;
  deviceToken?: string;
  webhookUrl?: string;
}

export interface NotificationContext {
  eventType: NotificationEventType;
  restaurantId: string;
  reservationId?: string;
  waitlistEntryId?: string;
  customerId?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  partySize?: number;
  date?: Date;
  startTime?: Date;
  endTime?: Date;
  tableId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface NotificationTemplate {
  subject: string;
  body: string;
  channel: NotificationChannelType;
  eventType: NotificationEventType;
}

export interface NotificationMessage {
  id: string;
  eventType: NotificationEventType;
  channel: NotificationChannelType;
  recipient: NotificationRecipient;
  template: NotificationTemplate;
  context: NotificationContext;
  priority: NotificationPriority;
  createdAt: Date;
}

export interface QueuedNotification {
  message: NotificationMessage;
  retryCount: number;
  maxRetries: number;
  scheduledAt: Date;
}

export interface ChannelDeliveryResult {
  status: DeliveryStatus;
  channel: NotificationChannelType;
  messageId: string;
  providerMessageId?: string;
  error?: string;
  deliveredAt?: Date;
  metadata?: Record<string, unknown>;
}
