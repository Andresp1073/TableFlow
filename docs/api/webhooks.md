# Webhooks

**Last updated:** 2026-07-04

## Purpose

Webhooks allow external systems to receive real-time notifications when events occur in TableFlow.

## Webhook Events

| Event | Description | Trigger |
|-------|-------------|---------|
| `reservation.created` | A new reservation is created | POST /api/v1/reservations |
| `reservation.updated` | Reservation details modified | PATCH /api/v1/reservations/{id} |
| `reservation.cancelled` | Reservation is cancelled | POST /api/v1/reservations/{id}/cancel |
| `reservation.confirmed` | Reservation status → CONFIRMED | POST /api/v1/reservations/{id}/confirm |
| `reservation.seated` | Guest is seated | POST /api/v1/reservations/{id}/check-in |
| `reservation.completed` | Guest checks out | POST /api/v1/reservations/{id}/check-out |
| `reservation.noshow` | Guest marked as no-show | POST /api/v1/reservations/{id}/mark-noshow |
| `customer.created` | New customer profile created | POST /api/v1/customers |
| `customer.updated` | Customer details modified | PATCH /api/v1/customers/{id} |
| `branch.updated` | Branch details or hours changed | PATCH /api/v1/branches/{id} |
| `table.status_changed` | Table availability status changes | Internal (via reservation changes) |

## Webhook Delivery

| Attribute | Detail |
|-----------|--------|
| **Protocol** | HTTPS only |
| **Method** | POST |
| **Content-Type** | `application/json` |
| **Timeout** | 10 seconds |
| **Retries** | 3 times with exponential backoff (10s, 60s, 300s) |
| **Signature** | HMAC-SHA256 of body using webhook secret |

## Webhook Payload

```json
{
  "event": "reservation.created",
  "id": "evt-uuid-v4",
  "createdAt": "2026-07-04T19:00:00.000Z",
  "data": {
    "id": "reservation-uuid",
    "branchId": "branch-uuid",
    "customerId": "customer-uuid",
    "date": "2026-07-15",
    "time": "19:00:00",
    "partySize": 4,
    "status": "CONFIRMED",
    "confirmationCode": "TF-ABC123"
  }
}
```

## Webhook Signature

```
X-Webhook-Signature: sha256=<hex-encoded-hmac>
```

The signature is HMAC-SHA256 of the raw request body using the webhook's signing secret.

**Verification (pseudocode):**

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

function verifyWebhook(body: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  const received = signature.replace('sha256=', '');
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
```

## Webhook Configuration

Managed via `GET/POST/PUT/DELETE /api/v1/webhooks` (requires `settings.update` permission).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✅ | HTTPS endpoint to receive webhooks |
| `events` | string[] | ✅ | Array of event types to subscribe to |
| `isActive` | boolean | ❌ | Enable/disable (default: true) |
| `secret` | string | ❌ | Auto-generated if not provided |

## Webhook Management Endpoints

| Method | URL | Purpose |
|--------|-----|---------|
| `GET` | `/api/v1/webhooks` | List all webhooks |
| `POST` | `/api/v1/webhooks` | Create webhook subscription |
| `GET` | `/api/v1/webhooks/{id}` | Get webhook details |
| `PUT` | `/api/v1/webhooks/{id}` | Update webhook configuration |
| `DELETE` | `/api/v1/webhooks/{id}` | Delete webhook subscription |
| `GET` | `/api/v1/webhooks/{id}/deliveries` | List recent delivery attempts |
| `POST` | `/api/v1/webhooks/{id}/test` | Send test event |

## Failed Delivery Handling

| Attempt | Delay | Action |
|---------|-------|--------|
| 1 | 10s | Retry |
| 2 | 60s | Retry |
| 3 | 300s | Retry |
| All failed | — | Mark webhook as `degraded`, send alert to admin |

If a webhook returns a non-2xx status or times out within 10 seconds, the delivery is retried. After 3 consecutive failures, the webhook is marked `degraded` and an admin notification is sent.

## Cross-References

- [endpoint-catalog.md](./endpoint-catalog.md) — Webhook CRUD endpoints
- [future-api.md](./future-api.md) — Future webhook enhancements
