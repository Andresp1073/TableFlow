# Responsive Design

**Last updated:** 2026-07-04

---

## Breakpoints

| Name | Min Width | Target Devices |
|------|-----------|----------------|
| `xs` | 0px | Small phones |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets (portrait) |
| `lg` | 1024px | Tablets (landscape), small desktops |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

---

## Layout Adaptations

### Sidebar Behavior

| Breakpoint | Sidebar State |
|------------|---------------|
| xs–md | Hidden (off-canvas, overlay with backdrop) |
| md–lg | Collapsed (icons only, 64px) or hidden |
| lg+ | Expanded (280px) or collapsed (user preference) |

### Top Bar

| Breakpoint | Behavior |
|------------|----------|
| xs–md | Compact (hamburger icon, branch name only, notification badge) |
| md+ | Full (breadcrumb hidden on smaller screens) |

### Content Area

| Breakpoint | Padding | Max Width |
|------------|---------|-----------|
| xs | 16px | 100% |
| sm–md | 24px | 100% |
| lg+ | 32px | 1280px (centered) |

---

## Page Adaptations

### List/Table Pages

| Breakpoint | Display |
|------------|---------|
| xs–sm | Card list (one item per row) |
| md | Table with horizontal scroll |
| lg+ | Full table |

#### Mobile Card List (Replaces Table)

```
┌──────────────────────────────────────┐
│ Smith, John                          │
│ 7:00 PM · 4 guests                  │
│ Table T-12 · Window                  │
│ ✅ Confirmed                    >  │
├──────────────────────────────────────┤
│ Jones, Mary                          │
│ 7:15 PM · 2 guests                  │
│ 🔄 Pending                      >  │
├──────────────────────────────────────┤
│ Lee, Sarah                           │
│ 7:30 PM · 6 guests                  │
│ Table T-8 · Corner                   │
│ 🟢 Seated                       >  │
└──────────────────────────────────────┘
```

### Detail Pages

| Breakpoint | Layout |
|------------|--------|
| xs–md | Single column, stacked sections |
| md–lg | Two columns (content left, sidebar right) |
| lg+ | Two columns (wider content area) |

### Dashboard

| Breakpoint | KPI Row | Charts |
|------------|---------|--------|
| xs | 2 columns (2x2 grid) | Single column |
| sm–md | 4 columns (1 row) | 2 columns |
| lg+ | 4 columns (1 row) | 2 columns (wider) |

### Floor Plan

| Breakpoint | Behavior |
|------------|----------|
| xs–md | Single table focus (list view instead of visual map), pinch-to-zoom on table map |
| md+ | Visual floor plan with zoom/pan |
| lg+ | Full floor plan with drag-and-drop |

### Modals

| Breakpoint | Width | Position |
|------------|-------|----------|
| xs | 90vw (full-screen with padding) | Bottom sheet style |
| sm–md | 85vw (max 560px) | Centered |
| lg+ | Fixed width (400–720px depending on variant) | Centered |

### Forms

| Breakpoint | Layout |
|------------|--------|
| xs–sm | Single column, full-width inputs |
| md+ | Single column, max-width 720px |
| lg+ | Single column, max-width 720px (centered) |

---

## Touch Targets

| Element | Minimum Size |
|---------|-------------|
| Buttons | 44px × 44px |
| Links (inline) | 44px minimum height |
| Form inputs | 44px minimum height |
| Table rows (mobile) | 48px minimum height |
| Icon buttons | 44px × 44px |
| Dropdown items | 44px minimum height |
| Swipeable rows | Full row height |

---

## Mobile-Specific Patterns

### Bottom Sheet Menu

Used instead of dropdowns on mobile. Slides up from bottom with handle.

```
┌──────────────────────────────────┐
│ ─── (handle)                      │
│                                  │
│ Actions                          │
│ ──────────────────────────────── │
│ ○ Check In                       │
│ ○ Edit Reservation               │
│ ○ Cancel Reservation             │
│ ──────────────────────────────── │
│ ⚠ Mark as No-show (destructive) │
│                                  │
│ [Cancel]                         │
└──────────────────────────────────┘
```

### Swipe Actions

| Swipe Direction | Action |
|----------------|--------|
| Swipe left (short) | Reveal "Check-in" button |
| Swipe left (long) | Reveal "Cancel" button |
| Swipe right | Mark as done/complete |

### Pull to Refresh

- Available on all list pages
- Shows spinner at top
- Updates data on release

### Floating Action Button (FAB)

- Mobile-only: positioned bottom-right
- Primary action for the current page
- Example: "+" for new reservation on mobile

### Bottom Navigation Bar

- 5 tabs max (most critical modules)
- Active tab highlighted with primary color

---

## Responsive Navigation Example

```
Desktop (>1024px):
  [Sidebar (280px)] [Content Area]

Tablet (768–1024px):
  [Collapsed Sidebar (64px)] [Content Area]

Mobile (<768px):
  [Top Bar + Hamburger]
  [Content Area (full width)]
  [Bottom Tab Bar]
  [Hidden Sidebar — slides in as overlay]
```

---

## Hiding Content

| Element | Hidden On |
|---------|-----------|
| Sidebar labels | xs–md (show icons only in overlay) |
| Table columns beyond 3 | xs–sm (expandable in card detail) |
| Detailed charts | xs–sm (show simplified sparkline) |
| Breadcrumbs | xs (show back button only) |
| Page title (in breadcrumb) | xs (show in top bar instead) |
| Advanced filters | xs–sm (collapsible, show count "Filters: 3") |

---

## Cross-References

- [layout-structure.md](./layout-structure.md) — Desktop layout regions
- [navigation-system.md](./navigation-system.md) — Mobile bottom nav
- [component-library.md](./component-library.md) — Component responsive variants
