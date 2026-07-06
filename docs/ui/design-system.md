# Design System

**Last updated:** 2026-07-04

## Brand Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `primary-50` | #EFF6FF | #172554 | Hover backgrounds |
| `primary-100` | #DBEAFE | #1E3A5F | Selected rows |
| `primary-200` | #BFDBFE | #2563EB | Subtle accents |
| `primary-400` | #60A5FA | #60A5FA | Hover borders |
| `primary-500` | #3B82F6 | #3B82F6 | Default buttons, links |
| `primary-600` | #2563EB | #2563EB | Button hover |
| `primary-700` | #1D4ED8 | #93C5FD | Active |
| `primary-900` | #1E3A5F | #DBEAFE | Headings (dark) |

## Semantic Colors

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `success-500` | #22C55E | #22C55E | Confirmed, seated |
| `success-600` | #16A34A | #4ADE80 | Status badge |
| `warning-500` | #F59E0B | #F59E0B | Pending, awaiting |
| `warning-600` | #D97706 | #FBBF24 | Warning text |
| `error-500` | #EF4444 | #EF4444 | Cancelled, errors |
| `error-600` | #DC2626 | #F87171 | Error text, destructive |
| `info-500` | #3B82F6 | #60A5FA | Info messages |

## Neutral Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `neutral-50` | #F9FAFB | — | Page background |
| `neutral-100` | #F3F4F6 | #1F2937 | Card background |
| `neutral-200` | #E5E7EB | #374151 | Borders, dividers |
| `neutral-300` | #D1D5DB | #4B5563 | Disabled |
| `neutral-400` | #9CA3AF | #6B7280 | Placeholder text |
| `neutral-500` | #6B7280 | #9CA3AF | Secondary text |
| `neutral-700` | #374151 | #D1D5DB | Body text |
| `neutral-900` | #111827 | #F9FAFB | Heading text |

## Status Colors (Reservation)

| Status | Light Token | Dark Token |
|--------|-------------|------------|
| Pending | `warning-500` | `warning-400` |
| Confirmed | `primary-500` | `primary-400` |
| Seated | `success-500` | `success-400` |
| Completed | `neutral-500` | `neutral-400` |
| Cancelled | `error-500` | `error-400` |
| No-show | `error-500` | `error-400` |

## Typography

### Font Stack

```yaml
ui:
  font-family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
mono:
  font-family: "'JetBrains Mono', 'Fira Code', monospace"
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-xs` | 0.75rem (12px) | 400 | 1.5 | Caption, meta |
| `text-sm` | 0.875rem (14px) | 400 | 1.5 | Body small, table cells |
| `text-base` | 1rem (16px) | 400 | 1.5 | Body text |
| `text-lg` | 1.125rem (18px) | 500 | 1.5 | Large body |
| `text-xl` | 1.25rem (20px) | 600 | 1.4 | Section headings |
| `text-2xl` | 1.5rem (24px) | 700 | 1.3 | Page title |
| `text-3xl` | 1.875rem (30px) | 700 | 1.3 | Dashboard page title |
| `text-4xl` | 2.25rem (36px) | 800 | 1.2 | Hero text |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `regular` | 400 | Body, paragraphs |
| `medium` | 500 | Labels, buttons |
| `semibold` | 600 | Subheadings |
| `bold` | 700 | Headings |
| `extrabold` | 800 | Display |

## Spacing System

Based on a 4px grid.

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-0` | 0px | Reset |
| `spacing-1` | 4px | Tight gaps |
| `spacing-2` | 8px | Icon padding |
| `spacing-3` | 12px | Input padding |
| `spacing-4` | 16px | Card padding, gap |
| `spacing-5` | 20px | Section spacing |
| `spacing-6` | 24px | Layout gaps |
| `spacing-8` | 32px | Section margin |
| `spacing-10` | 40px | Page sections |
| `spacing-12` | 48px | Page padding |
| `spacing-16` | 64px | Large sections |

## Shadows

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.3)` | Cards |
| `shadow` | `0 1px 3px rgba(0,0,0,0.1)` | `0 1px 3px rgba(0,0,0,0.4)` | Dropdowns |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | `0 4px 6px rgba(0,0,0,0.4)` | Modals |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | `0 10px 15px rgba(0,0,0,0.5)` | Drawers |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | `0 20px 25px rgba(0,0,0,0.6)` | Toast |

## Borders

| Token | Value | Usage |
|-------|-------|-------|
| `border-default` | 1px solid | Default border |
| `border-thick` | 2px solid | Active/focus |
| `radius-sm` | 4px | Inputs, small elements |
| `radius-md` | 6px | Buttons, cards |
| `radius-lg` | 8px | Modals, drawers |
| `radius-xl` | 12px | Cards (dashboard) |
| `radius-full` | 9999px | Badges, avatars, pills |

## Breakpoints

| Token | Width | Target |
|-------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Ultra-wide |

## Dark Mode

- All components must support both light and dark modes
- Dark mode uses `prefers-color-scheme` media query + manual toggle
- System default + user override (stored in localStorage)
- Dark mode reduces brightness but maintains contrast ratios

## Cross-References

- [ui-tokens.md](./ui-tokens.md) — Complete design tokens reference
- [component-library.md](./component-library.md) — Component design
- [accessibility.md](./accessibility.md) — Color contrast requirements
