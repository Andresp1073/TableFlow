import type {
  NotificationContext,
  NotificationChannelType,
  NotificationMessage,
  NotificationChannelProvider,
  ChannelDeliveryResult,
  QueuedNotification,
} from "./types.js";
import type { NotificationResult } from "./NotificationResult.js";
import { failed as failResult, skipped } from "./NotificationResult.js";
import type { NotificationChannelResolver } from "./NotificationChannelResolver.js";
import type { NotificationTemplateResolver } from "./NotificationTemplateResolver.js";
import type { NotificationQueue } from "./NotificationQueue.js";

let messageCounter = 0;

function generateMessageId(): string {
  messageCounter++;
  return `notif_${Date.now()}_${messageCounter}`;
}

export class NotificationDispatcher {
  private readonly channelProviders: Map<NotificationChannelType, NotificationChannelProvider>;

  constructor(
    private readonly channelResolver: NotificationChannelResolver,
    private readonly templateResolver: NotificationTemplateResolver,
    private readonly queue: NotificationQueue,
    channelProviders: NotificationChannelProvider[] = [],
  ) {
    this.channelProviders = new Map(
      channelProviders.map((p) => [p.channelType, p]),
    );
  }

  registerProvider(provider: NotificationChannelProvider): void {
    this.channelProviders.set(provider.channelType, provider);
  }

  async dispatch(context: NotificationContext): Promise<NotificationResult> {
    const notificationId = generateMessageId();

    if (!context.customerEmail && !context.customerPhone && !context.customerId) {
      return skipped(notificationId, context.eventType, "No recipient available");
    }

    const channels = this.channelResolver.resolve(context);

    if (channels.length === 0) {
      return skipped(notificationId, context.eventType, "No channels resolved for this event and recipient");
    }

    const results: ChannelDeliveryResult[] = [];
    const messages: NotificationMessage[] = [];

    for (const channel of channels) {
      const template = this.templateResolver.resolve(context.eventType, channel, context);

      const message: NotificationMessage = {
        id: generateMessageId(),
        eventType: context.eventType,
        channel,
        recipient: {
          email: context.customerEmail ?? undefined,
          phone: context.customerPhone ?? undefined,
          userId: context.customerId ?? undefined,
        },
        template,
        context,
        priority: "normal",
        createdAt: new Date(),
      };

      messages.push(message);
    }

    for (const message of messages) {
      const provider = this.channelProviders.get(message.channel);

      if (!provider) {
        const queued: QueuedNotification = {
          message,
          retryCount: 0,
          maxRetries: 3,
          scheduledAt: new Date(),
        };

        await this.queue.enqueue(queued);

        results.push({
          status: "queued",
          channel: message.channel,
          messageId: message.id,
          deliveredAt: new Date(),
          metadata: { queued: true, provider: "no_provider_available" },
        });

        continue;
      }

      try {
        const result = await provider.send(message);
        results.push(result);
      } catch (error) {
        results.push({
          status: "failed",
          channel: message.channel,
          messageId: message.id,
          error: error instanceof Error ? error.message : "Unknown error",
          deliveredAt: new Date(),
        });
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.filter((r) => r.status === "failed").length;
    const allSent = sentCount === results.length;

    if (allSent) {
      const { successful } = await import("./NotificationResult.js");
      return successful(notificationId, context.eventType, results);
    }

    if (failedCount === results.length) {
      return failResult(notificationId, context.eventType, "All channels failed", results);
    }

    const { partial } = await import("./NotificationResult.js");
    return partial(notificationId, context.eventType, results);
  }

  async processQueue(): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    while (true) {
      const item = await this.queue.dequeue();
      if (!item) break;

      const provider = this.channelProviders.get(item.message.channel);

      if (!provider) {
        continue;
      }

      try {
        const result = await provider.send(item.message);
        const { successful } = await import("./NotificationResult.js");
        results.push(successful(item.message.id, item.message.eventType, [result]));
      } catch (error) {
        if (item.retryCount < item.maxRetries) {
          const retry: QueuedNotification = {
            ...item,
            retryCount: item.retryCount + 1,
            scheduledAt: new Date(Date.now() + 5000 * (item.retryCount + 1)),
          };
          await this.queue.enqueue(retry);
        } else {
          const { failed } = await import("./NotificationResult.js");
          results.push(
            failed(
              item.message.id,
              item.message.eventType,
              error instanceof Error ? error.message : "Max retries exceeded",
            ),
          );
        }
      }
    }

    return results;
  }
}
