# Empty, Loading & Error States

**Last updated:** 2026-07-04

---

## 1. Empty States

### When to Show

- No data exists yet (new organization)
- Filters returned zero results
- Search returned no matches
- Module not yet configured

### Empty State Anatomy

```
┌──────────────────────────────────────────┐
│                                          │
│           [Illustration / Icon]           │
│                                          │
│        [Title: What's missing]           │
│                                          │
│   [Description: What to do about it]     │
│                                          │
│   [Primary CTA]    [Secondary action]    │
│                                          │
└──────────────────────────────────────────┘
```

### Empty State Library

| Screen | Illustration | Title | Description | CTA |
|--------|-------------|-------|-------------|-----|
| Dashboard | Calendar with checkmark | Welcome to TableFlow! | Start by creating your first reservation. | + Create Reservation |
| Reservations (today) | Empty clipboard | No reservations today | Today looks quiet. Use this time to set up your restaurant. | + Create Reservation |
| Reservations (filtered) | Magnifying glass with X | No results found | Try adjusting your filters or search terms. | Clear Filters |
| Customers | Empty address book | No customers yet | Customers will appear here once they make reservations. | + Add Customer |
| Tables | Empty floor plan | No tables configured | Set up your restaurant's table layout to get started. | + Add Table |
| Branches | Empty storefront | No branches added | Add your first restaurant branch. | + Add Branch |
| Staff | Empty team | No staff members | Invite your team members to join TableFlow. | + Invite Staff |
| Reports | Empty chart | No data available | Reports will populate after you start taking reservations. | View Dashboard |
| Notifications | Empty bell | All caught up! | You'll see notifications here when something happens. | — |
| Audit Logs | Empty document | No audit entries | Audit logs will appear as actions are taken. | — |
| Search | Empty search results | No results for "xyz" | Try different keywords or check spelling. | Clear Search |
| Notifications (filtered) | Filter icon | No matching notifications | No notifications match your current filter. | Clear Filters |

---

## 2. Loading States

### When to Show

- Initial page load (show skeleton)
- Data refresh (show spinner or skeleton)
- Async action in progress (show button spinner)
- Page transition (show minimal loader if > 300ms)

### Skeleton Patterns

| Component | Skeleton Style |
|-----------|----------------|
| Page | Full-page shimmer: header bar + KPI cards (gray rectangles) + table rows |
| Table | 5 horizontal gray bars (varies in width), animated shimmer |
| Card | Gray rectangle with rounded corners, inner text lines |
| Chart | Gray outline of chart shape with pulse animation |
| Detail page | Left column (avatar + 3 text lines), right column (5 text lines) |
| List item | Avatar circle + 2 text lines |

### Skeleton Design

```
┌──────────────────────────────────────────┐
│ ┌──────────────────────────────────────┐ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ │  ← Header skeleton
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
│ │ ▓▓▓▓ │  │ ▓▓▓▓ │  │ ▓▓▓▓ │  │ ▓▓▓▓ │  │  ← KPI skeletons
│ │ ▓▓▓▓ │  │ ▓▓▓▓ │  │ ▓▓▓▓ │  │ ▓▓▓▓ │  │
│ └──────┘  └──────┘  └──────┘  └──────┘  │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │ │  ← Table row skeletons
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓              │ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      │ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓                            │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Shimmer Animation

- Linear gradient sweep from left to right (1.5s cycle)
- Base color: neutral-200 (light) / neutral-700 (dark)
- Highlight color: white (light) / neutral-600 (dark)

### Loading Indicators

| Context | Indicator |
|---------|-----------|
| Page load | Skeleton (preferred) or spinner |
| Async action | Button spinner + disabled state |
| Background refresh | Subtle top-bar progress indicator |
| File upload | Progress bar with percentage |
| Pagination | Spinner overlay on table area |
| Auto-save | "Saving..." text next to form, turns to "Saved" |

### Loading Timing Rules

| Duration | UI Behavior |
|----------|-------------|
| < 100ms | No loading indicator (instant) |
| 100–300ms | Show subtle skeleton (fast) |
| 300–1000ms | Show full skeleton |
| > 1000ms | Show skeleton + loading message |
| > 5000ms | Show error state if no progress |

---

## 3. Error States

### When to Show

- Network request failed
- Server returned error
- Permission denied
- Resource not found (404)
- Validation failed (form-specific, not page-level)

### Error State Anatomy

```
┌──────────────────────────────────────────┐
│                                          │
│           [Error Icon / Illustration]     │
│                                          │
│        [Title: What went wrong]           │
│                                          │
│   [Description: What the user can do]    │
│                                          │
│   [Retry]    [Go Back]    [Contact Support]│
│                                          │
└──────────────────────────────────────────┘
```

### Error State Library

| Scenario | Illustration | Title | Description | Actions |
|----------|-------------|-------|-------------|---------|
| Network error | Broken connection | Connection lost | Check your internet connection and try again. | [Retry] |
| Server error (500) | Server icon with warning | Something went wrong | Our servers are having trouble. Please try again. | [Retry] [Contact Support] |
| Not found (404) | Empty box | Page not found | The page you're looking for doesn't exist. | [Go to Dashboard] |
| Forbidden (403) | Lock icon | Access denied | You don't have permission to view this page. | [Go to Dashboard] [Contact Admin] |
| Rate limited | Clock with warning | Too many requests | Please wait a moment before trying again. | [Try Again in Xs] |
| Session expired | Key icon | Session expired | Your session has timed out. Please log in again. | [Log In] |
| Save failed | Document with X | Failed to save | Your changes couldn't be saved. | [Retry] [Download Draft] |
| Delete failed | Trash with X | Could not delete | We couldn't complete the deletion. | [Retry] |

### Inline Error States

| Context | UI Pattern |
|---------|------------|
| Form field error | Red border + error message below field |
| Form submission error | Error alert banner above form + scroll to first error |
| Table row error | Red highlight on failed row + tooltip with error |
| Toast error | Top-right toast with error message and manual dismiss |
| Modal error | Error alert inside modal + fields highlighted |

### Offline Mode

- Detect network status (navigator.onLine + periodic health check)
- Show persistent banner: "You are offline. Some features may be unavailable."
- Cache last-loaded data for read-only access
- Queue write operations for retry when online
- Show queued count: "2 pending actions"

---

## 4. Permission Denied State

### Page-Level

```
┌──────────────────────────────────────────┐
|                                          |
|           🔒                             |
|                                          |
|       Access Restricted                   |
|                                          |
|   You don't have permission to view      |
|   this page. Contact your admin if you   |
|   need access.                           |
|                                          |
|   [Go to Dashboard]  [Contact Admin]    |
|                                          |
└──────────────────────────────────────────┘
```

### Action-Level

- Hidden: Buttons/actions user lacks permission for are not rendered
- Disabled: If action partially available, show disabled button with tooltip: "You don't have permission"

---

## 5. Success States

### Page-Level

- Redirect to list/detail page
- Toast: "Item created successfully"
- Brief green flash on affected row (for updates)

### Form-Level

- Success toast + auto-close modal (create/edit)
- Form resets to empty (sequential create) or shows summary

---

## 6. Transition States

| Transition | UI |
|------------|-----|
| Data refreshing | Subtle shimmer overlay on changed section |
| Page navigating | Top-bar progress bar (YouTube-style) |
| Modal closing | Fade-out animation (150ms) |
| Toast appearing | Slide-in + fade (200ms) |
| Toast disappearing | Fade-out (300ms) |

---

## Cross-References

- [component-library.md](./component-library.md) — Skeleton, toast, alert components
- [micro-interactions.md](./micro-interactions.md) — State transition animations
- [interaction-design.md](./interaction-design.md) — Feedback interactions
