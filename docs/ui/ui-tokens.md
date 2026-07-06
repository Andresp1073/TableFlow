# UI Tokens

**Last updated:** 2026-07-04

## 1. Color Tokens

### Primary

```yaml
primary-50:   "#EFF6FF"
primary-100:  "#DBEAFE"
primary-200:  "#BFDBFE"
primary-300:  "#93C5FD"
primary-400:  "#60A5FA"
primary-500:  "#3B82F6"
primary-600:  "#2563EB"
primary-700:  "#1D4ED8"
primary-800:  "#1E40AF"
primary-900:  "#1E3A5F"
```

### Success

```yaml
success-50:   "#F0FDF4"
success-100:  "#DCFCE7"
success-400:  "#4ADE80"
success-500:  "#22C55E"
success-600:  "#16A34A"
success-700:  "#15803D"
```

### Warning

```yaml
warning-50:   "#FFFBEB"
warning-100:  "#FEF3C7"
warning-400:  "#FBBF24"
warning-500:  "#F59E0B"
warning-600:  "#D97706"
warning-700:  "#B45309"
```

### Error

```yaml
error-50:     "#FEF2F2"
error-100:    "#FEE2E2"
error-400:    "#F87171"
error-500:    "#EF4444"
error-600:    "#DC2626"
error-700:    "#B91C1C"
```

### Neutral

```yaml
neutral-50:   "#F9FAFB"
neutral-100:  "#F3F4F6"
neutral-200:  "#E5E7EB"
neutral-300:  "#D1D5DB"
neutral-400:  "#9CA3AF"
neutral-500:  "#6B7280"
neutral-600:  "#4B5563"
neutral-700:  "#374151"
neutral-800:  "#1F2937"
neutral-900:  "#111827"
```

### Dark Mode Overrides

```yaml
dark:
  neutral-50:   "#111827"
  neutral-100:  "#1F2937"
  neutral-200:  "#374151"
  neutral-300:  "#4B5563"
  neutral-400:  "#6B7280"
  neutral-500:  "#9CA3AF"
  neutral-600:  "#D1D5DB"
  neutral-700:  "#E5E7EB"
  neutral-800:  "#F3F4F6"
  neutral-900:  "#F9FAFB"
```

---

## 2. Typography Tokens

### Font Families

```yaml
font-sans:  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
font-mono:  "'JetBrains Mono', 'Fira Code', monospace"
```

### Font Sizes

```yaml
text-xs:     "0.75rem"    # 12px
text-sm:     "0.875rem"   # 14px
text-base:   "1rem"       # 16px
text-lg:     "1.125rem"   # 18px
text-xl:     "1.25rem"    # 20px
text-2xl:    "1.5rem"     # 24px
text-3xl:    "1.875rem"   # 30px
text-4xl:    "2.25rem"    # 36px
```

### Font Weights

```yaml
font-normal:   "400"
font-medium:   "500"
font-semibold: "600"
font-bold:     "700"
font-extrabold: "800"
```

### Line Heights

```yaml
leading-none:   "1"
leading-tight:  "1.25"
leading-normal: "1.5"
leading-relaxed: "1.625"
leading-loose:  "2"
```

---

## 3. Spacing Tokens

```yaml
spacing-0:    "0px"
spacing-px:   "1px"
spacing-0.5:  "2px"
spacing-1:    "4px"
spacing-1.5:  "6px"
spacing-2:    "8px"
spacing-2.5:  "10px"
spacing-3:    "12px"
spacing-3.5:  "14px"
spacing-4:    "16px"
spacing-5:    "20px"
spacing-6:    "24px"
spacing-7:    "28px"
spacing-8:    "32px"
spacing-9:    "36px"
spacing-10:   "40px"
spacing-11:   "44px"
spacing-12:   "48px"
spacing-14:   "56px"
spacing-16:   "64px"
spacing-20:   "80px"
spacing-24:   "96px"
```

---

## 4. Border Radius Tokens

```yaml
radius-none:  "0px"
radius-sm:    "4px"
radius-md:    "6px"
radius-lg:    "8px"
radius-xl:    "12px"
radius-2xl:   "16px"
radius-3xl:   "24px"
radius-full:  "9999px"
```

---

## 5. Shadow Tokens

```yaml
shadow-sm:
  light: "0 1px 2px rgba(0,0,0,0.05)"
  dark:  "0 1px 2px rgba(0,0,0,0.3)"
shadow:
  light: "0 1px 3px rgba(0,0,0,0.1)"
  dark:  "0 1px 3px rgba(0,0,0,0.4)"
shadow-md:
  light: "0 4px 6px rgba(0,0,0,0.1)"
  dark:  "0 4px 6px rgba(0,0,0,0.4)"
shadow-lg:
  light: "0 10px 15px rgba(0,0,0,0.1)"
  dark:  "0 10px 15px rgba(0,0,0,0.5)"
shadow-xl:
  light: "0 20px 25px rgba(0,0,0,0.15)"
  dark:  "0 20px 25px rgba(0,0,0,0.6)"
shadow-inner:
  light: "inset 0 2px 4px rgba(0,0,0,0.05)"
```

---

## 6. Z-Index Tokens

```yaml
z-dropdown:   "30"
z-modal:      "40"
z-toast:      "50"
z-loading:    "60"
z-tooltip:    "70"
```

---

## 7. Transition Tokens

```yaml
transition-fast:     "150ms ease"
transition-base:     "200ms ease"
transition-slow:     "300ms ease"
transition-modal:    "200ms cubic-bezier(0.16, 1, 0.3, 1)"
transition-spring:   "300ms cubic-bezier(0.34, 1.56, 0.64, 1)"
```

---

## 8. Breakpoint Tokens

```yaml
breakpoints:
  xs:  "0px"
  sm:  "640px"
  md:  "768px"
  lg:  "1024px"
  xl:  "1280px"
  2xl: "1536px"
```

---

## 9. Component-Specific Tokens

### Sidebar

```yaml
sidebar:
  width-expanded:   "280px"
  width-collapsed:  "64px"
  background:       "neutral-50"  # light / "neutral-800" dark
  item-height:      "44px"
  item-padding:     "spacing-3 spacing-4"
  border:           "1px solid neutral-200"
```

### Top Bar

```yaml
topbar:
  height:           "56px"
  background:       "white"       # light / "neutral-900" dark
  border-bottom:    "1px solid neutral-200"
```

### Card

```yaml
card:
  padding:          "spacing-4"
  border-radius:    "radius-lg"
  background:       "white"       # light / "neutral-800" dark
  border:           "1px solid neutral-200"
  shadow:           "shadow-sm"
```

### Modal

```yaml
modal:
  padding:          "spacing-6"
  border-radius:    "radius-xl"
  overlay:          "rgba(0,0,0,0.5)"
  max-width-sm:     "400px"
  max-width-md:     "560px"
  max-width-lg:     "720px"
  fullscreen-gap:   "spacing-4"
```

### Table

```yaml
table:
  cell-padding:     "spacing-3 spacing-4"
  row-height:       "56px"
  header-height:    "44px"
  row-hover:        "primary-50"  # light / "neutral-700" dark
  border:           "1px solid neutral-200"
  radius:           "radius-lg"
```

---

## 10. Icon Tokens

```yaml
icon-sizes:
  xs:   "14px"
  sm:   "16px"
  md:   "20px"
  lg:   "24px"
  xl:   "32px"
```

---

## Cross-References

- [design-system.md](./design-system.md) — Design rationale and usage
- [component-library.md](./component-library.md) — Component-specific tokens
- [interaction-design.md](./interaction-design.md) — Transition token usage
