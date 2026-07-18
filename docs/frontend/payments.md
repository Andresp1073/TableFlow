# Payments Module

## Overview

The Payments module displays and manages payment transactions created via the POS checkout flow (`POST /checkout/:orderId/pay`). It provides a dashboard with revenue stats, a transaction list with search/filter, and a detail view with refund capability.

## Pages

### `/payments` — Dashboard & Transaction List

- **Dashboard cards**: Today's Revenue (total + count), Pending transactions, Completed transactions, Issues (failed + refunded)
- **Revenue by method**: Bar chart showing revenue breakdown by payment method
- **Transaction History**: TanStack Table with columns for ID, amount, status, method, provider, date
- **Filters**: Search (by ID or provider reference), status dropdown, method dropdown
- **Pagination**: Server-side pagination via API

### `/payments/[transactionId]` — Payment Detail

- **Payment Information card**: Status badge, amount, method, provider, dates
- **Transaction Details card**: Authorized/captured amounts, refund summary, provider reference, authorization code
- **Timeline card**: Created, authorized, captured timestamps
- **Refund action**: Button opens refund dialog with amount input (partial refund supported)

## API Routes

All routes mounted at `/api/v1/restaurants/:restaurantId/payments`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Revenue stats for today |
| GET | `/transactions` | Paginated transaction list (search, status, method filters) |
| GET | `/transactions/:transactionId` | Single transaction detail |
| GET | `/providers` | Available payment providers |
| POST | `/transactions/:transactionId/refund` | Issue a refund |

## Key Files

| File | Purpose |
|------|---------|
| `lib/payment-types.ts` | Types (`PaymentTransaction`, `PaymentDashboard`, etc.), status/method constants, `formatCurrency` |
| `lib/payment-schemas.ts` | Zod schema for refund form validation |
| `services/payments.ts` | 5 API service functions |
| `hooks/use-payments.ts` | 5 React Query hooks (`usePaymentDashboard`, `usePayments`, `usePayment`, `usePaymentProviders`, `useRefundPayment`) |
| `components/payments/payment-status-badge.tsx` | Color-coded status badge |
| `components/payments/payment-method-badge.tsx` | Method label badge |
| `components/payments/payment-detail-view.tsx` | Detail page cards (info, transaction details, timeline) |
| `components/payments/payment-detail-skeleton.tsx` | Loading skeleton for detail page |
| `components/payments/payment-actions.tsx` | Refund dialog + refresh button |

## State & Loading

- Dashboard and list fetched independently (parallel queries)
- Each state handled: loading (skeleton/shimmer), error (alert), empty (help text with suggestion)
- No restaurant selected → friendly message prompting selection
- Refund mutation shows toast on success/error, invalidates all payment queries on success

## Architecture Decisions

- Dashboard and list use separate API endpoints for independent loading
- Refund dialog allows partial refund with amount input and reason field
- No payment creation UI — payments originate from checkout flow
- Backend uses `InMemoryPaymentTransactionRepository` (dev/demo only)
