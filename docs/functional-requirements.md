# Functional Requirements

## Module: Authentication & Authorization

| ID | Requirement |
|----|-------------|
| FR-001 | The system shall allow users to register with email and password. |
| FR-002 | The system shall require email verification before first login. |
| FR-003 | The system shall allow users to log in using email and password. |
| FR-004 | The system shall issue a JWT access token upon successful authentication. |
| FR-005 | The system shall issue a refresh token for session renewal. |
| FR-006 | The system shall invalidate tokens upon user logout. |
| FR-007 | The system shall enforce password complexity requirements (min 8 chars, uppercase, lowercase, number, symbol). |
| FR-008 | The system shall allow users to request a password reset link via email. |
| FR-009 | The system shall allow users to update their password when authenticated. |
| FR-010 | The system shall lock an account after 5 consecutive failed login attempts. |
| FR-011 | The system shall unlock an account after 30 minutes or via admin action. |
| FR-012 | The system shall allow administrators to create staff user accounts. |
| FR-013 | The system shall assign a default role to newly created staff accounts. |
| FR-014 | The system shall allow administrators to deactivate/reactivate user accounts. |

## Module: User Management

| ID | Requirement |
|----|-------------|
| FR-015 | The system shall display a list of all users in the organization. |
| FR-016 | The system shall allow filtering users by role, status, and branch. |
| FR-017 | The system shall display user details including name, email, role, branch, and status. |
| FR-018 | The system shall allow editing user profile information. |
| FR-019 | The system shall allow administrators to change a user's role. |
| FR-020 | The system shall record the date and time of the last login for each user. |
| FR-021 | The system shall allow users to update their own profile information. |
| FR-022 | The system shall display user activity logs to administrators. |

## Module: Roles & Permissions

| ID | Requirement |
|----|-------------|
| FR-023 | The system shall provide pre-defined roles: Customer, Waiter, Receptionist, Restaurant Admin, System Admin. |
| FR-024 | The system shall allow System Admins to create custom roles. |
| FR-025 | The system shall allow assigning granular permissions to roles. |
| FR-026 | The system shall validate permissions on every protected API request. |
| FR-027 | The system shall display the current permission set for each role. |
| FR-028 | The system shall allow copying permissions from an existing role. |

## Module: Restaurants

| ID | Requirement |
|----|-------------|
| FR-029 | The system shall allow creating a restaurant profile with name, address, phone, email, and cuisine type. |
| FR-030 | The system shall allow editing the restaurant profile. |
| FR-031 | The system shall allow uploading a restaurant logo. |
| FR-032 | The system shall allow configuring operating hours for each day of the week. |
| FR-033 | The system shall allow creating multiple branches under one restaurant account. |
| FR-034 | The system shall allow setting a time zone per restaurant branch. |
| FR-035 | The system shall allow setting the average dining duration per restaurant. |
| FR-036 | The system shall allow enabling or disabling online reservations per branch. |
| FR-037 | The system shall allow setting the maximum advance booking days. |
| FR-038 | The system shall allow configuring slot intervals (e.g., 15, 30, 60 minutes). |
| FR-039 | The system shall display a list of all branches with key information. |

## Module: Tables

| ID | Requirement |
|----|-------------|
| FR-040 | The system shall allow creating tables with number, capacity, and location description. |
| FR-041 | The system shall allow editing table information. |
| FR-042 | The system shall allow deleting a table (with validation for active reservations). |
| FR-043 | The system shall allow defining table zones or sections (e.g., patio, indoor, bar). |
| FR-044 | The system shall allow configuring table statuses: available, occupied, reserved, cleaning, out of service. |
| FR-045 | The system shall display a visual floor plan of all tables grouped by zone. |
| FR-046 | The system shall allow drag-and-drop table positioning in the floor plan. |
| FR-047 | The system shall allow merging two tables into one for larger parties. |
| FR-048 | The system shall allow splitting a merged table back into individual tables. |
| FR-049 | The system shall display real-time table availability status. |
| FR-050 | The system shall allow assigning tables to specific reservation slots. |
| FR-051 | The system shall prevent assigning a table that is already occupied or reserved for an overlapping time. |

## Module: Reservations

| ID | Requirement |
|----|-------------|
| FR-052 | The system shall allow creating a reservation with customer name, phone, email, party size, date, time, and branch. |
| FR-053 | The system shall allow creating reservations for same-day and future dates. |
| FR-054 | The system shall allow searching available time slots for a given party size, date, and branch. |
| FR-055 | The system shall display available tables that can accommodate the requested party size. |
| FR-056 | The system shall allow assigning a specific table during reservation creation. |
| FR-057 | The system shall allow auto-assigning the best available table. |
| FR-058 | The system shall allow modifying an existing reservation (date, time, party size, table). |
| FR-059 | The system shall allow canceling a reservation with a reason. |
| FR-060 | The system shall allow confirming a reservation (manual confirmation by staff). |
| FR-061 | The system shall allow marking a reservation as no-show. |
| FR-062 | The system shall allow checking in a guest upon arrival. |
| FR-063 | The system shall allow checking out a guest and releasing the table. |
| FR-064 | The system shall display reservations in daily, weekly, and monthly views. |
| FR-065 | The system shall allow filtering reservations by status, date range, branch, and customer. |
| FR-066 | The system shall display reservation details: customer info, party size, time, table, status, special requests. |
| FR-067 | The system shall allow adding internal notes to a reservation. |
| FR-068 | The system shall allow adding special requests or allergies to a reservation. |
| FR-069 | The system shall support walk-in reservations without prior booking. |
| FR-070 | The system shall allow viewing reservation history for a specific table. |
| FR-071 | The system shall allow viewing reservation history for a specific customer. |
| FR-072 | The system shall enforce maximum capacity per time slot based on available tables. |
| FR-073 | The system shall detect and warn about potential double-bookings. |
| FR-074 | The system shall allow setting a reservation as recurring (weekly, bi-weekly, monthly). |

## Module: Customers

| ID | Requirement |
|----|-------------|
| FR-075 | The system shall allow creating a customer profile with name, phone, email, and preferences. |
| FR-076 | The system shall allow searching customers by name, phone, or email. |
| FR-077 | The system shall display customer visit history including dates, tables, and party sizes. |
| FR-078 | The system shall allow adding notes to a customer profile. |
| FR-079 | The system shall track customer preferences (favorite table, dietary restrictions, special occasions). |
| FR-080 | The system shall display total visits, total cancellations, and no-show count per customer. |
| FR-081 | The system shall allow merging duplicate customer profiles. |
| FR-082 | The system shall automatically create a customer profile when a new phone or email is used in a reservation. |

## Module: Notifications

| ID | Requirement |
|----|-------------|
| FR-083 | The system shall send a confirmation email when a reservation is created. |
| FR-084 | The system shall send a reminder email 24 hours before the reservation. |
| FR-085 | The system shall send a cancellation confirmation email when a reservation is canceled. |
| FR-086 | The system shall send a modification confirmation email when a reservation is changed. |
| FR-087 | The system shall allow configuring whether notifications are enabled per branch. |
| FR-088 | The system shall send an in-app notification to receptionists when a new reservation is made. |

## Module: Reports & Analytics

| ID | Requirement |
|----|-------------|
| FR-089 | The system shall display a dashboard with key metrics: reservations today, covers today, occupancy rate. |
| FR-090 | The system shall generate a daily reservation summary report. |
| FR-091 | The system shall generate a weekly performance report with occupancy trends. |
| FR-092 | The system shall generate a monthly report with comparison to previous periods. |
| FR-093 | The system shall display peak hours analysis based on reservation data. |
| FR-094 | The system shall display no-show rate as a percentage over a selected period. |
| FR-095 | The system shall display average party size per day/week/month. |
| FR-096 | The system shall display average table turn time. |
| FR-097 | The system shall allow exporting reports as CSV or PDF. |
| FR-098 | The system shall display top customers by visit frequency. |
| FR-099 | The system shall display cancellation rate and reasons breakdown. |

## Module: Audit Logs

| ID | Requirement |
|----|-------------|
| FR-100 | The system shall log all reservation creation, modification, and cancellation events. |
| FR-101 | The system shall log all user authentication events (login, logout, failed login). |
| FR-102 | The system shall log all changes to restaurant configuration. |
| FR-103 | The system shall log all user account creation and role changes. |
| FR-104 | The system shall display audit logs with timestamp, user, action, and details. |
| FR-105 | The system shall allow filtering audit logs by date range, user, and action type. |
| FR-106 | The system shall retain audit logs for a minimum of 12 months. |

## Module: Settings

| ID | Requirement |
|----|-------------|
| FR-107 | The system shall allow configuring general settings: restaurant name, contact info, time zone. |
| FR-108 | The system shall allow configuring notification preferences per branch. |
| FR-109 | The system shall allow configuring reservation policies: cancellation window, late arrival grace period. |
| FR-110 | The system shall allow configuring business hours including holidays and special hours. |
