# Database-API Alignment

**Last updated:** 2026-07-04

## Field Mapping Verification

### Customers

| DB Column | API Field | Status | Notes |
|-----------|-----------|--------|-------|
| `id` | `id` | ✅ | UUID v7 |
| `email` | `email` | ✅ | |
| `phone` | `phone` | ✅ | |
| `first_name` | `firstName` | ✅ | camelCase |
| `last_name` | `lastName` | ✅ | camelCase |
| `total_visits` | `totalVisits` | ✅ | |
| `total_cancellations` | `totalCancellations` | ✅ | |
| `total_noshows` | `totalNoshows` | ✅ | |
| `is_flagged` | `isFlagged` | ✅ | |
| `notes` | `notes` | ✅ | |
| `preferences` | `preferences` | ✅ | JSON→object |
| `created_at` | `createdAt` | ✅ | |
| `updated_at` | `updatedAt` | ✅ | |
| `updated_by` | `updatedBy` | ❌ **MISSING** | Not in API response |
| `deleted_at` | `deletedAt` | ⚠️ | Only on soft-delete queries |

### Reservations

| DB Column | API Field | Status | Notes |
|-----------|-----------|--------|-------|
| `id` | `id` | ✅ | |
| `branch_id` | `branchId` | ✅ | |
| `customer_id` | `customerId` | ✅ | |
| `created_by` | `createdBy` | ✅ | |
| `assigned_to` | `assignedTo` | ✅ | nullable |
| `confirmation_code` | `confirmationCode` | ✅ | |
| `date` | `date` | ✅ | |
| `time` | `time` | ✅ | |
| `party_size` | `partySize` | ✅ | |
| `status` | `status` | ✅ | |
| `cancellation_reason` | `cancellationReason` | ✅ | nullable |
| `special_requests` | `specialRequests` | ✅ | nullable |
| `internal_notes` | `internalNotes` | ✅ | nullable |
| `is_walk_in` | `isWalkIn` | ✅ | |
| `source` | `source` | ✅ | |
| `checked_in_at` | `checkedInAt` | ✅ | nullable |
| `checked_out_at` | `checkedOutAt` | ✅ | nullable |
| `cancelled_at` | `cancelledAt` | ✅ | nullable |
| `no_show_marked_at` | `noShowMarkedAt` | ❌ **MISSING** | Not in API response |
| `created_at` | `createdAt` | ✅ | |
| `updated_at` | `updatedAt` | ✅ | |
| `updated_by` | `updatedBy` | ❌ **MISSING** | Not in API response |

### Branches

| DB Column | API Field | Status | Notes |
|-----------|-----------|--------|-------|
| `id` | `id` | ✅ | |
| `organization_id` | `organizationId` | ✅ | |
| `name` | `name` | ✅ | |
| `address` | `address` | ✅ | |
| `phone` | `phone` | ✅ | nullable |
| `email` | `email` | ✅ | nullable |
| `timezone` | `timezone` | ✅ | |
| `cuisine_type` | `cuisineType` | ✅ | nullable |
| `average_dining_duration` | `averageDiningDuration` | ✅ | |
| `max_advance_booking_days` | `maxAdvanceBookingDays` | ✅ | |
| `slot_interval` | `slotInterval` | ✅ | |
| `max_party_size` | `maxPartySize` | ✅ | |
| `is_online_reservation_enabled` | `isOnlineReservationEnabled` | ✅ | |
| `created_at` | `createdAt` | ✅ | |
| `updated_at` | `updatedAt` | ✅ | |
| `updated_by` | `updatedBy` | ❌ **MISSING** | Not in API response |
| `deleted_at` | `deletedAt` | ⚠️ | Only on soft-delete queries |

### Tables

| DB Column | API Field | Status | Notes |
|-----------|-----------|--------|-------|
| `id` | `id` | ✅ | |
| `branch_id` | `branchId` | ✅ | |
| `zone_id` | `zoneId` | ✅ | nullable |
| `table_number` | `tableNumber` | ✅ | |
| `min_capacity` | `minCapacity` | ✅ | Renamed from `capacity` |
| `max_capacity` | `maxCapacity` | ✅ | |
| `is_active` | `isActive` | ✅ | |
| `position_x` | `positionX` | ✅ | |
| `position_y` | `positionY` | ✅ | |
| `shape` | `shape` | ✅ | |
| `width` | `width` | ✅ | |
| `height` | `height` | ✅ | |
| `created_at` | `createdAt` | ✅ | |
| `updated_at` | `updatedAt` | ✅ | |
| `updated_by` | `updatedBy` | ❌ **MISSING** | Not in API response |
| `deleted_at` | `deletedAt` | ⚠️ | Only on soft-delete queries |

### Users

| DB Column | API Field | Status | Notes |
|-----------|-----------|--------|-------|
| `id` | `id` | ✅ | |
| `email` | `email` | ✅ | |
| `password_hash` | — | ✅ | Never exposed in API |
| `first_name` | `firstName` | ✅ | |
| `last_name` | `lastName` | ✅ | |
| `phone` | `phone` | ✅ | |
| `is_active` | `isActive` | ✅ | |
| `is_verified` | `isVerified` | ✅ | |
| `failed_login_attempts` | — | ✅ | Internal only |
| `locked_until` | — | ✅ | Internal only |
| `last_login_at` | `lastLoginAt` | ✅ | nullable |
| `created_at` | `createdAt` | ✅ | |
| `updated_at` | `updatedAt` | ✅ | |

### Issue Summary

| Table | Missing from API | Severity |
|-------|-----------------|----------|
| customers | `updatedBy` | 🟡 Medium |
| reservations | `updatedBy`, `noShowMarkedAt` | 🟡 Medium |
| branches | `updatedBy` | 🟡 Medium |
| tables | `updatedBy` | 🟡 Medium |

**Recommendation:** Add `updatedBy` and `noShowMarkedAt` to all relevant API response schemas. These fields were added as must-fix items from the database review but were not propagated to the API layer.

## Cross-References

- [dto-consistency.md](./dto-consistency.md) — Full DTO field analysis
- [table-design.md](../../database/table-design.md) — DB column definitions
- [endpoint-catalog.md](../endpoint-catalog.md) — API response definitions
