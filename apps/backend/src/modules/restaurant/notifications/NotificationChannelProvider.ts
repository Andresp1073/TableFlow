import type { NotificationChannelType, NotificationMessage, ChannelDeliveryResult } from "./types.js";

export interface NotificationChannelProvider {
  readonly channelType: NotificationChannelType;
  send(message: NotificationMessage): Promise<ChannelDeliveryResult>;
}
