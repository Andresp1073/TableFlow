# Admin App Shell

## Architecture

The Admin App Shell provides the foundational layout for all authenticated pages in TableFlow. Built on top of the Design System, it implements a responsive sidebar + header layout with navigation, theming, and state management.

## Layouts

### Route Groups

```
app/
├── (public)/              # Public routes (login, etc.)
│   └── layout.tsx         # Minimal layout
├── (protected)/           # Authenticated routes
│   ├── layout.tsx         # Wraps with ProtectedLayout
│   ├── dashboard/
│   ├── restaurants/
│   ├── reservations/
│   ├── dining-areas/
│   ├── tables/
│   ├── orders/
│   ├── kitchen/
│   ├── inventory/
│   ├── customers/
│   ├── payments/
│   ├── analytics/
│   └── settings/
├── layout.tsx             # Root layout (fonts, providers)
├── page.tsx               # Redirects to /dashboard
├── error.tsx              # Global error boundary
├── loading.tsx            # Global loading state
└── not-found.tsx          # 404 page
```

### Stack

```
RootLayout
├── ThemeProvider
├── QueryProvider
├── ToastProvider
│
├── (public)
│   └── PublicLayout (minimal)
│
└── (protected)
    └── ProtectedLayout
        ├── RestaurantProvider
        ├── SidebarProvider
        ├── BreadcrumbProvider
        ├── NotificationProvider
        │
        └── AdminAppShell
            ├── AppSidebar
            │   ├── Logo (links to /dashboard)
            │   ├── Nav sections (6 groups, 13 items)
            │   └── Collapse button
            ├── AdminHeader
            │   ├── Mobile menu toggle
            │   ├── RestaurantSelector
            │   ├── BreadcrumbManager
            │   ├── GlobalSearch (Cmd+K)
            │   ├── Theme toggle
            │   ├── NotificationBell
            │   └── UserMenu
            └── <main> (children)
```

## Navigation

### Menu Structure

The sidebar navigation is defined in `src/components/navigation/nav-config.tsx` and organized into 6 sections:

| Section | Items |
|---------|-------|
| Overview | Dashboard |
| Operations | Restaurants, Reservations, Dining Areas, Tables |
| Service | Orders, Kitchen, Inventory |
| People | Customers |
| Finance | Payments, Analytics |
| System | Settings |

### Active State

The sidebar uses `usePathname()` to determine the active item. An item is active when the current pathname matches exactly or starts with the item's href.

### Responsive Behavior

| Breakpoint | Sidebar |
|------------|---------|
| Desktop (>=1024px) | Fixed sidebar, collapsible (60px/240px) |
| Tablet (768-1023px) | Fixed sidebar, collapsible |
| Mobile (<768px) | Slide-in drawer (Sheet) |

## Header Components

### BreadcrumbManager
Auto-generates breadcrumbs based on the current pathname. Maps path segments to navigation labels using `getNavItemByHref()`.

### GlobalSearch
Cmd+K search dialog. Currently a placeholder UI — no search logic implemented.

### RestaurantSelector
Dropdown to switch between restaurant contexts. Uses `RestaurantProvider` state.

### NotificationBell
Dropdown with notification list. Uses `NotificationProvider` state.

### UserMenu
Dropdown with profile, settings, help, and sign out options.

## Providers

| Provider | State | Purpose |
|----------|-------|---------|
| SidebarProvider | collapsed, mobileOpen | Sidebar collapse/mobile state |
| BreadcrumbProvider | items | Current breadcrumb trail |
| RestaurantProvider | current, restaurants | Current restaurant context |
| NotificationProvider | notifications | In-app notification state |

## File Structure

```
src/
├── app/
│   ├── (protected)/
│   │   ├── layout.tsx
│   │   ├── placeholder-page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── restaurants/page.tsx
│   │   ├── reservations/page.tsx
│   │   ├── dining-areas/page.tsx
│   │   ├── tables/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── kitchen/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── customers/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── settings/page.tsx
│   ├── (public)/layout.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── error.tsx
│   ├── loading.tsx
│   └── not-found.tsx
├── components/
│   ├── layout/
│   │   ├── admin-app-shell.tsx
│   │   ├── admin-header.tsx
│   │   ├── app-sidebar.tsx
│   │   ├── breadcrumb-manager.tsx
│   │   ├── global-search.tsx
│   │   ├── notification-bell.tsx
│   │   ├── protected-layout.tsx
│   │   ├── restaurant-selector.tsx
│   │   └── user-menu.tsx
│   └── navigation/
│       ├── nav-config.tsx
│       ├── nav-types.ts
│       └── __tests__/nav-config.test.ts
├── providers/
│   ├── sidebar-provider.tsx
│   ├── breadcrumb-provider.tsx
│   ├── restaurant-provider.tsx
│   ├── notification-provider.tsx
│   └── __tests__/
│       ├── sidebar-provider.test.tsx
│       ├── breadcrumb-provider.test.tsx
│       ├── restaurant-provider.test.tsx
│       └── notification-provider.test.tsx
```

## Accessibility

- Sidebar uses `aria-label="Sidebar navigation"` on `<nav>`
- Active items use `aria-current="page"`
- Collapse/expand button uses descriptive `aria-label`
- Mobile drawer uses proper dialog semantics
- Search dialog uses `Dialog` with proper ARIA attributes
- Theme toggle uses `aria-label`
- Notification bell announces unread count
- Keyboard: Tab navigation, Cmd+K for search, Escape for overlays

## Future Enhancements

- [ ] Search logic integration
- [ ] API-connected restaurant list
- [ ] Real notification polling
- [ ] User authentication flow
- [ ] Nested sidebar navigation
- [ ] Sidebar item permissions based on roles
