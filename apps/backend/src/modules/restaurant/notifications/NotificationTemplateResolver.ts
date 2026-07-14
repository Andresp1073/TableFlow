import type { NotificationEventType, NotificationChannelType, NotificationTemplate, NotificationContext } from "./types.js";

export interface NotificationTemplateResolver {
  resolve(
    eventType: NotificationEventType,
    channel: NotificationChannelType,
    context: NotificationContext,
  ): NotificationTemplate;
}

const TEMPLATES: Record<string, { subject: string; body: string }> = {
  "ReservationCreated_email": {
    subject: "Reservation Confirmed - TableFlow",
    body: "Your reservation for {partySize} guests at {restaurantId} on {date} at {startTime} has been created.",
  },
  "ReservationCreated_sms": {
    subject: "Reservation Confirmed",
    body: "TableFlow: Your reservation for {partySize} at {restaurantId} on {date} at {startTime} is confirmed.",
  },
  "ReservationCreated_in_app": {
    subject: "Reservation Created",
    body: "Your reservation for {partySize} guests at {restaurantId} is confirmed for {date} at {startTime}.",
  },
  "ReservationConfirmed_email": {
    subject: "Reservation Confirmed - TableFlow",
    body: "Your reservation for {partySize} guests at {restaurantId} on {date} at {startTime} has been confirmed.",
  },
  "ReservationConfirmed_in_app": {
    subject: "Reservation Confirmed",
    body: "Your reservation for {partySize} guests at {restaurantId} is confirmed for {date} at {startTime}.",
  },
  "ReservationCancelled_email": {
    subject: "Reservation Cancelled - TableFlow",
    body: "Your reservation for {partySize} guests at {restaurantId} on {date} at {startTime} has been cancelled.",
  },
  "ReservationCancelled_in_app": {
    subject: "Reservation Cancelled",
    body: "Your reservation for {partySize} guests at {restaurantId} on {date} at {startTime} has been cancelled.",
  },
  "ReservationCompleted_in_app": {
    subject: "Reservation Completed",
    body: "Thank you for dining with us at {restaurantId}! We hope you enjoyed your experience.",
  },
  "ReservationNoShow_email": {
    subject: "Missed Reservation - TableFlow",
    body: "You missed your reservation for {partySize} guests at {restaurantId} on {date} at {startTime}.",
  },
  "ReservationNoShow_in_app": {
    subject: "Missed Reservation",
    body: "You missed your reservation for {partySize} guests at {restaurantId} on {date} at {startTime}.",
  },
  "WaitlistPromoted_sms": {
    subject: "Table Ready!",
    body: "Your table for {partySize} at {restaurantId} is ready. Please proceed to the host stand.",
  },
  "WaitlistPromoted_email": {
    subject: "Your Table Is Ready - TableFlow",
    body: "Your table for {partySize} guests at {restaurantId} is ready. Please proceed to the restaurant.",
  },
  "WaitlistPromoted_push": {
    subject: "Table Ready",
    body: "Your table for {partySize} at {restaurantId} is ready! Please proceed to the host stand.",
  },
  "WaitlistPromoted_in_app": {
    subject: "Table Ready",
    body: "Your table for {partySize} at {restaurantId} is ready! Please proceed to the host stand.",
  },
};

export class DefaultNotificationTemplateResolver implements NotificationTemplateResolver {
  resolve(
    eventType: NotificationEventType,
    channel: NotificationChannelType,
    context: NotificationContext,
  ): NotificationTemplate {
    const key = `${eventType}_${channel}`;
    const template = TEMPLATES[key];

    if (!template) {
      return {
        subject: `Notification: ${eventType}`,
        body: `A notification event of type ${eventType} has occurred.`,
        channel,
        eventType,
      };
    }

    return {
      subject: this.fillTemplate(template.subject, context),
      body: this.fillTemplate(template.body, context),
      channel,
      eventType,
    };
  }

  private fillTemplate(text: string, context: NotificationContext): string {
    return text
      .replace(/\{partySize\}/g, String(context.partySize ?? ""))
      .replace(/\{date\}/g, context.date ? context.date.toLocaleDateString() : "")
      .replace(/\{startTime\}/g, context.startTime ? context.startTime.toLocaleTimeString() : "")
      .replace(/\{endTime\}/g, context.endTime ? context.endTime.toLocaleTimeString() : "")
      .replace(/\{restaurantId\}/g, context.restaurantId)
      .replace(/\{reservationId\}/g, context.reservationId ?? "")
      .replace(/\{customerId\}/g, context.customerId ?? "");
  }
}
