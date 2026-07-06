# Modules

## M1: Authentication

Handles user identity verification and session management.

**Key Features:**
- Registration with email verification
- Login with JWT access + refresh tokens
- Password reset flow
- Account lockout after failed attempts
- Single sign-out and global session invalidation

**Relationships:** All modules depend on this module for access control.

---

## M2: User Management

Manages user profiles and account lifecycle.

**Key Features:**
- User listing, filtering, search
- Profile editing
- Account activation/deactivation
- Last login tracking
- Staff invitation workflow

**Relationships:** Depends on Authentication. Works with Roles & Permissions.

---

## M3: Roles & Permissions

Defines access control policies across the system.

**Key Features:**
- Pre-defined roles (Customer, Waiter, Receptionist, Restaurant Admin, System Admin)
- Custom role creation
- Granular permission assignment
- Permission validation on every protected action

**Relationships:** Used by User Management to assign roles. Enforced by all modules.

---

## M4: Restaurants

Manages restaurant organizations and branches.

**Key Features:**
- Restaurant profile creation and editing
- Multi-branch management
- Operating hours configuration (regular and holiday)
- Reservation policy configuration (advance window, slot intervals, dining duration)
- Time zone and locale settings per branch

**Relationships:** Contains Tables, Reservations, Customers. Uses Settings.

---

## M5: Tables

Configures the physical table layout of each branch.

**Key Features:**
- Table CRUD with capacity and location
- Zone / section grouping (patio, indoor, bar, VIP)
- Visual floor plan with drag-and-drop positioning
- Table status management (available, occupied, reserved, cleaning, out of service)
- Table merging and splitting
- Real-time availability display

**Relationships:** Belongs to Restaurants. Used by Reservations.

---

## M6: Reservations

Core module that manages the entire reservation lifecycle.

**Key Features:**
- Reservation creation with customer info, date, time, party size
- Table assignment (manual or auto-assign)
- Real-time slot availability search
- Modification and cancellation with reason tracking
- Check-in, check-out, no-show marking
- Walk-in reservation support
- Recurring reservation support
- Daily, weekly, monthly calendar views
- Reservation filtering and search
- Internal notes and special requests

**Relationships:** Depends on Tables for availability. Interacts with Customers and Notifications.

---

## M7: Customers

Maintains the customer database and visit history.

**Key Features:**
- Customer profile CRUD
- Duplicate profile detection and merging
- Visit history with dates, tables, party sizes
- Preference tracking (favorite table, allergies, special occasions)
- No-show and cancellation counting
- Auto-creation from reservation data

**Relationships:** Used by Reservations. Provides data to Reports.

---

## M8: Notifications

Manages automated communications with customers and staff.

**Key Features:**
- Email confirmation on reservation creation
- Email reminder 24 hours before booking
- Email on modification and cancellation
- In-app notifications for staff
- Configurable notification preferences per branch
- Notification templates

**Relationships:** Triggered by Reservations. Configured in Settings.

---

## M9: Reports & Analytics

Provides business intelligence through data aggregation.

**Key Features:**
- Dashboard with real-time KPIs (occupancy, covers, reservations)
- Daily, weekly, monthly performance reports
- Peak hours analysis
- No-show rate tracking
- Average party size and turn time
- Top customers by frequency
- Cancellation reason breakdown
- CSV and PDF export

**Relationships:** Data sourced from Reservations, Customers, Tables.

---

## M10: Dashboard

Central landing page displaying real-time operational overview.

**Key Features:**
- Today's reservation count and progress
- Current occupancy rate
- Upcoming reservations list
- Table status summary
- Quick actions (create reservation, check-in)
- Peak hours chart
- Branch selector (multi-branch)

**Relationships:** Aggregates data from Reservations, Tables, Reports.

---

## M11: Settings

Centralized configuration for restaurant-level and system-level settings.

**Key Features:**
- General settings (name, contact, time zone)
- Reservation policies (cancellation window, grace period, max party size)
- Notification preferences
- Business hours configuration
- Holiday and special hours management
- Account preferences (password change, language)

**Relationships:** Consumed by Reservations, Notifications, Tables modules.

---

## M12: Audit Logs

Provides complete traceability of all system actions.

**Key Features:**
- Automatic logging of CRUD operations on critical entities
- Authentication event logging
- Configuration change tracking
- Advanced filtering (date range, user, action type, resource)
- Immutable log entries
- 12-month retention policy
- Detail view with before/after values on updates

**Relationships:** Integrated with all modules for event capture.
