import type { QueuedNotification } from "./types.js";

export interface NotificationQueue {
  enqueue(notification: QueuedNotification): Promise<void>;
  dequeue(): Promise<QueuedNotification | null>;
  peek(): Promise<QueuedNotification | null>;
  remove(messageId: string): Promise<void>;
  length(): Promise<number>;
  clear(): Promise<void>;
}

export class InMemoryNotificationQueue implements NotificationQueue {
  private readonly queue: QueuedNotification[] = [];

  async enqueue(notification: QueuedNotification): Promise<void> {
    this.queue.push(notification);
  }

  async dequeue(): Promise<QueuedNotification | null> {
    return this.queue.shift() ?? null;
  }

  async peek(): Promise<QueuedNotification | null> {
    return this.queue[0] ?? null;
  }

  async remove(messageId: string): Promise<void> {
    const index = this.queue.findIndex((n) => n.message.id === messageId);
    if (index >= 0) {
      this.queue.splice(index, 1);
    }
  }

  async length(): Promise<number> {
    return this.queue.length;
  }

  async clear(): Promise<void> {
    this.queue.length = 0;
  }
}
