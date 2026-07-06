# Component Library

**Last updated:** 2026-07-04

## 1. Button

| Attribute | Details |
|-----------|---------|
| **Purpose** | Triggers actions (primary, secondary, destructive) |
| **Variants** | `primary`, `secondary`, `outline`, `ghost`, `destructive`, `link` |
| **Sizes** | `xs`, `sm`, `md`, `lg` |
| **States** | default, hover, active, disabled, loading (with spinner), focus |

### Usage Rules

- Use **primary** for main CTA (max 1 per section)
- Use **secondary** for alternative actions
- Use **outline** for less emphasized actions
- Use **ghost** for toolbar/inline actions
- Use **destructive** for delete/irreversible actions
- Use **link** for text-only actions inline
- Always show loading state on async actions (prevent double-click)
- Buttons with icons: icon-left for actions, icon-right for external links

---

## 2. Input

| Attribute | Details |
|-----------|---------|
| **Purpose** | Text entry fields |
| **Variants** | `text`, `email`, `tel`, `password`, `number`, `search`, `textarea` |
| **States** | default, hover, focus, filled, error, disabled, readonly |

### Usage Rules

- Label required for all inputs (no placeholder-as-label)
- Error state: red border + error message below input
- Helper text available below input
- Character count shown when maxLength set
- Search inputs: include clear button when populated
- Password inputs: toggle visibility icon

---

## 3. Select

| Attribute | Details |
|-----------|---------|
| **Purpose** | Select from predefined options |
| **Variants** | `default`, `searchable`, `multi-select` |
| **States** | default, hover, focus, error, disabled |

### Usage Rules

- Use searchable select when > 10 options
- Multi-select shows chip-style selected items
- Grouped options for hierarchical data

---

## 4. Date/Time Picker

| Attribute | Details |
|-----------|---------|
| **Purpose** | Date and/or time selection |
| **Variants** | `date`, `time`, `datetime`, `daterange` |
| **States** | default, focus, error, disabled, min/max constrained |

### Usage Rules

- Date range for availability searches
- Time slots show only available times (disabled unavailable)
- Quick-select: "Today", "Tomorrow", "This Weekend"

---

## 5. Modal

| Attribute | Details |
|-----------|---------|
| **Purpose** | Focused tasks (create, edit, confirm) |
| **Variants** | `default`, `small`, `large`, `fullscreen` |
| **Sizes** | sm: 400px, md: 560px, lg: 720px |

### Usage Rules

- Title + close button in header
- Body scrolls if content overflows
- Footer with action buttons
- Close on overlay click (opt-out for destructive actions)
- Close on Escape key
- Trap focus within modal
- Prevent background scroll
- Animate in (fade + scale), animate out (fade)

---

## 6. Table / Data Grid

| Attribute | Details |
|-----------|---------|
| **Purpose** | Display structured data lists |
| **Variants** | `default`, `compact`, `striped`, `sortable`, `selectable` |

### Usage Rules

- Column headers: sortable (click to toggle asc/desc)
- Row hover: highlight background
- Selected rows: primary background
- Actions column: fixed right (ghost buttons or dropdown)
- Empty state: centered illustration + message
- Loading state: skeleton rows (3-5 rows)
- Pagination or infinite scroll at bottom
- Responsive: horizontal scroll on mobile, or card layout

### Columns

| Column Pattern | Description |
|---------------|-------------|
| Text | Left-aligned, truncated with ellipsis |
| Number | Right-aligned |
| Status | Badge component |
| Date | Formatted with relative option (e.g., "2h ago") |
| Actions | Icon buttons + dropdown |

---

## 7. Card

| Attribute | Details |
|-----------|---------|
| **Purpose** | Group related content |
| **Variants** | `default`, `interactive` (hoverable, clickable), `highlighted` |

### Usage Rules

- Title optional (with optional icon)
- Body padding: 16px (spacing-4)
- Interactive cards: hover elevation change, cursor pointer
- Cards in a grid: consistent height (min-height or equal-height flex)

---

## 8. Dropdown

| Attribute | Details |
|-----------|---------|
| **Purpose** | Menu of actions or selections |
| **Variants** | `menu`, `select`, `actions` |

### Usage Rules

- Triggers: button, icon button, or context menu (right-click)
- Items: icon + label, dividers between groups
- Danger items: red text
- Keyboard: arrow keys, Enter to select, Escape to close
- Positioning: bottom-left by default, auto-flip if out of viewport

---

## 9. Alert / Banner

| Attribute | Details |
|-----------|---------|
| **Purpose** | Page-level notifications (non-dismissable for errors) |
| **Variants** | `info`, `success`, `warning`, `error` |

### Usage Rules

- Used for system messages, not user actions (use toast for actions)
- Can include title + description + optional action link
- Dismissable for info/warning; persistent for errors
- Error alerts: include clear action to resolve

---

## 10. Toast / Snackbar

| Attribute | Details |
|-----------|---------|
| **Purpose** | Action feedback (non-blocking) |
| **Variants** | `success`, `error`, `info`, `warning` |
| **Position** | Top-right (desktop), top-center (mobile) |

### Usage Rules

- Auto-dismiss: success (3s), info (4s), warning (5s)
- Error toasts: manual dismiss only
- Max 3 visible toasts at once (queue additional)
- Include undo action where applicable
- Animate: slide in from right, fade out

---

## 11. Badge

| Attribute | Details |
|-----------|---------|
| **Purpose** | Status indicators, labels, counts |
| **Variants** | `default`, `outline`, `dot` |
| **Sizes** | `sm`, `md` |

### Color Mapping (Status)

| Status | Color |
|--------|-------|
| Confirmed | `primary` |
| Seated | `success` |
| Pending | `warning` |
| Cancelled | `error` |
| No-show | `error` |
| Completed | `neutral` |
| Cleaning | `purple` |
| Blocked | `dark` |

---

## 12. Avatar

| Attribute | Details |
|-----------|---------|
| **Purpose** | User representation |
| **Variants** | `image`, `initials`, `placeholder` |
| **Sizes** | `sm` (24px), `md` (32px), `lg` (40px), `xl` (56px) |

### Usage Rules

- Show image when available, fallback to initials (2 chars)
- Color-based backgrounds for initials (deterministic hash)
- Status dot indicator (online/offline/busy)
- Grouped avatars for collaborative contexts

---

## 13. Tabs

| Attribute | Details |
|-----------|---------|
| **Purpose** | Switch between related content sections |
| **Variants** | `underline`, `pill`, `icon+label` |

### Usage Rules

- Active tab: primary color underline or filled pill
- Scrollable on overflow (horizontal scroll with gradient fade)
- Keyboard: arrow keys to navigate tabs

---

## 14. Pagination

| Attribute | Details |
|-----------|---------|
| **Purpose** | Navigate through pages of data |
| **Variants** | `numbered`, `prev-next`, `load-more` |

### Usage Rules

- Show page numbers (max 7 visible, use ellipsis)
- Show total count + current range ("Showing 1-10 of 123")
- Previous / Next buttons always visible
- Optional page size selector (10, 25, 50, 100)

---

## 15. Skeleton

| Attribute | Details |
|-----------|---------|
| **Purpose** | Loading placeholder |
| **Variants** | `text`, `card`, `table-row`, `avatar`, `chart` |

### Usage Rules

- Match dimensions of actual content
- Animate with shimmer effect
- Never show for cached/fast operations (< 300ms)

---

## 16. Tooltip

| Attribute | Details |
|-----------|---------|
| **Purpose** | Contextual help on hover/focus |
| **Variants** | `top`, `bottom`, `left`, `right` |

### Usage Rules

- Trigger: hover (mouse) + focus (keyboard)
- Delay: 300ms show, 0ms hide
- Used for icon-only buttons (accessibility)
- Not for critical information (mobile users can't hover)

---

## Cross-References

- [ui-tokens.md](./ui-tokens.md) — Component tokens (border radius, shadows)
- [forms-and-validation-ui.md](./forms-and-validation-ui.md) — Form component composition
- [empty-loading-error-states.md](./empty-loading-error-states.md) — State components
