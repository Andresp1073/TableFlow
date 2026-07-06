# UI/UX Overview

**Last updated:** 2026-07-04

## Product Vision

TableFlow is a multi-restaurant reservation SaaS platform. The UI must feel **fast, reliable, and unobtrusive** — restaurant staff operate under time pressure and cannot afford confusing interfaces.

## Design Philosophy

- **Invisible UI** — The interface gets out of the way. Staff complete tasks in minimal steps.
- **Data-first** — Key information (time, party size, status) is always visible without clicking.
- **Error prevention** — Design prevents mistakes before they happen (double-booking, wrong dates).
- **Role-aware** — Every screen adapts to the user's role and permissions.

## Core Principles

| Principle | Application |
|-----------|-------------|
| **Mobile-first** | Core reservation tasks work on phones/tablets carried by staff |
| **Progressive disclosure** | Show essentials first; advanced options behind expand/collapse |
| **Consistency** | Single pattern for lists, forms, tables, modals across all modules |
| **Feedback** | Every action produces instant visual feedback (optimistic UI for fast operations) |
| **Accessibility** | WCAG 2.2 AA minimum, keyboard-navigable, screen-reader compatible |

## Target Users

| Role | Primary Device | Key Goal |
|------|---------------|----------|
| Customer | Mobile phone | Book a table in under 30 seconds |
| Receptionist | Tablet / Desktop | Manage walk-ins and phone reservations |
| Waiter | Tablet / Mobile | View assigned tables and check-in guests |
| Restaurant Manager | Desktop / Tablet | Monitor ops, view reports, manage staff |
| Restaurant Admin | Desktop | Full configuration, user management |
| System Admin | Desktop | Multi-tenant management, global settings |

## UX Goals

| Metric | Target |
|--------|--------|
| Reservation creation (staff) | < 15 seconds |
| Reservation creation (customer) | < 30 seconds |
| Table status glance | < 2 seconds |
| Search customer | < 3 seconds |
| Check-in guest | < 5 seconds |
| Learning curve (new staff) | < 10 minutes |

## Design Conventions

- **Left sidebar** navigation (collapsible)
- **Top bar** with search, notifications, user menu
- **Content area** with breadcrumb + page title + actions
- **Modals** for creates/edits (avoid full-page navigations)
- **Toast notifications** for success/error feedback
- **Skeletons** for loading states
- **Illustrations** for empty states

## Color System Intent

- **Blue** — Trust, primary actions, brand
- **Green** — Success, confirmed, seated
- **Red** — Errors, cancellations, no-shows
- **Amber** — Warnings, pending
- **Neutral** — Backgrounds, text, borders

## Cross-References

- [design-system.md](./design-system.md) — Color tokens, typography, spacing
- [user-journeys.md](./user-journeys.md) — Complete user flow diagrams
- [information-architecture.md](./information-architecture.md) — Navigation and page hierarchy
- [component-library.md](./component-library.md) — Reusable UI components
- [ui-tokens.md](./ui-tokens.md) — Design tokens reference
