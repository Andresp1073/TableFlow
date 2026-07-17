# TableFlow Design System

## Architecture

The TableFlow Design System is a reusable UI component library built on:

- **Next.js 15** (App Router) — Application framework
- **React 19** — UI library
- **TypeScript** — Type safety
- **Tailwind CSS 3** — Utility-first styling
- **Radix UI** — Accessible headless primitives
- **shadcn/ui** — Component patterns
- **CVA** (Class Variance Authority) — Component variants
- **TanStack Table** — Data tables
- **React Hook Form + Zod** — Form validation
- **Lucide Icons** — Icon library
- **Framer Motion** — Animations (prepared)
- **Sonner** — Toast notifications

## Folder Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles + design tokens
├── components/
│   ├── ui/                     # Base UI components (atoms)
│   │   ├── __tests__/          # Component tests
│   │   ├── accordion.tsx
│   │   ├── alert.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── data-table.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── empty-state.tsx
│   │   ├── error-state.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── loading-state.tsx
│   │   ├── pagination.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio.tsx
│   │   ├── search-bar.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── spinner.tsx
│   │   ├── stat-card.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── tooltip.tsx
│   ├── layout/                 # Layout components
│   │   ├── app-shell.tsx
│   │   ├── content-area.tsx
│   │   ├── footer.tsx
│   │   ├── header.tsx
│   │   ├── page-wrapper.tsx
│   │   ├── responsive-container.tsx
│   │   ├── sidebar.tsx
│   │   └── top-navigation.tsx
├── features/                   # Feature modules (prepared, not implemented)
├── hooks/                      # Custom React hooks
│   ├── use-click-outside.ts
│   ├── use-debounce.ts
│   ├── use-keyboard.ts
│   ├── use-local-storage.ts
│   ├── use-media-query.ts
│   └── use-pagination.ts
├── lib/                        # Utilities
│   ├── cn.ts                   # Class name utility
│   ├── constants.ts            # App constants
│   ├── design-tokens.ts        # Token references
│   └── __tests__/
│       ├── cn.test.ts
│       └── setup.ts
├── providers/                  # React context providers
│   ├── query-provider.tsx      # TanStack Query
│   ├── theme-provider.tsx      # Light/Dark/System
│   └── toast-provider.tsx      # Sonner toasts
└── styles/                     # Legacy (use globals.css)
```

## Design Tokens

### Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | White | Slate 900 | Page background |
| `--foreground` | Slate 900 | White | Text color |
| `--primary` | Blue 600 | Blue 400 | Primary actions |
| `--secondary` | Slate 100 | Slate 800 | Secondary actions |
| `--muted` | Slate 100 | Slate 800 | Subtle backgrounds |
| `--accent` | Slate 100 | Slate 800 | Hover states |
| `--destructive` | Red 500 | Red 700 | Destructive actions |
| `--success` | Green 500 | Green 500 | Success states |
| `--warning` | Amber 500 | Amber 500 | Warning states |
| `--error` | Red 500 | Red 700 | Error states |
| `--info` | Cyan 700 | Cyan 700 | Info states |
| `--border` | Slate 200 | Slate 700 | Borders |
| `--input` | Slate 200 | Slate 700 | Input borders |
| `--ring` | Blue 600 | Blue 500 | Focus rings |

### Typography

- **Font Family**: Inter (system fallback)
- **Font Sizes**: 2xs (10px) through 5xl (36px)
- **Weights**: Normal (400), Medium (500), Semibold (600), Bold (700)

### Spacing Scale

Uses Tailwind's default spacing scale with additions: 0.5 (2px), 1.5 (6px), 2.5 (10px), 3.5 (14px), 4.5 (18px).

### Border Radius

| Token | Value |
|-------|-------|
| `none` | 0 |
| `xs` | 2px |
| `sm` | 4px |
| `DEFAULT` | 6px |
| `md` | 8px |
| `lg` | 10px |
| `xl` | 12px |
| `2xl` | 16px |
| `3xl` | 20px |
| `full` | 9999px |

### Elevation / Shadows

Uses CSS variables: `--shadow-xs` through `--shadow-2xl` with configurable opacity per theme.

### Z-Index Scale

| Layer | Value |
|-------|-------|
| dropdown | 1000 |
| sticky | 1020 |
| fixed | 1030 |
| modal | 1040 |
| popover | 1050 |
| tooltip | 1060 |
| toast | 1070 |

## Themes

- **Light** — Default, full color spectrum
- **Dark** — Inverted colors, reduced contrast
- **System** — Follows `prefers-color-scheme`
- **High Contrast** — Maximum contrast for accessibility (prepared)

Theme is controlled via `ThemeProvider` and persisted in `localStorage`.

## Component Catalog

### Base Components

| Component | Radix Primitive | Variants | Description |
|-----------|----------------|----------|-------------|
| Button | Slot | primary, secondary, outline, ghost, danger, success, link | Action trigger with loading state |
| Badge | — | default, secondary, outline, success, warning, danger, info | Status indicator |
| Card | — | — | Content container with header/content/footer |
| Input | — | error | Text input field |
| Textarea | — | error | Multi-line text input |
| Select | Select | — | Dropdown selection |
| Checkbox | Checkbox | — | Binary selection |
| Radio | RadioGroup | — | Single selection from group |
| Switch | Switch | — | Toggle control |
| Avatar | Avatar | — | User/profile image |
| Alert | — | info, success, warning, error | Notification banner |
| Skeleton | — | — | Loading placeholder |
| Spinner | — | sm, md, lg, xl | Loading indicator |
| Progress | Progress | — | Progress bar |
| Label | Label | — | Form label |

### Overlay Components

| Component | Radix Primitive | Description |
|-----------|----------------|-------------|
| Tooltip | Tooltip | Hover tooltip |
| Popover | Popover | Click popover |
| DropdownMenu | DropdownMenu | Context menu |
| Dialog | Dialog | Modal dialog |
| Drawer | Vaul | Mobile drawer |
| Sheet | Dialog | Side panel |

### Navigation Components

| Component | Description |
|-----------|-------------|
| Tabs | Tabbed content |
| Accordion | Expandable sections |
| Breadcrumb | Page hierarchy |
| Pagination | Page navigation |

### Form Components

| Component | Description |
|-----------|-------------|
| FormField | Field context wrapper |
| FormItem | Field container |
| FormLabel | Accessible label |
| FormControl | Form control wrapper |
| FormDescription | Helper text |
| FormMessage | Validation error |
| FormRequiredIndicator | Required asterisk |

### Data Components

| Component | Description |
|-----------|-------------|
| DataTable | Sortable, searchable, paginated table |
| SearchBar | Debounced search input |
| EmptyState | Empty data display |
| LoadingState | Loading indicator with message |
| ErrorState | Error display with retry |
| StatCard | Metric display card |

### Layout Components

| Component | Description |
|-----------|-------------|
| AppShell | Full app layout with sidebar + header |
| Sidebar | Collapsible navigation sidebar |
| Header | Top header bar |
| TopNavigation | Secondary tab navigation |
| Footer | Page footer |
| ContentArea | Scrollable content region |
| ResponsiveContainer | Max-width content wrapper |
| PageWrapper | Page layout with title + actions |

## Accessibility Guidelines

### Standards Followed

- **WCAG 2.2 AA** — All components meet Level AA requirements
- **Keyboard Navigation** — All interactive elements are keyboard accessible
- **ARIA Labels** — Proper aria attributes on all components
- **Focus Management** — Visible focus indicators on all interactive elements
- **Screen Readers** — Semantic HTML, role attributes, live regions

### Implementation Practices

1. **Focus Indicators**: All interactive elements use `focus-visible:ring-2` with `--ring` color
2. **Color Contrast**: All color combinations meet WCAG AA contrast ratios
3. **Reduced Motion**: Respects `prefers-reduced-motion` via Tailwind's `motion-safe:` variants
4. **Form Labels**: All form controls have associated labels via `htmlFor`/`id`
5. **Error Announcements**: Form errors use `role="alert"` for screen reader announcement
6. **Loading States**: Spinners have `role="status"` and `aria-label`
7. **Images**: Avatars use `alt` attributes via Radix primitives

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Tab | Navigate between interactive elements |
| Enter/Space | Activate element |
| Escape | Close overlay, dialog, popover |
| Arrow keys | Navigate within list/group |

## Usage Guidelines

### Import Convention

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

### Tailwind Usage

Components use Tailwind utility classes with CSS variables for theming. Custom classes are composed within CVA variant definitions. Use `cn()` for merging className prop.

### Theming

```tsx
import { useTheme } from '@/providers/theme-provider';

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return <button onClick={() => setTheme('dark')}>Dark mode</button>;
}
```

### Testing

```bash
# Run component tests
pnpm --filter @tableflow/frontend exec vitest run

# Run tests in watch mode
pnpm --filter @tableflow/frontend exec vitest
```
