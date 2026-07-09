# Restaurant Configuration Resolver

## Overview

The Configuration Resolver provides a unified, read-only view of all restaurant configuration data. Instead of querying five separate modules, clients fetch a single aggregated response.

## Aggregated Data Sources

| Source | Module | Nullable |
|--------|--------|----------|
| Restaurant info | `restaurant` | No |
| Settings | `restaurant-settings` | Yes (auto-created on read) |
| Reservation Policy | `reservation-policy` | Yes (auto-created on read) |
| Business Hours | `business-hours` | Yes (auto-created on read) |
| Calendar Exceptions | `calendar-exceptions` | No (empty array) |

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│              GET /:id/configuration                      │
├──────────────────────────────────────────────────────────┤
│  RestaurantConfigurationController                       │
├──────────────────────────────────────────────────────────┤
│  RestaurantConfigurationService (Application)            │
│    ├── Authorization check                               │
│    ├── Cache lookup (MemoryCacheProvider)                │
│    └── RestaurantConfigurationResolver (Domain)          │
│          ├── RestaurantRepository.findById()             │
│          ├── SettingsRepository.findByRestaurantId()     │
│          ├── PolicyRepository.findByRestaurantId()       │
│          ├── BusinessHoursRepository.findByRestaurantId()│
│          └── CalendarExceptionRepository.findByRestaurantId()
├──────────────────────────────────────────────────────────┤
│  RestaurantConfigurationMapper → DTO                     │
├──────────────────────────────────────────────────────────┤
│  Cache write (TTL: 5 minutes)                            │
└──────────────────────────────────────────────────────────┘
```

## Cache Strategy

- **Key pattern**: `restaurant:config:{restaurantId}`
- **TTL**: 5 minutes (300,000 ms)
- **Storage**: `MemoryCacheProvider` (in-process, no external dependency)
- **Refresh**: `POST /:id/configuration/refresh` bypasses cache
- **Invalidation**: Use `CacheInvalidationService.invalidateRestaurant(restaurantId)` when sub-module data changes

## Future Reservation Engine Integration

When the Reservation Engine is implemented, extend `ResolvedConfiguration` to include:

```typescript
export interface ResolvedConfiguration {
  // ... existing fields
  reservationEngine: ReservationEngineConfig | null;
}
```

Add the repository to `RestaurantConfigurationResolver.resolve()` and update the mapper.

## Error Handling

| Condition | HTTP Status | Error Code |
|-----------|-------------|------------|
| Restaurant not found | 404 | `restaurant.not_found` |
| Restaurant archived | 409 | `restaurant.inactive` |
| Restaurant soft-deleted | 404 | `restaurant.not_found` |
| Unauthorized | 401 | — |
| Forbidden | 403 | — |

## Authorization

Uses `restaurants.read` permission.

## API

- `GET /api/v1/restaurants/:restaurantId/configuration` — Fetch unified config
- `POST /api/v1/restaurants/:restaurantId/configuration/refresh` — Bypass cache, force refresh

## DTO Structure

```typescript
interface RestaurantConfigurationDTO {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    timezone: string;
    currency: string;
    language: string;
    isActive: boolean;
  };
  settings: Record<string, unknown> | null;
  reservationPolicy: Record<string, unknown> | null;
  businessHours: Record<string, unknown> | null;
  calendarExceptions: Record<string, unknown>[];
  metadata: {
    retrievedAt: string;   // ISO 8601
    version: string;       // hex timestamp of latest update
  };
}
```

## Version Computation

The `metadata.version` field is derived from the maximum `updatedAt` timestamp across all aggregated entities, encoded in base-36. This enables simple ETag-based caching on the client side.
