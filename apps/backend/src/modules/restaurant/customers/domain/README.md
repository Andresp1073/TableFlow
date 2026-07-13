# Customer Domain (Phase 12.2)

## Overview
The Customer domain models restaurant patrons in TableFlow. A `Customer` is an aggregate root that stores essential contact information, preferences, and lifecycle status. Customers link to reservations and enable personalized service, marketing, and CRM workflows.

## Value Objects

| VO | Fields | Validation |
|----|--------|------------|
| `CustomerName` | `firstName: string, lastName: string` | 1-100 chars each, trimmed |
| `CustomerEmail` | `value: string` | Valid email format, max 254 chars, normalized to lowercase |
| `CustomerPhone` | `value: string` | 7-15 digits, optional `+` prefix, formatting stripped |
| `CustomerStatus` | `value: "active" \| "inactive" \| "blocked" \| "archived"` | FSM transition matrix |
| `PreferredLanguage` | `value: ISO 639-1 code` | One of 12 supported languages |

## Aggregate: `Customer`

```
Customer {
  id: string
  restaurantId: string
  name: CustomerName
  email: CustomerEmail | null
  phone: CustomerPhone | null
  birthDate: Date | null
  preferredLanguage: PreferredLanguage
  notes: string | null
  marketingConsent: boolean
  status: CustomerStatus
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
}
```

Key design decisions:
- `email` and `phone` are nullable — at least one is required (validated by policy)
- `birthDate` is optional — not all customers share birth dates
- `preferredLanguage` defaults to English for communication preferences
- `marketingConsent` tracks GDPR/opt-in compliance
- `archivedAt` records when the customer was archived (null otherwise)

## Customer Status Lifecycle

```
                  ┌──────────┐
         ┌──────→│  Active  │←──────┐
         │       └────┬─────┘       │
         │            │             │
         │     ┌──────┴──────┐      │
         │     │  Inactive   │      │
         │     └──────┬──────┘      │
         │            │             │
         │     ┌──────┴──────┐      │
         └─────│  Blocked    │──────┘
               └──────┬──────┘
                      │
               ┌──────┴──────┐
               │  Archived   │ (terminal)
               └─────────────┘
```

- `archived` is the only terminal state
- Both `inactive` and `blocked` can return to `active`
- Only `active` customers can make new reservations

## Domain Services

### `CustomerValidationPolicy`
- `validateContactMethod(contact)` — ensures at least one of email or phone is present
- `validateForCreation(contact)` — returns `{ isValid, errors[] }` for creation validation

### `CustomerDuplicatePolicy`
- `checkEmail(email, restaurantId)` — throws `DuplicateCustomerError` if email exists
- `checkPhone(phone, restaurantId)` — throws `DuplicateCustomerError` if phone exists
- `checkForCreation(email, phone, restaurantId)` — returns `{ hasDuplicates, duplicateFields[] }`

Both uniqueness checks are scoped per restaurant (same email can exist in different restaurants).

## Domain Errors (typed)

| Error | Code | When thrown |
|-------|------|-------------|
| `InvalidCustomerEmailError` | `customer.invalid_email` | Malformed or invalid email |
| `InvalidCustomerPhoneError` | `customer.invalid_phone` | Malformed or invalid phone |
| `DuplicateCustomerError` | `customer.duplicate` | Email or phone already exists in restaurant |
| `CustomerNotFoundError` | `customer.not_found` | Customer not found |
| `CustomerValidationError` | `customer.validation_failed` | General validation failure |

## Domain Events (prepared, not published)
- `CustomerCreated` — id, restaurantId, firstName, lastName, email, phone
- `CustomerUpdated` — id, restaurantId
- `CustomerArchived` — id, restaurantId
- `CustomerBlocked` — id, restaurantId

## Future Reservation Integration

The Customer aggregate integrates with the Reservation domain through `customerId`:

1. **Reservation creation**: `customerId` links a reservation to a customer profile
2. **Customer lookup**: Search by email or phone during walk-in reservation
3. **History**: View reservation history per customer
4. **Preferences**: Preferred language and notes inform service staff
5. **Blocked customers**: `canMakeReservations()` prevents bookings for blocked/archived customers
