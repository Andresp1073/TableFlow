# Interaction Design

**Last updated:** 2026-07-04

---

## Interaction Principles

| Principle | Description |
|-----------|-------------|
| **Instant feedback** | Every action produces a visual response within 100ms |
| **Predictable motion** | Animations follow natural physics (ease-out, not linear) |
| **Progressive disclosure** | Reveal complexity gradually, don't overwhelm |
| **Forgiving input** | Allow undo, confirm destructive actions, auto-save drafts |
| **Context preservation** | Don't lose user context on navigation or errors |

---

## 1. Navigation Interactions

### Sidebar

| Interaction | Behavior | Duration |
|-------------|----------|----------|
| Hover item | Background tint (primary-50) | 100ms |
| Click item | Background flash + bold text | 150ms |
| Expand submenu | Chevron rotates 90° + slide down children | 200ms |
| Collapse sidebar | Sidebar shrinks to 64px, icons center, labels hidden | 200ms ease |
| Active indicator | Left border 3px primary-500 | Persistent |

### Top Bar Dropdowns

| Interaction | Behavior |
|-------------|----------|
| Click avatar | Dropdown fades in + slides down 8px from trigger |
| Click outside | Dropdown fades out |
| Escape key | Dropdown closes |
| Item hover | Background tint |

### Breadcrumbs

| Interaction | Behavior |
|-------------|----------|
| Hover link | Underline + color change |
| Click link | Page transition |
| Current page | Bold text, no underline |

---

## 2. Button Interactions

| State | Visual | Duration |
|-------|--------|----------|
| Default | Solid background, shadow-sm | — |
| Hover | Slightly darker background, elevated shadow (shadow) | 150ms |
| Active/Pressed | Scale 0.97, inner shadow | 100ms |
| Focus | 2px primary ring offset 2px | — |
| Loading | Spinner replaces icon, button disabled | Until complete |
| Disabled | 50% opacity, no interaction | — |

### Ripple Effect

- Optional ripple on click (opt-in via prop)
- Ripple originates from click position
- Duration: 400ms, fades out

---

## 3. Form Interactions

| Interaction | Behavior |
|-------------|----------|
| Focus input | Border primary-500 + subtle glow |
| Blur (valid) | Optional green border + checkmark |
| Blur (invalid) | Red border + error message appears with slide down |
| Typing | Character count updates in real-time |
| Submit (success) | Button shows checkmark then reverts |
| Submit (error) | Button shakes, error banner appears |

### Validation Timing

| Validation Type | Trigger |
|-----------------|---------|
| Format (email, phone) | On blur |
| Required field | On blur |
| Length (min/max) | On blur (or on keystroke with counter) |
| Cross-field | On form submit |
| Async (email unique) | On blur with 300ms debounce |

---

## 4. Modal Interactions

| Interaction | Behavior | Duration |
|-------------|----------|----------|
| Open | Backdrop fades in (100ms), modal scales up + fades (200ms) | 200ms total |
| Close (confirm) | Modal fades out, backdrop fades out | 150ms |
| Close (discard) | Modal shakes before closing (if unsaved) | 300ms |
| Overlay click | Close (cancellable for destructive forms) | 150ms |
| Escape key | Close | 150ms |
| Focus trap | Tab cycles within modal elements | — |
| Body scroll | Locked while modal open | — |

### Modal Motion Curve

```yaml
open:
  backdrop: "opacity 0 → 1, 100ms ease"
  content:  "opacity 0 → 1, scale 0.95 → 1, 200ms cubic-bezier(0.16, 1, 0.3, 1)"
close:
  backdrop: "opacity 1 → 0, 100ms ease"
  content:  "opacity 1 → 0, scale 1 → 0.95, 150ms ease"
```

---

## 5. Table Interactions

| Interaction | Behavior |
|-------------|----------|
| Row hover | Background primary-50 (light) / neutral-700 (dark) |
| Row click | Navigate to detail or select row |
| Header click (sortable) | Toggle asc/desc with arrow icon animation |
| Header hover | Slightly darker background |
| Cell with action | Icon appears on row hover only |
| Pagination click | Page transition with subtle fade |

### Selection

| State | Visual |
|-------|--------|
| Unselected | Empty checkbox |
| Selected | Checked checkbox + row highlighted (primary-50) |
| Indeterminate | Dash in checkbox (parent rows) |

---

## 6. Drag and Drop Interactions

### Reservation to Table

| Phase | Visual | Duration |
|-------|--------|----------|
| Start drag | Item elevates (shadow-lg), slight scale (1.02), opacity 0.9 | 100ms |
| Dragging | Cursor changes to grab, original position shows placeholder | — |
| Over valid drop zone | Table card highlights green, pulse border | 200ms |
| Over invalid drop | Table card gray, cursor shows not-allowed | — |
| Drop success | Table card green flash, item disappears | 200ms |
| Drop invalid | Item snaps back to origin with spring animation | 300ms |

### Table Position (Edit Mode)

| Phase | Visual |
|-------|--------|
| Start drag | Table card elevates, shadow-lg |
| Dragging | Grid snapping indicator (dotted lines) |
| Drop | Table snaps to nearest grid position, brief scale up |

---

## 7. Toast Interactions

| Phase | Behavior | Duration |
|-------|----------|----------|
| Enter | Slide in from right + fade in | 200ms |
| Visible | Auto-dismiss timer (3–5s) | Varies |
| Exit | Fade out + slide right | 300ms |
| Stack | Subsequent toasts stack below, 8px gap | — |
| Hover | Pause auto-dismiss timer | — |
| Click action | Execute action + dismiss toast | — |

---

## 8. Notification Interactions

| Interaction | Behavior |
|-------------|----------|
| Bell hover | Subtle bell shake animation | 300ms |
| Bell badge (new) | Badge appears with scale bounce | 200ms |
| Open panel | Slide in from right (400px) | 250ms ease |
| Close panel | Slide out to right | 200ms |
| Mark as read | Dot fades out, card becomes slightly muted | 200ms |
| Dismiss | Card slides right and fades | 150ms |

---

## 9. Page Transitions

| Transition | Behavior | Duration |
|------------|----------|----------|
| Page load | Content fades in | 200ms |
| Page change | Top bar progress bar (static pages) or cross-fade (SPA) | 300ms |
| List filter | Table rows cross-fade (new results replace old) | 200ms |
| Detail navigation | Slide left (drill down), slide right (back) | 250ms |

### Route Transition

```yaml
forward navigation (list → detail):
  "opacity: 0 → 1, translateX(20px → 0), 250ms ease"

backward navigation (detail → list):
  "opacity: 1 → 0, translateX(0 → -20px), 200ms ease"
```

---

## 10. Status Change Animations

| Change | Animation |
|--------|-----------|
| Pending → Confirmed | Badge color transitions amber → blue (200ms) |
| Confirmed → Seated | Badge color transitions blue → green (200ms), brief sparkle |
| Seated → Completed | Badge color transitions green → gray (200ms), fades slightly |
| Any → Cancelled | Badge turns red, row briefly highlights (500ms), then dims |
| No-show marked | Badge turns red with exclamation, row shakes |

---

## 11. Optimistic UI

| Action | Optimistic Update | Rollback |
|--------|-------------------|----------|
| Check-in guest | Immediately show "Seated" status, update table to occupied | Revert if server error, show toast error |
| Create reservation | Show in list immediately with "pending" status | Remove from list if creation fails |
| Cancel reservation | Gray out row immediately | Restore original state if fails |
| Table status change | Update floor plan immediately | Revert with error toast |

---

## 12. Haptic Feedback (Mobile)

| Action | Haptic |
|--------|--------|
| Check-in | Light tap |
| Error | Double tap (error pattern) |
| Success | Single light tap |
| Long press | Heavy feedback |
| Drag start | Light tap |
| Drop | Medium tap |

---

## Cross-References

- [micro-interactions.md](./micro-interactions.md) — Detailed micro-animation specs
- [component-library.md](./component-library.md) — Component states and transitions
- [empty-loading-error-states.md](./empty-loading-error-states.md) — Error interaction patterns
