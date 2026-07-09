# Restaurant Domain Rules

## Business Rules

1. **Name is required** — Every restaurant must have a non-empty name (1–255 chars).

2. **Slug is required and unique** — Every restaurant must have a unique slug (1–100 chars, lowercase + hyphens).

3. **Slug auto-generation** — If no slug is provided, it is auto-generated from the name:
   - Lowercase, replace spaces with hyphens, remove special chars.
   - If the generated slug is taken, a numeric suffix is appended (`-1`, `-2`, ...).
   - Max 100 attempts before failure.

4. **Manual slug customization** — Users may provide a custom slug; it must pass format validation and uniqueness check.

5. **Legal name is optional** — Not required for creation.

6. **Tax ID uniqueness** — If provided, the tax ID must be unique across all restaurants.

7. **Email uniqueness** — If provided, the email must be unique across all restaurants.

8. **Status transitions are governed by a state machine** — Invalid transitions are rejected at the domain level.

9. **Restaurants are never physically deleted** — Soft delete via `deletedAt` + `deletedBy`.

10. **Archived restaurants are immutable** — No status transitions or modifications allowed.

## State Machine

```
                    ┌──────────┐
                    │  DRAFT   │
                    └────┬─────┘
                    /          \
                   v            v
            ┌──────────┐   ┌──────────┐
            │ PENDING  │   │ ARCHIVED │ (terminal)
            └────┬─────┘   └──────────┘
                 |
         ┌───────┴───────┐
         v               v
   ┌──────────┐    ┌──────────┐
   │  ACTIVE  │◄───│ INACTIVE │
   └────┬─────┘    └──────────┘
        |               ^
        v               |
   ┌──────────┐         |
   │SUSPENDED │─────────┘
   └──────────┘
```

### Valid Transitions

| From | To | Description |
|---|---|---|
| `draft` | `pending` | Submit for review |
| `draft` | `archived` | Discard draft |
| `pending` | `active` | Approve and activate |
| `pending` | `draft` | Reject / send back to drafting |
| `active` | `suspended` | Temporary freeze (e.g., payment issue) |
| `active` | `inactive` | Voluntary deactivation |
| `suspended` | `active` | Reinstatement |
| `suspended` | `inactive` | Deactivate after suspension |
| `inactive` | `active` | Reactivation |
| `inactive` | `archived` | Permanent archival |
| `archived` | *(none)* | Terminal state |

### Invalid Transitions (examples)

- `draft → active` (must go through pending)
- `active → draft` (no regression)
- `pending → archived` (must reject to draft first)
- `archived → anything` (terminal state)

## Validation Strategy

Domain validation is implemented via:

1. **Value Object constructors** — Structural validation (format, length, pattern).
   - `RestaurantName.create(value)` validates length and emptiness.
   - `RestaurantSlug.create(value)` validates format and length.
   - `RestaurantEmail.create(value)` validates email format.
   - `RestaurantTaxId.create(value)` validates length.
   - `RestaurantPhone.create(value)` validates length and digit count.

2. **Domain rules / policies** — Business rules governing entity lifecycle.
   - `RestaurantStatusPolicy` — State machine enforcement.
   - `RestaurantActivationPolicy` — Prerequisites for activation flow.
   - `RestaurantArchivePolicy` — Guards for archival and soft deletion.

3. **Domain validation functions** — Reusable `validate*()` functions in `domain/validation/RestaurantRules.ts`.
   - Return `ValidationError | null` for each field.
   - Aggregate errors via `validateRestaurantForCreation()`.

4. **Uniqueness validators** — Async checks via repository interface.
   - `RestaurantUniquenessValidator` — Delegates to `UniquenessRepository`.

## Lifecycle

```
Creation (draft)
    │
    ├── submitForReview() → pending
    │       │
    │       ├── approve() → active
    │       └── reject() → draft
    │
    ├── archive() → archived (discard)
    │       │
    │       └── softDelete() → deletedAt set (permanently hidden)
    │
    active
    │   │
    │   ├── suspend(reason?) → suspended
    │   │       │
    │   │       ├── unsuspend() → active
    │   │       └── deactivate() → inactive
    │   │
    │   └── deactivate() → inactive
    │           │
    │           ├── activate() → active
    │           └── archive() → archived
    │
    archived (terminal — no further transitions)
```

## Soft Delete Strategy

- Restaurants are **never physically deleted** from the database.
- Soft deletion is a two-step process:
  1. Archive the restaurant (`status = archived`).
  2. Call `softDelete()` which sets `deletedAt` and `deletedBy`.
- Archived + soft-deleted restaurants are excluded from all active queries.
- The `deletedBy` field records the user who performed the deletion (future-ready; currently a string field).

## Domain Events (Prepared, Not Published)

| Event | Payload |
|---|---|
| `RestaurantCreated` | restaurantId, name, slug |
| `RestaurantActivated` | restaurantId, previousStatus |
| `RestaurantSuspended` | restaurantId, reason? |
| `RestaurantArchived` | restaurantId, previousStatus, deletedBy? |
| `RestaurantDeactivated` | restaurantId, previousStatus |

Events are defined as classes with `eventName`, `occurredAt`, and typed payload. Publishing will be implemented in a future phase.

## Domain Services

| Service | Responsibilities |
|---|---|
| `RestaurantStatusPolicy` | State transition validation, status guards |
| `RestaurantSlugService` | Generate slug from name, check uniqueness, find available slug |
| `RestaurantUniquenessValidator` | Assert uniqueness of slug, email, and tax ID |
| `RestaurantActivationPolicy` | Validate prerequisites for draft→pending→active flow |
| `RestaurantArchivePolicy` | Archive/soft-delete guards, prepare deletion metadata |

## Error Classes

| Error | Status | Code | When |
|---|---|---|---|
| `RestaurantNotFoundError` | 404 | `restaurant.not_found` | Restaurant not found by ID or slug |
| `RestaurantAlreadyExistsError` | 409 | `restaurant.already_exists` | Duplicate email or taxId |
| `RestaurantInactiveError` | 409 | `restaurant.inactive` | Operation requires active status |
| `RestaurantSlugAlreadyExistsError` | 409 | `restaurant.slug_already_exists` | Duplicate slug |
| `InvalidRestaurantStateError` | 422 | `restaurant.invalid_state` | Invalid state transition or state violation |
| `RestaurantArchivedError` | 409 | `restaurant.archived` | Operation on archived restaurant |
| `RestaurantDuplicateError` | 409 | `restaurant.duplicate` | Generic duplicate field |
