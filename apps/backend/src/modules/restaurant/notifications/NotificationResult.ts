import type { DeliveryStatus, ChannelDeliveryResult } from "./types.js";

export interface NotificationResult {
  notificationId: string;
  eventType: string;
  overallStatus: DeliveryStatus;
  channelResults: ChannelDeliveryResult[];
  attemptedChannels: number;
  successfulChannels: number;
  failedChannels: number;
  skippedChannels: number;
  error: string | null;
  completedAt: Date;
}

export function successful(
  notificationId: string,
  eventType: string,
  channelResults: ChannelDeliveryResult[],
  completedAt: Date = new Date(),
): NotificationResult {
  const sent = channelResults.filter((r) => r.status === "sent");
  return {
    notificationId,
    eventType,
    overallStatus: "sent",
    channelResults,
    attemptedChannels: channelResults.length,
    successfulChannels: sent.length,
    failedChannels: channelResults.filter((r) => r.status === "failed").length,
    skippedChannels: channelResults.filter((r) => r.status === "skipped").length,
    error: null,
    completedAt,
  };
}

export function partial(
  notificationId: string,
  eventType: string,
  channelResults: ChannelDeliveryResult[],
  completedAt: Date = new Date(),
): NotificationResult {
  const sent = channelResults.filter((r) => r.status === "sent");
  return {
    notificationId,
    eventType,
    overallStatus: "sent",
    channelResults,
    attemptedChannels: channelResults.length,
    successfulChannels: sent.length,
    failedChannels: channelResults.filter((r) => r.status === "failed").length,
    skippedChannels: channelResults.filter((r) => r.status === "skipped").length,
    error: null,
    completedAt,
  };
}

export function failed(
  notificationId: string,
  eventType: string,
  error: string,
  channelResults: ChannelDeliveryResult[] = [],
  completedAt: Date = new Date(),
): NotificationResult {
  return {
    notificationId,
    eventType,
    overallStatus: "failed",
    channelResults,
    attemptedChannels: channelResults.length,
    successfulChannels: 0,
    failedChannels: channelResults.length,
    skippedChannels: 0,
    error,
    completedAt,
  };
}

export function skipped(
  notificationId: string,
  eventType: string,
  reason: string,
  completedAt: Date = new Date(),
): NotificationResult {
  return {
    notificationId,
    eventType,
    overallStatus: "skipped",
    channelResults: [],
    attemptedChannels: 0,
    successfulChannels: 0,
    failedChannels: 0,
    skippedChannels: 0,
    error: reason,
    completedAt,
  };
}
