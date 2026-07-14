import type {
  Event,
  EventDispatcherInterface,
  HandlerRegistration,
  DispatchResult,
  Logger,
} from "./types.js";

export class EventDispatcher implements EventDispatcherInterface {
  async dispatch(
    event: Event,
    registrations: HandlerRegistration[],
    logger?: Logger,
  ): Promise<DispatchResult> {
    const startTime = performance.now();
    let handlersExecuted = 0;
    let handlersFailed = 0;
    const errors: Array<{ handlerName: string; error: string; retryable: boolean }> = [];

    for (const registration of registrations) {
      if (registration.handler.mode === "async") {
        continue;
      }

      try {
        await registration.handler.handle(event);
        handlersExecuted++;
      } catch (error) {
        handlersFailed++;
        const message = error instanceof Error ? error.message : String(error);
        const retryable = registration.maxRetries > 0;

        errors.push({
          handlerName: registration.handler.handlerName,
          error: message,
          retryable,
        });

        if (logger) {
          logger.error(`Event handler "${registration.handler.handlerName}" failed for event ${event.type}`, {
            eventId: event.id,
            handlerName: registration.handler.handlerName,
            error: message,
            retryable,
          });
        }
      }
    }

    const duration = performance.now() - startTime;

    return {
      eventId: event.id,
      eventType: event.type,
      handlersExecuted,
      handlersFailed,
      errors,
      duration,
    };
  }

  async dispatchAsync(
    event: Event,
    registrations: HandlerRegistration[],
    logger?: Logger,
  ): Promise<DispatchResult> {
    const startTime = performance.now();
    let handlersExecuted = 0;
    let handlersFailed = 0;
    const errors: Array<{ handlerName: string; error: string; retryable: boolean }> = [];

    const asyncRegistrations = registrations.filter((r) => r.handler.mode === "async");

    if (asyncRegistrations.length === 0) {
      const duration = performance.now() - startTime;

      return {
        eventId: event.id,
        eventType: event.type,
        handlersExecuted: 0,
        handlersFailed: 0,
        errors: [],
        duration,
      };
    }

    const results = await Promise.allSettled(
      asyncRegistrations.map(async (registration) => {
        try {
          await registration.handler.handle(event);

          return { name: registration.handler.handlerName, success: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);

          return {
            name: registration.handler.handlerName,
            success: false,
            error: message,
            retryable: registration.maxRetries > 0,
          };
        }
      }),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        handlersFailed++;

        errors.push({
          handlerName: "unknown",
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          retryable: false,
        });
      } else if (result.value.success) {
        handlersExecuted++;
      } else {
        handlersFailed++;

        errors.push({
          handlerName: result.value.name,
          error: result.value.error,
          retryable: result.value.retryable,
        });

        if (logger) {
          logger.error(`Async event handler "${result.value.name}" failed for event ${event.type}`, {
            eventId: event.id,
            handlerName: result.value.name,
            error: result.value.error,
            retryable: result.value.retryable,
          });
        }
      }
    }

    const duration = performance.now() - startTime;

    return {
      eventId: event.id,
      eventType: event.type,
      handlersExecuted,
      handlersFailed,
      errors,
      duration,
    };
  }

  async dispatchAll(
    event: Event,
    registrations: HandlerRegistration[],
    logger?: Logger,
  ): Promise<DispatchResult> {
    const syncResult = await this.dispatch(event, registrations, logger);
    const asyncResult = await this.dispatchAsync(event, registrations, logger);

    return {
      eventId: event.id,
      eventType: event.type,
      handlersExecuted: syncResult.handlersExecuted + asyncResult.handlersExecuted,
      handlersFailed: syncResult.handlersFailed + asyncResult.handlersFailed,
      errors: [...syncResult.errors, ...asyncResult.errors],
      duration: syncResult.duration + asyncResult.duration,
    };
  }
}
