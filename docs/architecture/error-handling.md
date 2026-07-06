# Error Handling

**Last updated:** 2026-07-04

## Philosophy

- **Fail fast.** Reject invalid input at the earliest possible point.
- **Fail gracefully.** Never expose stack traces or internal details.
- **Be predictable.** Same error format for every error in the system.
- **Log with context.** Every error includes request ID, user ID, and action.

---

## Error Class Hierarchy

```
AppError (abstract)
├── ValidationError        (400) — Zod validation failures
├── AuthenticationError    (401) — Missing/invalid token
├── AuthorizationError     (403) — Insufficient permissions
├── NotFoundError          (404) — Resource not found
├── ConflictError          (409) — Duplicate/overlapping resource
├── BusinessRuleError      (422) — Business rule violation
├── RateLimitError         (429) — Too many requests
└── InternalError          (500) — Unexpected server error
```

```typescript
// AppError base class
export abstract class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown[],
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Concrete error
export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, 'NOT_FOUND', `${resource} with id '${id}' not found`);
  }
}
```

---

## Error Response Format

Every error response follows this exact structure:

```json
{
  "error": {
    "status": 400,
    "code": "VALIDATION_ERROR",
    "message": "Validation failed. Check 'details' for more information.",
    "details": [
      {
        "field": "partySize",
        "message": "Party size must be between 1 and 20",
        "code": "too_big"
      }
    ],
    "requestId": "req_abc123"
  }
}
```

| Field | Description |
|-------|-------------|
| `error.status` | HTTP status code |
| `error.code` | Machine-readable error code (UPPER_SNAKE_CASE) |
| `error.message` | Human-readable error description |
| `error.details` | Array of field-level errors (for validation) |
| `error.requestId` | Correlatable ID for debugging |

---

## Error Codes

| Code | HTTP Status | Source |
|------|-------------|--------|
| `VALIDATION_ERROR` | 400 | Zod validation |
| `UNAUTHENTICATED` | 401 | Auth middleware |
| `TOKEN_EXPIRED` | 401 | Expired JWT |
| `TOKEN_INVALID` | 401 | Invalid JWT |
| `FORBIDDEN` | 403 | RBAC middleware |
| `NOT_FOUND` | 404 | Repository |
| `CONFLICT` | 409 | Duplicate/overlap |
| `BUSINESS_RULE_ERROR` | 422 | Service |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limiter |
| `INTERNAL_ERROR` | 500 | Unexpected |

---

## Where Errors Are Thrown

| Layer | Error Type | Example |
|-------|------------|---------|
| **Middleware** | AuthenticationError, AuthorizationError, RateLimitError | Invalid JWT, missing permission, rate limit |
| **Validator** | ValidationError | Invalid party size, missing required field |
| **Controller** | (delegates to service) | — |
| **Service** | NotFoundError, ConflictError, BusinessRuleError | Reservation not found, overlapping slot, cannot cancel completed reservation |
| **Repository** | NotFoundError (wraps Prisma), InternalError | Record not found, database connection error |

---

## Global Error Handler

A single middleware catches all errors:

```typescript
// errorHandler middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log error with context
  logger.error({ err, requestId: req.id, userId: req.user?.id }, 'Request failed');

  // Known application error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        status: err.statusCode,
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.id,
      },
    });
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: {
          status: 409,
          code: 'CONFLICT',
          message: 'A record with this value already exists',
          requestId: req.id,
        },
      });
    }
  }

  // Unknown error (500)
  return res.status(500).json({
    error: {
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId: req.id,
    },
  });
}
```

---

## Validation Error Detail Format

Zod validation errors are transformed into a consistent format:

```typescript
// Validator middleware transforms Zod errors
function formatZodError(error: ZodError): ValidationErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}
```

---

## Business Rule Error Pattern

Services throw business rule errors instead of returning error objects:

```typescript
// Service method
async cancelReservation(id: string): Promise<Reservation> {
  const reservation = await this.repository.findById(id);
  if (!reservation) throw new NotFoundError('Reservation', id);
  if (reservation.status === 'COMPLETED') {
    throw new BusinessRuleError(
      'Cannot cancel a completed reservation',
      { reservationId: id, status: reservation.status }
    );
  }
  return this.repository.cancel(id);
}
```

---

## Logging Errors

Every error is logged with the following context:

```typescript
logger.error({
  err,                    // Error object (stack trace)
  requestId,              // Correlation ID
  userId,                 // Authenticated user (if any)
  action: 'cancelReservation',
  resourceType: 'reservation',
  resourceId: id,
  statusCode: 422,
}, 'Business rule violation');
```

---

## Client-Side Error Handling

| Error Type | User Experience |
|------------|-----------------|
| Validation (400) | Inline field errors on the form |
| Unauthenticated (401) | Redirect to login, toast "Session expired" |
| Forbidden (403) | Toast "You don't have permission to do this" |
| Not Found (404) | Show "Resource not found" page |
| Conflict (409) | Toast "This table is already booked for that time" |
| Business Rule (422) | Toast with specific message |
| Rate Limit (429) | Toast "Too many requests. Please wait." |
| Server Error (500) | Toast "Something went wrong. Please try again." + error ID |

---

## Related Documents

- [request-lifecycle.md](./request-lifecycle.md) — Error flow in request lifecycle
- [logging-strategy.md](./logging-strategy.md) — Error logging strategy
- [api-conventions.md](../.ai/api-conventions.md) — Error response format API standard
