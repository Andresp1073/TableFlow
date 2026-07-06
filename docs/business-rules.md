# Business Rules

## Reservation Rules

| ID | Rule |
|----|------|
| BR-001 | A reservation cannot be created for a date in the past. |
| BR-002 | A reservation must be associated with exactly one customer. |
| BR-003 | A reservation must have at least one guest (party size > 0). |
| BR-004 | The party size must be between `min_capacity` and `max_capacity` of the assigned table. |
| BR-005 | A reservation cannot be created outside of the restaurant's operating hours. |
| BR-006 | A reservation cannot be created beyond the maximum advance booking window configured by the restaurant. |
| BR-007 | A reservation can be modified only if the change is made before the cancellation window closes. |
| BR-008 | A reservation can be canceled only if the cancellation is made at least N hours before the reservation time (configurable per restaurant). |
| BR-009 | A reservation with a no-show status cannot be modified. |
| BR-010 | A reservation with a completed status cannot be modified or canceled. |
| BR-011 | A table cannot be assigned to two reservations with overlapping time slots. |
| BR-012 | A walk-in reservation does not require a customer profile but one must be created at check-in. |
| BR-013 | Recurring reservations must have a start date and an end date or a maximum occurrence count. |
| BR-014 | A recurring reservation cannot exceed 12 months from the start date. |

## Customer Rules

| ID | Rule |
|----|------|
| BR-015 | A customer email must be unique across the system. |
| BR-016 | A customer phone number must be unique across the system. |
| BR-017 | A customer with 3 or more no-shows within 90 days must be flagged as high-risk. |
| BR-018 | A flagged customer must require staff confirmation before future reservations are accepted. |
| BR-019 | Customer profiles cannot be permanently deleted — they must be soft-deleted to preserve reservation history. |

## Table Rules

| ID | Rule |
|----|------|
| BR-020 | A table number must be unique within a restaurant branch. |
| BR-021 | A table cannot be deleted if it has active reservations or is currently occupied. |
| BR-022 | A table marked as "out of service" cannot be assigned to new reservations. |
| BR-023 | Combined tables must be released back to individual status after the reservation ends. |
| BR-024 | The cleaning time between reservations is configurable per restaurant (default: 15 minutes). |

## Staff Rules

| ID | Rule |
|----|------|
| BR-025 | A user can belong to exactly one restaurant branch. |
| BR-026 | A System Administrator can view data across all branches but cannot create reservations. |
| BR-027 | A Waiter can only view reservations assigned to their section or tables. |
| BR-028 | A Receptionist cannot modify restaurant settings or manage staff accounts. |
| BR-029 | A Restaurant Administrator cannot delete their own account. |
| BR-030 | At least one Restaurant Administrator must be assigned per branch. |

## Booking Rules

| ID | Rule |
|----|------|
| BR-031 | The maximum party size per reservation is configurable (default: 20 guests). |
| BR-032 | A reservation slot interval determines the available booking times (e.g., 30-minute slots). |
| BR-033 | The system must enforce a minimum time between consecutive reservations on the same table (cleaning buffer). |
| BR-034 | Overlapping reservations on the same table are strictly prohibited. |
| BR-035 | The maximum number of reservations per time slot is limited by available table capacity. |

## Notification Rules

| ID | Rule |
|----|------|
| BR-036 | Confirmation emails must be sent within 5 minutes of reservation creation. |
| BR-037 | Reminder emails must be sent exactly 24 hours before the reservation time. |
| BR-038 | Cancellation emails must be sent immediately upon cancellation. |
| BR-039 | Email notifications must include the restaurant name, date, time, party size, and confirmation code. |

## Business Hours Rules

| ID | Rule |
|----|------|
| BR-040 | A restaurant must have at least one operating hour entry per week. |
| BR-041 | Holiday hours override the standard operating hours for the specified date. |
| BR-042 | Reservations cannot be created for times outside the configured operating hours. |
| BR-043 | The last reservation time must be at least 30 minutes before closing time. |

## Reporting Rules

| ID | Rule |
|----|------|
| BR-044 | Occupancy rate is calculated as (total seated covers / total available covers) x 100. |
| BR-045 | No-show rate is calculated as (no-shows / total reservations) x 100 for a given period. |
| BR-046 | Average turn time is calculated from check-in to check-out across all completed reservations. |
| BR-047 | Reports can only be generated for dates up to the current date (no future reporting). |

## Audit Rules

| ID | Rule |
|----|------|
| BR-048 | Audit logs are immutable — existing log entries cannot be modified or deleted. |
| BR-049 | Audit logs must include the actor, action, resource type, resource ID, timestamp, and previous values (for updates). |
| BR-050 | Failed login attempts must be logged with IP address and timestamp. |
