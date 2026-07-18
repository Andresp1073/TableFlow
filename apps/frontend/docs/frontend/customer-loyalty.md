# Customer Relationship & Loyalty Module

## Architecture

The Customer Relationship & Loyalty module follows the same feature-based architecture as the rest of TableFlow:

```
customers/
  presentation/          # Backend API layer (controllers + routes)
    controllers/
      CustomerController.ts
    routes/
      customers.routes.ts
  application/           # Existing CQRS application services
    services/
      CustomerApplicationService.ts
    commands/
      CreateCustomerCommand.ts
      UpdateCustomerCommand.ts
      ArchiveCustomerCommand.ts
    queries/
      GetCustomerQuery.ts
      ListCustomersQuery.ts
      FindCustomerByEmailQuery.ts
    dto/
      CustomerDTO.ts
      CustomerRequestDTO.ts
      CustomerSummary.ts
  domain/                # Existing domain models
    models/
      Customer.ts (interface)
      CustomerName.ts
      CustomerEmail.ts
      CustomerPhone.ts
      CustomerStatus.ts
      PreferredLanguage.ts

loyalty/
  presentation/          # Backend API layer (controllers + routes)
    controllers/
      LoyaltyController.ts
    routes/
      loyalty.routes.ts
  application/           # Existing application services
    services/
      LoyaltyManager.ts
      CustomerEngagementService.ts
    dtos/
      CustomerProfileDto.ts
      PointsTransactionDto.ts
      RewardDto.ts
  domain/                # Existing domain models
    models/
      CustomerProfile.ts
      PointsAccount.ts
      PointsTransaction.ts
      Reward.ts
      RewardRedemption.ts
      LoyaltyProgram.ts
      LoyaltyPolicy.ts
```

### Frontend Structure

```
src/
  lib/
    customer-types.ts     # Customer interfaces, enums, utilities
    loyalty-types.ts      # Loyalty interfaces, enums, utilities
  services/
    customers.ts          # Customer API service functions
    loyalty.ts            # Loyalty API service functions
  hooks/
    use-customers.ts      # TanStack Query hooks for customers
    use-loyalty.ts        # TanStack Query hooks for loyalty
  components/
    customers/
      dashboard/
        customer-dashboard-content.tsx
      list/
        customer-list.tsx
      profile/
        customer-profile-view.tsx
      form/
        customer-form.tsx
      shared/
        page-header.tsx
        status-badge.tsx
      __tests__/
        customer-types.test.ts
        customer-list.test.tsx
        customer-profile.test.tsx
        customer-dashboard.test.tsx
    loyalty/
      loyalty-dashboard-content.tsx
      reward-history-view.tsx
      __tests__/
        loyalty-types.test.ts
        loyalty-dashboard.test.tsx
        reward-history.test.tsx
  app/(protected)/
    customers/
      page.tsx              # Customer Dashboard
      list/page.tsx          # Customer List
      new/page.tsx           # Create Customer
      [customerId]/page.tsx  # Customer Profile
      [customerId]/edit/     # Edit Customer
    loyalty/
      page.tsx              # Loyalty Dashboard
      reward-history/       # Reward History
```

## Customer Lifecycle

1. **Create** → Customer is created with `active` status
2. **Update** → Profile info can be updated at any time
3. **Archive** → Customer is soft-deleted (archivedAt timestamp set)
4. **Restore** → Archived customer can be restored to active
5. **Tags** → Customers can be tagged for segmentation
6. **Notes** → Free-text notes can be added to customer profiles

## Loyalty Workflow

1. **Register** → Customer is enrolled in a loyalty program (creates CustomerProfile + PointsAccount)
2. **Earn Points** → Points are earned based on spend amount × program rate × tier multiplier
3. **Redeem Rewards** → Points are exchanged for available rewards
4. **Adjust Points** → Admin can adjust points (positive or negative) with reason
5. **Tier Changes** → Automatic evaluation on each earn transaction

## Permissions

### Customer Permissions
| Permission | Description |
|-----------|-------------|
| `restaurants.customers.create` | Create new customers |
| `restaurants.customers.read` | View customer profiles |
| `restaurants.customers.update` | Update customer information |
| `restaurants.customers.archive` | Archive/restore customers |

### Loyalty Permissions
| Permission | Description |
|-----------|-------------|
| `restaurants.loyalty.manage` | Manage loyalty programs |
| `restaurants.loyalty.redeem` | Process reward redemptions |
| `restaurants.loyalty.adjust` | Adjust points balances |

Unauthorized actions are hidden from the UI.

## API Integration

All endpoints are under `/restaurants/:id/`:

### Customers
```
GET    /restaurants/:id/customers/dashboard    Customer dashboard data
GET    /restaurants/:id/customers              List customers (paginated, filterable)
GET    /restaurants/:id/customers/:customerId  Get customer detail
POST   /restaurants/:id/customers              Create customer
PUT    /restaurants/:id/customers/:customerId  Update customer
PATCH  /restaurants/:id/customers/:customerId/archive  Archive customer
PATCH  /restaurants/:id/customers/:customerId/restore  Restore customer
POST   /restaurants/:id/customers/:customerId/notes    Add note
```

### Loyalty
```
GET    /restaurants/:id/loyalty/dashboard       Loyalty dashboard data
GET    /restaurants/:id/loyalty/rewards          List available rewards
POST   /restaurants/:id/loyalty/register         Register customer in loyalty program
GET    /restaurants/:id/loyalty/customers/:id    Get customer loyalty profile
POST   /restaurants/:id/loyalty/earn             Earn points
POST   /restaurants/:id/loyalty/redeem           Redeem reward
POST   /restaurants/:id/loyalty/adjust           Adjust points
GET    /restaurants/:id/loyalty/transactions/:id Transaction history
GET    /restaurants/:id/loyalty/birthdays        Birthday profiles
```

## State Management

- All API data is cached with TanStack Query
- Query key pattern: `['customers', resource, restaurantId, params]`
- Mutations invalidate relevant query keys on success
- Stale time: 30 seconds
- Retry policy: 2 retries

## Responsive Design

- Desktop: Full multi-column layouts, stat card grids
- Tablet: 2-column grids, scrollable tables
- Mobile: Single column, stacked cards, horizontal scroll on tables

## Accessibility

| Requirement | Implementation |
|------------|---------------|
| Keyboard navigation | All interactive elements are focusable |
| ARIA labels | Buttons, navigation, and form controls |
| Screen reader | Semantic HTML, proper heading hierarchy |
| Color contrast | WCAG 2.2 AA compliant |
| Focus indicators | Visible focus rings on all interactive elements |

## Testing

Tests cover:
- Utility functions (status colors, formatting, tier labels)
- Loading states (shimmer/skeleton)
- Error states (error messages with retry)
- Empty states (empty messages)
- Data rendering (customer names, emails, status badges)
- Archived/active status display
- Location/customer info display
