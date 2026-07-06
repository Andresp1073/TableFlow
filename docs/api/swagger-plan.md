# Swagger / OpenAPI Documentation Plan

**Last updated:** 2026-07-04

## Tool

TableFlow uses **Swagger UI** served from the Express application, with OpenAPI 3.1 specification generated from **Zod schemas** using `zod-to-openapi` or similar tooling.

## Folder Organization

```
src/
  api/
    openapi/
      openapi.yaml              # Root specification (manual or generated)
      components/
        schemas/                # Reusable data models
          common.yaml           # UUID, Date, DateTime, Time, Email
          pagination.yaml       # Meta, PaginationParams
          errors.yaml           # ErrorResponse, ValidationError
          auth.yaml             # LoginRequest, TokenResponse
          reservation.yaml      # Reservation, CreateReservationRequest
          customer.yaml         # Customer, CreateCustomerRequest
          ...
        parameters/             # Reusable parameters
          common.yaml           # page, pageSize, sortBy, sortDirection
          filters.yaml          # Common filter parameters
        headers/                # Reusable headers
          rate-limit.yaml       # Rate limit headers
          idempotency.yaml      # Idempotency-Key
      paths/                    # One file per resource module
        auth.yaml
        reservations.yaml
        customers.yaml
        branches.yaml
        tables.yaml
        users.yaml
        roles.yaml
        ...
```

## Documentation Strategy

| Element | Source of Truth | How to Document |
|---------|----------------|-----------------|
| **Schemas** | Zod validation schemas | Generate OpenAPI components from Zod using `zod-to-openapi` |
| **Endpoints** | Express route definitions | Annotate with JSDoc or decorators |
| **Parameters** | Route definitions | Document manually or extract from route config |
| **Examples** | This API design doc | Include in OpenAPI `example` fields |
| **Error codes** | `error-catalog.md` | Reference in `responses` section |

## Generator Approach (Recommended)

```typescript
// Pseudocode — Zod-to-OpenAPI approach
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

const registry = new OpenAPIRegistry();

// Register schema
registry.register('Reservation', ReservationSchema);

// Register path
registry.registerPath({
  method: 'post',
  path: '/api/v1/reservations',
  summary: 'Create a new reservation',
  tags: ['Reservations'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateReservationSchema } }
    }
  },
  responses: {
    201: {
      description: 'Reservation created',
      content: { 'application/json': { schema: ReservationResponseSchema } }
    }
  }
});

const generator = new OpenApiGeneratorV3(registry.definitions);
return generator.generateComponents();
```

## Manual OpenAPI Alternative

If Zod-to-OpenAPI is not adopted, maintain a `openapi.yaml` manually with:

```yaml
openapi: "3.1.0"
info:
  title: TableFlow API
  version: "1.0.0"
  description: Enterprise restaurant reservation management API
servers:
  - url: https://api.tableflow.com/api/v1
    description: Production
tags:
  - name: Reservations
    description: Reservation management
  - name: Customers
    description: Customer profiles
  - name: Auth
    description: Authentication
paths:
  /reservations:
    $ref: './paths/reservations.yaml'
components:
  schemas:
    Reservation:
      $ref: './components/schemas/reservation.yaml'
```

## Swagger UI Integration

| Attribute | Development | Production |
|-----------|-------------|------------|
| **URL** | `http://localhost:4000/api-docs` | `https://api.tableflow.com/api-docs` |
| **Authentication** | None (local) | Bearer token |
| **Exposed in production** | ❌ No | ❌ No (internal tools only) |

## Documentation Checklist

| Item | Status |
|------|--------|
| All request/response schemas defined | ❌ (this document) |
| All path parameters documented | ❌ |
| All query parameters documented | ❌ |
| Error responses per endpoint | ❌ |
| Authentication flow documented | ❌ |
| Examples for all endpoints | ❌ |
| Rate limit headers documented | ❌ |

**Implementation trigger:** Generate OpenAPI spec as part of the initial Express setup, before any endpoint implementation.

## Cross-References

- [api-standards.md](./api-standards.md) — URL structure and HTTP methods
- [request-response-standards.md](./request-response-standards.md) — Response schemas
- [error-catalog.md](./error-catalog.md) — Error response schemas
- [endpoint-catalog.md](./endpoint-catalog.md) — Complete endpoint inventory
