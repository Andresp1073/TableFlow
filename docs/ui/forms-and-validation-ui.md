# Forms and Validation UI

**Last updated:** 2026-07-04

---

## Form Design Principles

- **Single column** layouts (proven faster completion than multi-column)
- **Labels** above inputs (not placeholder-as-label)
- **Inline validation** on blur (not on keystroke to avoid premature errors)
- **Submit validation** for complex cross-field rules
- **Disabled submit** during async operations
- **Save progress** for long forms (auto-save draft to localStorage)

---

## Field Layout Patterns

### Default (Single Column)

```
Label
[Input field]
Error message (if any)
Helper text (if any)
```

### Inline (Short Fields)

```
Label
[Field 1]   [Field 2]   [Field 3]
```

Used for: date ranges, time ranges, name (first/last).

### Grouped

```
┌─────────────────────────────────────┐
│ Section Title                       │
│ ─────────────────────────────────── │
│ [Field 1]                           │
│ [Field 2]                           │
└─────────────────────────────────────┘
```

Used for: address fields, payment info.

---

## Input Types

| Type | Component | Validation |
|------|-----------|------------|
| Text | `<input type="text">` | Required, min/max length, pattern |
| Email | `<input type="email">` | Valid email regex |
| Phone | `<input type="tel">` | Format mask (XXX-XXX-XXXX) |
| Number | `<input type="number">` | Min, max, step |
| Password | `<input type="password">` | Min length, complexity |
| Date | DatePicker component | Not in past (for new reservations) |
| Time | TimePicker component | Within operating hours |
| Textarea | `<textarea>` | Max length with counter |
| Select | Dropdown component | Required if not optional |
| Multi-select | Tag/chip input | At least 1 (if required) |
| Toggle | Switch component | Boolean |
| Radio | Radio group | Exclusive selection |
| Checkbox | Checkbox group | Multiple selection |

---

## Validation Patterns

### Inline Validation (On Blur)

| State | Visual |
|-------|--------|
| Valid | Green checkmark icon + green border (optional — only show after successful correction) |
| Error | Red border + red error message below field |
| Warning | Amber border + amber message (non-blocking suggestion) |

### Error Messages

| Pattern | Example |
|---------|---------|
| What's wrong | "Email address is invalid" |
| How to fix | "Enter a valid email address (e.g., user@example.com)" |
| Tone | Friendly, specific, non-technical |

### Cross-Field Validation

| Rule | UI Behavior |
|------|-------------|
| End time > start time | Validate on form submit, highlight both fields |
| Date + time within operating hours | Validate on time select, disable invalid slots |
| Party size ≤ table capacity | Validate on table select, filter tables |
| Min notice period | Disable time slots within notice window |

---

## Form States

### Default
Label + empty input + helper text (if any).

### Filled
Label + input with value + optional character count.

### Error
Label + red border + error icon + error message below input.

```
Email
[❌ invalid-email@]
Please enter a valid email address
```

### Success
Label + green border + checkmark (shown briefly after async validation passes).

### Disabled
Label + gray background + gray text + no interaction.

### Loading (Async)
Label + input + spinner in place of action button + disabled submit.

---

## Multi-Step Forms

### Pattern

```
Step indicator (top)
├── Step 1: Completed (clickable to go back)
├── Step 2: Current (highlighted)
└── Step 3: Pending (gray)
└── Step 4: Pending (gray)

[Back]  [Next/Continue]  (bottom)
```

### Behavior

| Action | Behavior |
|--------|----------|
| Back | Go to previous step, preserve all data |
| Next | Validate current step, advance if valid |
| Skip | Optional steps show "Skip" button |
| Close | Confirm: "Discard changes?" if any field touched |

### Data Persistence

- Form data stored in local state (not localStorage for sensitive data)
- Navigating away: "You have unsaved changes" dialog
- Session timeout: warn before form data is lost

---

## Form Actions

### Standard Button Layout

| Form Type | Button Order |
|-----------|--------------|
| Create | [Cancel] [Create] |
| Edit | [Cancel] [Save Changes] |
| Delete | [Cancel] [Delete] (destructive red) |
| Search | [Clear] [Search] |
| Multi-step | [Back] [Skip] [Next] |

- Primary action: right side
- Destructive action: left of primary, red styling
- Cancel: secondary/outline button

---

## Empty Form Guidance

### New Form (Empty)
```
+------------------------------------------------------------------+
|   ✨ New Reservation                                              |
|                                                                   |
|   Start by searching for a customer or entering their details.    |
|                                                                   |
|   [Customer Name]  [Party Size]  [Date]  [Time]                   |
|                                                                   |
|   Need help? Check our [guide to creating reservations].          |
+------------------------------------------------------------------+
```

### Form with Suggested Defaults

Pre-fill sensible defaults:
- **Date**: Today (or selected date from context)
- **Time**: Next available time slot
- **Duration**: Branch default (90 min)
- **Branch**: Currently selected branch

---

## Form Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Max-width 720px, centered |
| Tablet (768–1024px) | Full-width with padding |
| Mobile (<768px) | Full-width, stacked fields, larger touch targets |

---

## Cross-References

- [component-library.md](./component-library.md) — Input, button, select components
- [reservation-flow-ui.md](./reservation-flow-ui.md) — Reservation form steps
- [empty-loading-error-states.md](./empty-loading-error-states.md) — Form error states
- [accessibility.md](./accessibility.md) — Accessible form controls
