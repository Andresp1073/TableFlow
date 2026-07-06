# Micro-Interactions

**Last updated:** 2026-07-04

---

## Design Philosophy

Micro-interactions are the 100–300ms moments that make an app feel **alive and responsive**. Every micro-interaction must:

- Serve a purpose (feedback, guidance, delight)
- Not delay the user
- Respect `prefers-reduced-motion`
- Be subtle enough to never feel distracting

---

## 1. Button Micro-Interactions

### Primary Button Click

```
1. User clicks/taps
2. Button scale: 1 → 0.97 (80ms)
3. Background shifts 1 shade darker
4. On release (or action complete):
   - Scale returns to 1 (80ms, spring)
   - Background returns to default
```

### Loading Button

```
1. Text fades out (80ms)
2. Spinner fades in center (80ms)
3. Button maintains width (prevents layout shift)
4. On complete: spinner fades out (80ms), checkmark appears (120ms), then button reverts
```

### Destructive Button

```
1. Click: brief red flash (100ms)
2. If confirmation needed: button text changes to "Confirm?" with shake (200ms)
3. Second click: executes
4. If canceled (click outside): text reverts, no shake
```

---

## 2. Input Micro-Interactions

### Focus Transition

```
1. Input border color transitions from neutral-300 to primary-500 (150ms)
2. Box shadow glow appears (primary-500 at 10% opacity, 150ms)
3. Label stays in position (floating label variant: label transitions up by 12px, 150ms)
```

### Validation Feedback

```
Error:
1. Border transitions to error-500 (150ms)
2. Error icon fades in (100ms)
3. Error message slides down from 0 to full height (150ms)
4. Input container height adjusts smoothly

Success (optional):
1. Border transitions to success-500 (150ms)
2. Checkmark icon fades in (100ms), fades out after 1s
```

### Character Counter

```
1. Number updates in real-time as user types
2. When approaching limit (>80%): counter turns amber
3. At limit: counter turns red, subtle pulse (200ms)
4. Past limit: red counter, input border red, excess chars highlighted
```

---

## 3. Toggle/Switch

```
Off → On:
1. Track transitions from gray to primary-500 (200ms)
2. Knob slides from left to right (200ms, spring)
3. Brief shadow on knob during movement

On → Off:
1. Track transitions to gray (200ms)
2. Knob slides right to left (200ms)
```

---

## 4. Checkbox/Radio

```
Unchecked → Checked:
1. Box border transitions (80ms)
2. Checkmark draws in (stroke-dashoffset animation, 150ms)
3. Brief scale bounce 1→1.1→1 (150ms)

Checked → Unchecked:
1. Checkmark fades out (80ms)
2. Box border reverts (80ms)
```

---

## 5. Dropdown/Select

### Open

```
1. Chevron rotates 180° (150ms)
2. Options panel fades in + slides down 4px (150ms)
3. First option pre-highlighted (ready for keyboard)
```

### Selection

```
1. Selected option background changes (100ms)
2. Panel closes (100ms)
3. Chevron rotates back (100ms)
4. Trigger text updates (instant)
```

---

## 6. Toast/Snackbar

### Entry

```
1. Slide in from right edge: translateX(100%) → translateX(0) (200ms)
2. Fade in: opacity 0 → 1 (200ms)
3. Combination: spring easing for subtle bounce at end
```

### Exit

```
1. Slide to right: translateX(0) → translateX(100%) (200ms)
2. Fade out: opacity 1 → 0 (150ms)
3. Height collapses (100ms) — stack adjusts smoothly
```

---

## 7. Modal

### Entry

```
1. Backdrop: opacity 0 → 1 (150ms)
2. Modal content: 
   - opacity 0 → 1 (200ms)
   - scale 0.92 → 1 (200ms, cubic-bezier(0.16, 1, 0.3, 1))
   - translateY(20px) → translateY(0) (200ms)
   Total: 200ms
```

### Exit

```
1. Backdrop: opacity 1 → 0 (100ms)
2. Modal content:
   - opacity 1 → 0 (100ms)
   - scale 1 → 0.95 (100ms)
   Total: 100ms (fast exit, feels responsive)
```

---

## 8. Sidebar

### Expand/Collapse

```
Expand:
1. Sidebar width: 64px → 280px (200ms ease)
2. Icons shift left to accommodate labels (200ms)
3. Labels fade in (150ms, delayed 50ms)
4. Content area reflows (200ms)

Collapse:
1. Labels fade out (100ms)
2. Sidebar width: 280px → 64px (200ms ease)
3. Ims center (100ms)
4. Content area reflows (200ms)
```

### Active Item Indicator

```
1. Left border bar: height animates from 0 to full item height on hover (150ms)
2. Active: persistent left border 3px primary-500
3. Hover: item background tint transitions (100ms)
```

---

## 9. Table Row

### Hover

```
1. Background transitions to primary-50 (100ms)
2. Action icons fade in (80ms, only on row types with hover actions)
```

### Row Click (Navigable)

```
1. Background briefly flashes primary-100 (150ms)
2. Then navigates (or selects row)
```

### Row Update (Realtime)

```
1. Row highlights with color based on change type:
   - Created: green flash (500ms)
   - Updated: blue flash (500ms)
   - Deleted: red flash (300ms) → row slides out (200ms)
   - Status change: badge color transitions (200ms)
```

---

## 10. Drag and Drop

### Pick Up

```
1. Item scale: 1 → 1.03 (100ms)
2. Shadow: shadow → shadow-lg (100ms)
3. Opacity: 1 → 0.9 (100ms)
4. Cursor: default → grabbing
5. Original position: placeholder appears with dashed border (100ms)
```

### Dragging

```
1. Item follows cursor with slight lag (smooth, 0ms delay)
2. Invalid zones: target grays out, cursor changes (not-allowed)
3. Valid zones: target pulses green border (500ms cycle)
```

### Drop

```
Valid:
1. Scale: 1.03 → 1 (100ms, spring)
2. Shadow: shadow-lg → shadow (100ms)
3. Target zone: brief green flash (200ms)
4. Toast appears confirming action (delayed 100ms)

Invalid:
1. Snap back animation to original position (250ms, spring)
2. Scale returns to 1 (100ms)
3. Subtle shake if near valid zone (to indicate "close, but not quite")
```

---

## 11. Page Transitions

### List → Detail (Forward)

```
1. List item slightly highlights (80ms)
2. New page content: 
   - slide in from right: translateX(20px) → 0 (200ms)
   - fade in: opacity 0 → 1 (200ms)
3. Header appears from top: translateY(-10px) → 0 (150ms)
```

### Detail → List (Back)

```
1. Detail page: slide right: translateX(0) → translateX(20px) (150ms)
2. Fade: opacity 1 → 0 (150ms)
3. Previous list page already in DOM, just becomes visible again
```

---

## 12. Badge/Status Changes

### Status Transition (e.g., Pending → Confirmed)

```
1. Badge color transitions:
   - amber → blue (200ms)
   - Intermediate tint briefly visible
2. Small scale bounce: 1 → 1.15 → 1 (200ms)
3. Icon transitions if applicable:
   - clock → checkmark: old icon fades out (80ms), new icon fades in (80ms)
```

### Notification Badge

```
1. Badge appears: scale 0 → 1 with bounce (200ms spring)
2. If incrementing: badge briefly pulses (300ms)
3. If decrementing: badge shrinks if going to 0, otherwise just number changes
```

---

## 13. Skeleton Loading (Shimmer)

```
1. Skeleton shapes appear immediately (no animation on first paint)
2. Shimmer starts after 200ms delay:
   - Gradient sweep left to right (1.5s cycle)
   - Gradient colors: neutral-200 → white → neutral-200 (light)
                             neutral-700 → neutral-600 → neutral-700 (dark)
3. On data load:
   - Content fades in (200ms)
   - Skeleton fades out (200ms)
   - No layout shift (same dimensions)
```

---

## 14. Scroll-Triggered Animations

### Pull to Refresh (Mobile)

```
1. User pulls down past top of list
2. Spinner appears, rotating as pull distance increases
3. At threshold (60px): "Release to refresh" text, spinner full rotation
4. On release:
   - Spinner continues rotating (600ms)
   - Data refreshes
   - On complete: spinner fades out, list returns to position (200ms)
```

### Infinite Scroll

```
1. User scrolls near bottom (80% threshold)
2. Loading spinner appears at bottom (fade in, 200ms)
3. New content loads
4. Content slides in from bottom (translateY(10px) → 0, 150ms)
5. Loading spinner fades out (80ms)
```

---

## 15. Reduced Motion

When `prefers-reduced-motion: reduce` is detected:

| Animation | Replacement |
|-----------|-------------|
| Slide transitions | Instant (no animation) |
| Scale/bounce | Instant (no animation) |
| Shimmer | Static skeleton (no gradient sweep) |
| Rotate | No rotation |
| Fade transitions | Instant |
| Drag animations | Snap to position (no easing) |
| Toast slide | Simple fade in/out |

---

## Performance Budget for Animations

| Metric | Budget |
|--------|--------|
| Frame rate | 60fps (16ms per frame) |
| Max duration | 300ms (micro-interaction), 500ms (page transition) |
| GPU-accelerated properties only | `opacity`, `transform` |
| Avoid animating | `width`, `height`, `top`, `left`, `margin`, `padding` |

---

## Cross-References

- [interaction-design.md](./interaction-design.md) — Broader interaction flows
- [accessibility.md](./accessibility.md) — Reduced motion support
- [component-library.md](./component-library.md) — Component animation hooks
