import type { Event as EventInterface, DomainEvent as DomainEventInterface, EventMetadata as EventMetadataInterface } from "./types.js";
import { EventMetadataFactory, generateEventId } from "./EventMetadata.js";

export class BaseEvent implements EventInterface {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: Date;
  readonly metadata: EventMetadataInterface;
  readonly payload: Record<string, unknown>;

  constructor(type: string, payload: Record<string, unknown>, metadata?: Partial<EventMetadataInterface>) {
    this.id = generateEventId();
    this.type = type;
    this.occurredAt = new Date();
    this.payload = { ...payload };
    this.metadata = EventMetadataFactory.create(metadata);
  }
}

export class DomainEvent implements DomainEventInterface {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: Date;
  readonly metadata: EventMetadataInterface;
  readonly payload: Record<string, unknown>;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly domainVersion: number;

  constructor(
    type: string,
    aggregateId: string,
    aggregateType: string,
    payload: Record<string, unknown>,
    domainVersion = 1,
    metadata?: Partial<EventMetadataInterface>,
  ) {
    this.id = generateEventId();
    this.type = type;
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.domainVersion = domainVersion;
    this.payload = { ...payload };
    this.metadata = EventMetadataFactory.create({
      ...metadata,
      custom: { ...metadata?.custom, aggregateType, domainVersion },
    });
  }
}
