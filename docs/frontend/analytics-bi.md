# Business Intelligence & Reports Module

## Overview
Complete BI module for the TableFlow hospitality SaaS platform. Provides executive dashboard, sales, reservations, occupancy, inventory, kitchen, customer, financial, audit reports, and an export center.

## Files

### Types & Utilities
- `lib/analytics-types.ts` — All BI data types, date range presets, formatting utilities, report metadata.

### Services
- `services/analytics.ts` — Data aggregation service fetching from all existing backend APIs (dashboard, orders, customers, inventory, reservations, tables, audit, loyalty, kitchen).

### Hooks
- `hooks/use-analytics.ts` — TanStack Query hooks for each report type with automatic cache invalidation.

### Shared Components (`components/analytics/`)
| Component | Purpose |
|-----------|---------|
| `report-chart.tsx` | Recharts wrapper (line, bar, area, pie) with loading/empty states |
| `report-filters.tsx` | Date range preset selector |
| `report-layout.tsx` | Standard report page layout with filters, loading, error states |
| `export-button.tsx` | CSV, JSON, and Print/PDF export dropdown |

### Report Components
| Component | Data Sources |
|-----------|-------------|
| `executive-dashboard.tsx` | Dashboard, orders, customers, inventory |
| `sales-report-content.tsx` | Orders, revenue |
| `reservation-report-content.tsx` | Reservations |
| `occupancy-report-content.tsx` | Tables, dining areas |
| `inventory-report-content.tsx` | Products, stock movements, alerts, purchase orders |
| `kitchen-performance-content.tsx` | Dashboard/kitchen |
| `customer-analytics-content.tsx` | Customers, loyalty |
| `financial-report-content.tsx` | Orders, revenue |
| `audit-report-content.tsx` | Audit events |
| `export-center-content.tsx` | All data sources with export controls |

### Pages (`app/(protected)/analytics/`)
| Route | Component |
|-------|-----------|
| `/analytics` | Executive Dashboard (default) |
| `/analytics/sales` | Sales Report |
| `/analytics/reservations` | Reservation Report |
| `/analytics/occupancy` | Occupancy Report |
| `/analytics/inventory` | Inventory Report |
| `/analytics/kitchen` | Kitchen Performance |
| `/analytics/customers` | Customer Analytics |
| `/analytics/financial` | Financial Report |
| `/analytics/audit` | Audit Report |
| `/analytics/export` | Export Center |

### Navigation
- `components/navigation/nav-config.tsx` — Analytics section with all 10 sub-items under Finance > Analytics.

### Tests (`components/analytics/__tests__/`)
8 test files, 44 tests covering types, shared components, and 3 report components.

## Architecture
- **No new backend routes** — all data is aggregated from existing APIs via `services/analytics.ts`.
- **Date range filtering** — all reports support `today`, `yesterday`, `thisWeek`, `lastWeek`, `thisMonth`, `lastMonth`, `thisQuarter`, `lastQuarter`, `thisYear`, `lastYear` presets.
- **Charts** — Recharts (line, bar, area, pie) with consistent loading/empty states.
- **Export** — CSV, JSON, and Print/PDF via `ExportButton` component.
- **Pattern** — follows existing feature-based architecture, Composition Pattern, TanStack Query, shadcn/ui.
