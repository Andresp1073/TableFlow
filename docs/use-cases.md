# Use Cases

## UC-001: Customer Makes a Reservation

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-001 |
| **Name** | Make Reservation |
| **Actors** | Receptionist (on behalf of customer), Customer (future self-service) |
| **Description** | User books a table for a specific date, time, and party size. |
| **Preconditions** | User is authenticated. Restaurant info and table configuration exist. |
| **Main Flow** | 1. User selects branch, date, time, and party size. 2. System searches for available tables. 3. System displays available time slots. 4. User selects a time slot. 5. User enters or selects customer details. 6. User optionally assigns a specific table. 7. User submits the reservation. 8. System validates the booking. 9. System confirms the reservation and assigns a confirmation code. 10. System sends a confirmation email. |
| **Alternative Flow** | 3a. No tables available: System informs user and suggests alternative dates/times. 6a. Auto-assign: System assigns the best available table. 8a. Validation failure: System displays error and requests correction. |
| **Postconditions** | Reservation is created with status "pending" (or "confirmed" if configured). Confirmation is sent. Table is blocked for the duration. |

---

## UC-002: Modify Reservation

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-002 |
| **Name** | Modify Reservation |
| **Actors** | Receptionist |
| **Description** | User changes the date, time, party size, or table of an existing reservation. |
| **Preconditions** | Reservation exists and is in "confirmed" or "pending" status. |
| **Main Flow** | 1. User searches and selects the reservation. 2. User selects the field to modify. 3. User enters the new value. 4. System validates the change (availability, capacity). 5. System updates the reservation. 6. System logs the modification in audit trail. 7. System sends a modification confirmation email. |
| **Alternative Flow** | 4a. New time/table unavailable: System informs user and suggests alternatives. |
| **Postconditions** | Reservation is updated. Old availability is restored. New slot is blocked. |

---

## UC-003: Cancel Reservation

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-003 |
| **Name** | Cancel Reservation |
| **Actors** | Receptionist |
| **Description** | User cancels an existing reservation. |
| **Preconditions** | Reservation exists and is not already canceled or completed. |
| **Main Flow** | 1. User searches and selects the reservation. 2. User selects cancel. 3. User enters a cancellation reason. 4. System confirms the cancellation. 5. System releases the table. 6. System logs the cancellation. 7. System sends a cancellation email. |
| **Alternative Flow** | 1a. Cancellation outside allowed window: System blocks cancellation and informs user. |
| **Postconditions** | Reservation status is "canceled". Table is available for booking. |

---

## UC-004: Check-In Guest

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-004 |
| **Name** | Check-In Guest |
| **Actors** | Receptionist |
| **Description** | Guest arrives at the restaurant and is checked in. |
| **Preconditions** | Reservation exists and is in "confirmed" status. |
| **Main Flow** | 1. User selects the reservation. 2. User clicks "Check In". 3. System records the arrival time. 4. System updates reservation status to "seated". 5. System updates table status to "occupied". |
| **Alternative Flow** | 1a. Guest arrived without reservation: Use UC-001 to create a walk-in reservation, then check in. |
| **Postconditions** | Reservation status is "seated". Table status is "occupied". |

---

## UC-005: Mark No-Show

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-005 |
| **Name** | Mark No-Show |
| **Actors** | Receptionist |
| **Description** | Guest does not arrive within the grace period and is marked as no-show. |
| **Preconditions** | Reservation is in "confirmed" status. Current time is past reservation time + grace period. |
| **Main Flow** | 1. User selects the reservation. 2. User clicks "Mark No-Show". 3. System updates reservation status to "no-show". 4. System releases the table. 5. System increments the customer's no-show counter. |
| **Postconditions** | Reservation status is "no-show". Table is released. Customer flagged if threshold exceeded. |

---

## UC-006: Check-Out Guest

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-006 |
| **Name** | Check-Out Guest |
| **Actors** | Waiter, Receptionist |
| **Description** | Guest finishes dining and the table is released. |
| **Preconditions** | Reservation is in "seated" status. |
| **Main Flow** | 1. User selects the reservation. 2. User clicks "Check Out". 3. System records the departure time. 4. System updates reservation status to "completed". 5. System updates table status to "cleaning". 6. After cleaning buffer, table status returns to "available". |
| **Postconditions** | Reservation status is "completed". Table returns to "available" after cleaning. |

---

## UC-007: Configure Restaurant

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-007 |
| **Name** | Configure Restaurant Settings |
| **Actors** | Restaurant Administrator |
| **Description** | User configures restaurant profile, hours, and policies. |
| **Preconditions** | User is authenticated as Restaurant Administrator. |
| **Main Flow** | 1. User navigates to Settings. 2. User updates restaurant name, contact info, logo. 3. User configures operating hours per day. 4. User sets reservation policies (cancellation window, advance booking, dining duration). 5. System saves and applies changes. |
| **Postconditions** | Restaurant configuration is updated. New settings affect future reservations. |

---

## UC-008: Manage Tables

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-008 |
| **Name** | Manage Tables |
| **Actors** | Restaurant Administrator |
| **Description** | User creates, edits, or removes tables in the restaurant floor plan. |
| **Preconditions** | User is authenticated as Restaurant Administrator. |
| **Main Flow** | 1. User navigates to Tables module. 2. User adds a new table with number, capacity, and zone. 3. User positions the table on the floor plan. 4. System validates and saves the table. 5. Alternatively, user selects an existing table to edit or delete. |
| **Alternative Flow** | 5a. Delete with active reservations: System prevents deletion and displays warning. |
| **Postconditions** | Table configuration is updated. Floor plan reflects changes. |

---

## UC-009: View Dashboard

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-009 |
| **Name** | View Dashboard |
| **Actors** | Restaurant Administrator, Receptionist |
| **Description** | User views key performance metrics and reservation overview. |
| **Preconditions** | User is authenticated. |
| **Main Flow** | 1. User navigates to Dashboard. 2. System displays: reservations today, covers count, occupancy rate, upcoming reservations, peak hours chart. 3. User can filter by date range or branch. |
| **Postconditions** | Dashboard data is displayed. |

---

## UC-010: Generate Report

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-010 |
| **Name** | Generate Report |
| **Actors** | Restaurant Administrator |
| **Description** | User generates and exports a performance report. |
| **Preconditions** | User is authenticated as Restaurant Administrator. Reservation data exists. |
| **Main Flow** | 1. User navigates to Reports. 2. User selects report type (daily, weekly, monthly). 3. User selects date range and branch. 4. System generates the report. 5. User exports as PDF or CSV. |
| **Postconditions** | Report is generated and downloaded. |

---

## UC-011: Manage Staff Accounts

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-011 |
| **Name** | Manage Staff Accounts |
| **Actors** | Restaurant Administrator |
| **Description** | User creates, modifies, or deactivates staff accounts. |
| **Preconditions** | User is authenticated as Restaurant Administrator. |
| **Main Flow** | 1. User navigates to Staff Management. 2. User creates a new account with name, email, role. 3. System sends invitation email with setup link. 4. Alternatively, user edits or deactivates an existing account. |
| **Postconditions** | Staff account is created/modified. Invitation is sent if new. |

---

## UC-012: Login

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-012 |
| **Name** | User Login |
| **Actors** | All users |
| **Description** | User authenticates to access the system. |
| **Preconditions** | User account exists and is active. |
| **Main Flow** | 1. User navigates to login page. 2. User enters email and password. 3. System validates credentials. 4. System issues access and refresh tokens. 5. System redirects user to dashboard. |
| **Alternative Flow** | 3a. Invalid credentials: System displays error. If 5 consecutive failures, account is locked. 3b. Account locked: System displays lockout message. |
| **Postconditions** | User is authenticated. Tokens are stored securely. |

---

## UC-013: View Audit Logs

| Attribute | Detail |
|-----------|--------|
| **ID** | UC-013 |
| **Name** | View Audit Logs |
| **Actors** | Restaurant Administrator, System Administrator |
| **Description** | User views the audit trail of system actions. |
| **Preconditions** | User has audit log permissions. |
| **Main Flow** | 1. User navigates to Audit Logs. 2. User applies filters (date range, user, action type). 3. System displays matching log entries. 4. User can view details of each entry. |
| **Postconditions** | Audit log entries are displayed. |
