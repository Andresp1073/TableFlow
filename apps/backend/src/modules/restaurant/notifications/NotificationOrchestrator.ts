import type { EventBus } from "../../../events/EventBus.js";
import type { NotificationDispatcher } from "./NotificationDispatcher.js";
import type { NotificationContext, NotificationEventType } from "./types.js";
import type {
  ReservationCreated,
  ReservationConfirmed,
  ReservationCancelled,
  ReservationCompleted,
  ReservationNoShow,
} from "../reservations/domain/events/ReservationEvents.js";

export interface NotificationOrchestratorConfig {
  eventBus: EventBus;
  dispatcher: NotificationDispatcher;
}

export class NotificationOrchestrator {
  private readonly eventBus: EventBus;
  private readonly dispatcher: NotificationDispatcher;
  private started = false;

  constructor(config: NotificationOrchestratorConfig) {
    this.eventBus = config.eventBus;
    this.dispatcher = config.dispatcher;
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    this.eventBus.on("ReservationCreated", this.handleReservationCreated);
    this.eventBus.on("ReservationConfirmed", this.handleReservationConfirmed);
    this.eventBus.on("ReservationCancelled", this.handleReservationCancelled);
    this.eventBus.on("ReservationCompleted", this.handleReservationCompleted);
    this.eventBus.on("ReservationNoShow", this.handleReservationNoShow);
  }

  stop(): void {
    if (!this.started) return;

    this.eventBus.off("ReservationCreated", this.handleReservationCreated);
    this.eventBus.off("ReservationConfirmed", this.handleReservationConfirmed);
    this.eventBus.off("ReservationCancelled", this.handleReservationCancelled);
    this.eventBus.off("ReservationCompleted", this.handleReservationCompleted);
    this.eventBus.off("ReservationNoShow", this.handleReservationNoShow);

    this.started = false;
  }

  isStarted(): boolean {
    return this.started;
  }

  async handleExternalEvent(
    eventType: NotificationEventType,
    context: Omit<NotificationContext, "eventType">,
  ): Promise<void> {
    await this.dispatcher.dispatch({ ...context, eventType });
  }

  private handleReservationCreated = async (event: ReservationCreated): Promise<void> => {
    await this.dispatcher.dispatch({
      eventType: "ReservationCreated",
      restaurantId: event.restaurantId,
      reservationId: event.id,
      partySize: event.partySize,
      metadata: {
        reservationNumber: event.reservationNumber,
        createdBy: event.createdBy,
      },
    });
  };

  private handleReservationConfirmed = async (event: ReservationConfirmed): Promise<void> => {
    await this.dispatcher.dispatch({
      eventType: "ReservationConfirmed",
      restaurantId: event.restaurantId,
      reservationId: event.id,
      metadata: {
        reservationNumber: event.reservationNumber,
      },
    });
  };

  private handleReservationCancelled = async (event: ReservationCancelled): Promise<void> => {
    await this.dispatcher.dispatch({
      eventType: "ReservationCancelled",
      restaurantId: event.restaurantId,
      reservationId: event.id,
      metadata: {
        reservationNumber: event.reservationNumber,
        cancelledBy: event.cancelledBy,
      },
    });
  };

  private handleReservationCompleted = async (event: ReservationCompleted): Promise<void> => {
    await this.dispatcher.dispatch({
      eventType: "ReservationCompleted",
      restaurantId: event.restaurantId,
      reservationId: event.id,
      metadata: {
        reservationNumber: event.reservationNumber,
      },
    });
  };

  private handleReservationNoShow = async (event: ReservationNoShow): Promise<void> => {
    await this.dispatcher.dispatch({
      eventType: "ReservationNoShow",
      restaurantId: event.restaurantId,
      reservationId: event.id,
      metadata: {
        reservationNumber: event.reservationNumber,
      },
    });
  };
}
