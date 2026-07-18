export class OrderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "OrderError";
  }
}

export class OrderNotFoundError extends OrderError {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`, "ORDER_NOT_FOUND", 404);
  }
}

export class OrderStatusError extends OrderError {
  constructor(message: string) {
    super(message, "ORDER_STATUS_ERROR", 400);
  }
}

export class OrderValidationError extends OrderError {
  constructor(message: string) {
    super(message, "ORDER_VALIDATION_ERROR", 400);
  }
}
