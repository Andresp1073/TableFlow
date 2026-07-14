import type { NotificationEventType, NotificationChannelType, NotificationContext } from "./types.js";

const DEFAULT_CHANNEL_MAP: Record<NotificationEventType, NotificationChannelType[]> = {
  ReservationCreated: ["email", "sms", "in_app"],
  ReservationConfirmed: ["email", "in_app"],
  ReservationCancelled: ["email", "in_app"],
  ReservationCompleted: ["in_app"],
  ReservationNoShow: ["email", "in_app"],
  WaitlistPromoted: ["sms", "email", "push", "in_app"],
};

export interface NotificationChannelResolver {
  resolve(context: NotificationContext): NotificationChannelType[];
}

export class DefaultNotificationChannelResolver implements NotificationChannelResolver {
  private readonly channelMap: Record<NotificationEventType, NotificationChannelType[]>;

  constructor(overrides?: Partial<Record<NotificationEventType, NotificationChannelType[]>>) {
    this.channelMap = { ...DEFAULT_CHANNEL_MAP, ...overrides };
  }

  resolve(context: NotificationContext): NotificationChannelType[] {
    const channels = this.channelMap[context.eventType];

    if (!channels) {
      return [];
    }

    return this.filterByRecipientAvailability(channels, context);
  }

  withOverrides(overrides: Partial<Record<NotificationEventType, NotificationChannelType[]>>): DefaultNotificationChannelResolver {
    return new DefaultNotificationChannelResolver({ ...this.channelMap, ...overrides });
  }

  private filterByRecipientAvailability(
    channels: NotificationChannelType[],
    context: NotificationContext,
  ): NotificationChannelType[] {
    return channels.filter((channel) => {
      switch (channel) {
        case "email":
          return Boolean(context.customerEmail);
        case "sms":
          return Boolean(context.customerPhone);
        case "whatsapp":
          return Boolean(context.customerPhone);
        case "push":
          return true;
        case "webhook":
          return true;
        case "in_app":
          return true;
        default:
          return false;
      }
    });
  }
}
