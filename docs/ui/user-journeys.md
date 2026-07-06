# User Journeys

**Last updated:** 2026-07-04

## 1. Customer Making a Reservation

### Entry Points
- Google search → Online booking widget
- Restaurant website → Book a table CTA
- Direct link (QR code at restaurant)
- TableFlow customer portal

### Journey Flow

```
Step 1: Landing / Widget
  ├── Select: party size, date, time
  ├── System shows available slots
  └── Customer picks a time slot

Step 2: Customer Info
  ├── Name, email, phone (returning: pre-filled)
  ├── Special requests (optional)
  └── Confirm booking

Step 3: Confirmation
  ├── Success animation
  ├── Confirmation code displayed
  ├── Email/SMS confirmation sent
  └── Option to add to calendar

Step 4: Pre-visit
  ├── Reminder email/SMS (24h before)
  ├── Option to modify/cancel
  └── Link to restaurant info

Step 5: Post-visit
  ├── Thank-you notification
  └── (Future: review prompt)
```

### Screens Involved
- Public widget (embedded)
- Confirmation page
- Email/SMS templates

### Error States
- No slots available → Suggest alternative dates/times
- Duplicate booking → Show existing reservation
- Form validation → Inline errors per field

---

## 2. Receptionist Managing Reservations

### Primary Context
Receptionist works at the host stand, manages phone and walk-in reservations, and seats guests.

### Journey Flow

```
Step 1: Dashboard (default view)
  ├── Today's reservations list
  ├── Upcoming arrivals (next 2 hours)
  ├── Walk-in button (quick create)
  └── Search bar (customer name / confirmation code)

Step 2: Walk-in / Phone Reservation
  ├── Search/create customer
  ├── Select party size
  ├── Show available tables
  ├── Assign table
  └── Confirm (reservation created + toast)

Step 3: Guest Arrives
  ├── Find reservation in list
  ├── Click "Check-in"
  ├── System assigns/confirms table
  └── Guest marked as SEATED

Step 4: Modify / Cancel
  ├── Select reservation
  ├── Change time, party size, table
  ├── Or cancel with reason
  └── Confirmation dialog

Step 5: No-show processing
  ├── End of shift review
  ├── Mark no-shows in bulk or individually
  └── System flags customer
```

### Screens Involved
- Dashboard (today view)
- Reservation list
- Create reservation modal
- Table floor plan
- Customer search modal

### Key UX Requirements
- One-click check-in
- Quick customer search (type-ahead)
- Table recommendation on reservation create

---

## 3. Restaurant Admin Managing Operations

### Primary Context
Admin configures the restaurant, manages users, views reports, and handles long-term planning.

### Journey Flow

```
Step 1: Login → Dashboard
  ├── KPI widgets (today's covers, occupancy, reservations)
  ├── Quick links to common tasks
  └── Alerts (low availability, staff shortages)

Step 2: Branch Management
  ├── List branches → Select branch
  ├── Edit hours, policies, dining duration
  ├── View branch dashboard
  └── Manage branch staff

Step 3: User Management
  ├── List staff users
  ├── Create / invite new user
  ├── Assign roles and branch access
  └── Disable / enable accounts

Step 4: Reports
  ├── Daily / period summary
  ├── Export to CSV
  ├── Occupancy trends
  └── Customer insights

Step 5: Settings
  ├── Organization profile
  ├── Booking policies
  ├── Notification templates
  ├── Integration configuration
  └── Webhook management
```

### Screens Involved
- Admin dashboard
- Branch list + detail
- User list + create/edit
- Reports (daily, period, export)
- Settings pages (org, policies, integrations)

---

## 4. Waiter Viewing Assigned Tables

### Primary Context
Waiter uses a tablet or mobile device to see their section, manage table status, and provide service.

### Journey Flow

```
Step 1: Login → Waiter Dashboard
  ├── Assigned tables/section highlighted
  ├── Table status grid (color-coded)
  └── Today's total covers

Step 2: Table Interaction
  ├── Tap table → See reservation details
  ├── Party size, special requests
  ├── Time seated
  └── Actions: Mark ready for checkout

Step 3: Service Actions
  ├── Notify host when table finished
  ├── Request table cleaning
  └── Flag VIP / special occasions
```

### Screens Involved
- Floor plan view
- Table detail panel

---

## 5. Authentication Flow

### Journey Flow

```
Step 1: Login
  ├── Email + password form
  ├── "Remember me" checkbox
  ├── Forgot password link
  └── Submit → JWT stored

Step 2: Forgot Password
  ├── Enter email
  ├── Success message (always show to prevent enumeration)
  ├── Email with reset link
  └── Reset password form (token + new password)

Step 3: Registration (new org)
  ├── Org name, admin name, email, phone, password
  ├── Welcome tour on first login
  └── Create first branch

Step 4: Session Management
  ├── Auto-refresh access token
  ├── Logout → Clear tokens
  └── Session timeout warning (15 min idle)
```

### Screens Involved
- Login page
- Registration page
- Forgot/reset password
- Email templates

---

## Cross-References

- [information-architecture.md](./information-architecture.md) — Page structure
- [reservation-flow-ui.md](./reservation-flow-ui.md) — Detailed reservation UI
- [dashboard-design.md](./dashboard-design.md) — Dashboard layout
- [table-management-ui.md](./table-management-ui.md) — Floor plan UX
- [admin-panel-ui.md](./admin-panel-ui.md) — Admin screens
