# Settings Module

## Overview

The Settings module centralizes restaurant configuration and user preferences. It replaces the previous placeholder page with a fully functional, tabbed settings dashboard.

## Pages

### `/settings` — Settings Dashboard

A single page with a vertical sidebar navigation and dynamic content area. Sections:

| Section | Description | API |
|---------|-------------|-----|
| **Dashboard** | Read-only overview of all settings values | `GET /settings` |
| **Restaurant Info** | Display-only restaurant name, slug, ID | Restaurant provider |
| **Business Hours** | Per-day schedule editor with open/close times and multiple periods | `GET/PUT /business-hours` |
| **Regional** | Timezone, currency, language, date/time format, week start day | `GET/PUT /settings` |
| **Tax** | Tax rate % and service charge % | `GET/PUT /settings` |
| **Notifications** | 5 toggle switches (email, reservation, kitchen, inventory, system) — stored in localStorage | None |
| **Appearance** | Light/Dark/System theme toggle, interface density, default landing page | Theme provider + localStorage |
| **Security** | Password change link, 2FA (coming soon badge), active sessions display | Admin settings link |
| **About** | App version, build, environment, license, resource links | Static |

## API Integration

### Restaurant Settings

- `GET /api/v1/restaurants/:id/settings` — Returns `RestaurantSettingsDTO` with all config fields
- `PUT /api/v1/restaurants/:id/settings` — Partial update of settings fields

### Business Hours

- `GET /api/v1/restaurants/:id/business-hours` — Returns `BusinessHoursDTO` with 7 day schedules
- `PUT /api/v1/restaurants/:id/business-hours` — Update all day schedules

## Key Files

| File | Purpose |
|------|---------|
| `lib/settings-types.ts` | Types (`RestaurantSettings`, `BusinessHours`, etc.), options arrays (timezones, currencies, languages, formats), day name map, `formatCurrencyWithSymbol` |
| `lib/settings-schemas.ts` | Zod schemas (`updateSettingsSchema`, `updateBusinessHoursSchema` with per-day period validation) |
| `services/settings.ts` | 4 API functions: `getSettings`, `updateSettings`, `getBusinessHours`, `updateBusinessHours` |
| `hooks/use-settings.ts` | 4 React Query hooks: `useSettings`, `useBusinessHours`, `useUpdateSettings`, `useUpdateBusinessHours` |
| `components/settings/settings-sidebar.tsx` | Vertical nav with 9 section items, active state tracking, `aria-current` for accessibility |
| `components/settings/settings-dashboard.tsx` | Read-only overview grid with 15 setting values + no-restaurant/loading/error states |
| `components/settings/settings-restaurant.tsx` | Restaurant info display with link to restaurant management page |
| `components/settings/settings-business-hours.tsx` | Per-day row editor: toggle (open/closed), 1+ periods with time inputs, add/remove period, save button |
| `components/settings/settings-regional.tsx` | 6 select fields with React Hook Form + Zod validation, save button with dirty tracking |
| `components/settings/settings-tax.tsx` | 2 number inputs (tax %, service charge %) with React Hook Form |
| `components/settings/settings-business.tsx` | 6 inputs (duration, buffer, walk-ins, auto-confirm, max reservations, cancellation) |
| `components/settings/settings-notifications.tsx` | 5 localStorage-persisted toggle switches |
| `components/settings/settings-appearance.tsx` | Theme buttons (light/dark/system), density select, landing page select |
| `components/settings/settings-security.tsx` | Password, 2FA (coming soon), active sessions cards |
| `components/settings/settings-about.tsx` | Version, build, environment, license, resource links |
| `components/settings/settings-skeleton.tsx` | Loading skeleton with 6 skeleton rows |

## State & Loading

Each data-fetching section handles:
- **Loading**: `SettingsSkeleton` component with 6 skeleton field rows
- **Error**: Alert with error message
- **No restaurant**: Warning alert with "Select a restaurant" message
- **Empty**: Default values populated from API (settings auto-create, business hours return defaults)

## Forms

- Regional, Tax, and Business sections use React Hook Form with Zod validation
- "Save Changes" button is disabled when form is not dirty or mutation is pending
- Business Hours editor uses local state with manual dirty tracking via JSON comparison
- Toast notification on save success/failure (sonner)

## Tests

24 tests across 2 test files:
- `page.test.tsx` — 13 tests: default dashboard, sidebar navigation, navigation between all 9 sections, dashboard data rendering, no-restaurant state, active section highlighting
- `components.test.tsx` — 11 tests: each section component renders with expected content

## Local-Only Features

These sections have no backend API and use localStorage:
- Notifications preferences
- Appearance/theme preferences
- Density and landing page

## Backend API Reference

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/api/v1/restaurants/:id/settings` | `restaurants.settings.read` |
| PUT | `/api/v1/restaurants/:id/settings` | `restaurants.settings.update` |
| GET | `/api/v1/restaurants/:id/business-hours` | `restaurants.business-hours.read` |
| PUT | `/api/v1/restaurants/:id/business-hours` | `restaurants.business-hours.update` |
