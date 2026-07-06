# Accessibility

**Last updated:** 2026-07-04

---

## Standards

- Target: **WCAG 2.2 Level AA** minimum
- Internal target: Level AAA where practical (contrast, keyboard)

---

## Color & Contrast

| Requirement | Standard | Our Target |
|-------------|----------|------------|
| Normal text contrast | 4.5:1 | 7:1 |
| Large text contrast (≥18px bold or ≥24px) | 3:1 | 4.5:1 |
| UI component contrast | 3:1 | 4.5:1 |
| Focus indicator | 2:1 | 3:1 |

### Color Usage Rules

- Never use color alone to convey information
- Status indicators: color + icon + text label
- Link text: underline + color (primary-500)
- Error states: color + icon + message text

---

## Keyboard Navigation

### Global Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next interactive element |
| `Shift + Tab` | Move focus to previous interactive element |
| `Enter` / `Space` | Activate focused element |
| `Escape` | Close modal, dropdown, drawer, or popover |
| `Cmd/Ctrl + K` | Open global command palette |
| `Cmd/Ctrl + 1-9` | Navigate to first 9 sidebar items |
| `?` | Show keyboard shortcuts help modal |
| `Arrow Up/Down` | Navigate list items, dropdown options |
| `Arrow Left/Right` | Navigate tabs, calendar days |

### Focus Management

| Pattern | Behavior |
|---------|----------|
| Page load | Focus moves to main content heading or first interactive element |
| Modal open | Focus trapped in modal, first focusable element receives focus |
| Modal close | Focus returns to element that triggered the modal |
| List navigation | Arrow keys navigate list rows, Enter opens detail |
| Tab order | Logical left-to-right, top-to-bottom |
| Skip link | First tabbable element: "Skip to main content" |
| Focus visible | 2px primary-500 outline, never `outline: none` without replacement |

### Skip Navigation

```
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ...
  <main id="main-content">
```

- Visually hidden until focused via Tab
- On focus: appears at top of page, high contrast

---

## ARIA Roles & Attributes

### Landmarks

| Region | ARIA Role / Label |
|--------|-------------------|
| Top bar | `role="banner"`, `aria-label="Top bar"` |
| Sidebar | `role="navigation"`, `aria-label="Main navigation"` |
| Main content | `role="main"`, `id="main-content"` |
| Search | `role="search"` |
| Breadcrumb | `role="navigation"`, `aria-label="Breadcrumb"` |
| Footer | `role="contentinfo"` |

### Interactive Elements

| Component | ARIA Pattern |
|-----------|--------------|
| Button | `role="button"` (if not using `<button>`) |
| Link | `<a>` with `href` |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="title-id"` |
| Tab panel | `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` |
| Alert | `role="alert"` (for dynamic alerts) |
| Toast | `role="status"`, `aria-live="polite"` |
| Error toast | `role="alert"`, `aria-live="assertive"` |
| Progressbar | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Tooltip | `role="tooltip"`, `aria-describedby` |
| Dropdown | `role="listbox"` or `role="menu"`, `aria-expanded` |
| Switch/toggle | `role="switch"`, `aria-checked` |
| Table sort | `aria-sort="ascending"` or `"descending"` |

### Live Regions

| Element | ARIA Attribute | Use Case |
|---------|----------------|----------|
| Toast notifications | `aria-live="polite"` | Non-critical updates |
| Error messages | `aria-live="assertive"` | Critical errors |
| Loading spinner | `aria-live="polite"` | "Loading, please wait" |
| Counter (e.g., seats left) | `aria-live="polite"` | Dynamic updates |

---

## Screen Reader Support

### Labels

| Element | Pattern |
|---------|---------|
| Input fields | `<label for="id">` or `aria-label` |
| Icon-only buttons | `aria-label="Search"` |
| Status indicators | `aria-label="Status: Confirmed"` |
| Table columns | `<th scope="col">` |
| Table rows | `<th scope="row">` for row headers |
| Live counters | `aria-live="polite"` |

### Announcements

| Event | Announcement |
|-------|-------------|
| Page loaded | "Reservations page loaded. Showing 10 of 45 reservations." |
| Reservation created | "Reservation created for John Smith at 7:00 PM." |
| Status changed | "Reservation status changed to Seated." |
| Error | "Error: Could not load reservations. Please try again." |
| Search results | "10 results found for John." |
| Loading complete | "Data loaded." |

### Focus Announcements

- New page loaded: screen reader announces page title
- New content appears: announce briefly via `aria-live`
- Modal opened: "New Reservation dialog. Step 1 of 3: Guest details."
- Toast: announced via `aria-live="polite"`

---

## Touch & Motion

### Reduced Motion

- Respect `prefers-reduced-motion` media query
- Replace animations with fade (no slide, no scale)
- Disable shimmer on skeletons
- Disable parallax and complex transitions

### Touch Support

- Touch targets ≥ 44px × 44px
- Swipe gestures: provide alternative button controls
- Long-press: provide alternative through right-click/context menu
- Pinch-to-zoom: only on floor plan view

---

## Form Accessibility

| Pattern | Implementation |
|---------|----------------|
| Field labels | Visible label for every input |
| Required indicator | `*` with `aria-required="true"` |
| Error association | `aria-describedby="error-id"` on input |
| Error summary | List of errors at top of form with links to fields |
| Autocomplete | `autocomplete="name"`, `"email"`, `"tel"` on auth and customer forms |
| Grouped inputs | `fieldset` + `legend` for radio/checkbox groups |

---

## Testing Checklist

| Category | Test | Tool |
|----------|------|------|
| Keyboard | All interactive elements reachable via Tab | Manual |
| Keyboard | All actions available via keyboard | Manual |
| Focus | Visible focus indicator on all elements | Manual |
| Contrast | Text meets 4.5:1 ratio | axe DevTools, Lighthouse |
| Screen reader | All content announced correctly | VoiceOver, NVDA |
| Screen reader | Dynamic content announced | Manual |
| Zoom | Page works at 200% zoom | Manual |
| Reduced motion | No distracting animations | Manual |
| Touch targets | All targets ≥ 44px | Manual |
| Form labels | All inputs have visible labels | axe DevTools |

## Cross-References

- [design-system.md](./design-system.md) — Color tokens and contrast
- [component-library.md](./component-library.md) — Accessible component patterns
- [micro-interactions.md](./micro-interactions.md) — Reduced motion preferences
