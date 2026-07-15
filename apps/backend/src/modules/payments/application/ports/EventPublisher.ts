export interface EventPublisher {
  publish(eventName: string, payload: Record<string, unknown>): void;
}
