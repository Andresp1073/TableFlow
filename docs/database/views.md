# Views

**Last updated:** 2026-07-04

## View Philosophy

Views provide **pre-joined, filtered, and aggregated** representations of the data. They simplify application queries, enforce consistent access patterns, and reduce the risk of N+1 queries in application code.

All views are **read-only** — they simplify querying but do not permit inserts or updates.

---

## View Catalog

### 1. v_today_reservations

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Provides a complete view of today's reservations for the dashboard. |

**Columns:** reservation_id, confirmation_code, branch_id, branch_name, customer_id, customer_name, customer_phone, date, time, party_size, status, table_numbers, source, special_requests, assigned_waiter_name, checked_in_at, created_by_name

**Query Pattern:** Used by the dashboard to show today's reservation list with all key fields pre-joined.

**Tables joined:** reservations, customers, branches, reservation_tables, users (created_by), users (assigned_to)

**Why a view:**
- Avoids repeating the same 6-table join in every dashboard query.
- Ensures consistent column naming across all dashboard features.
- The dashboard loads on every page visit — performance matters.

### 2. v_available_tables

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Shows tables that are available for a given time slot. Parameterized in application (filtered by branch_id, date, time). |

**Columns:** table_id, branch_id, branch_name, zone_id, zone_name, table_number, capacity, max_capacity, position_x, position_y, shape

**Logic:** Returns all active tables that do NOT have an overlapping reservation in CONFIRMED or SEATED status for the specified time window (considering average_dining_duration for overlap).

**Tables joined:** tables, table_zones, branches, reservations, reservation_tables

**Why a view:**
- The availability check is the most frequently executed query in the system.
- Encapsulates the complex overlap-detection logic.
- Eliminates N+1 risk when checking multiple tables.

### 3. v_customer_summary

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Aggregated customer profile data for the customer detail page. |

**Columns:** customer_id, email, phone, first_name, last_name, total_visits, total_cancellations, total_noshows, is_flagged, last_visit_date, last_visit_branch, favorite_branch_id, average_party_size, total_spent (future)

**Tables joined:** customers, reservations (aggregated)

**Why a view:**
- Avoids multiple COUNT queries on the customer detail page.
- Provides a single source of truth for customer statistics.
- The `average_party_size` and `last_visit_date` are computed from reservation data.

### 4. v_branch_performance_daily

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Daily performance metrics per branch for the reports module. |

**Columns:** date, branch_id, branch_name, total_reservations, total_covers, confirmed_count, seated_count, completed_count, no_show_count, cancelled_count, no_show_rate_pct, occupancy_rate_pct, average_party_size, peak_hour

**Tables joined:** branches, reservations (aggregated)

**Why a view:**
- The daily report is a scheduled/recurring query.
- Aggregating on the fly for 90 days of data across 10 branches would be slow.
- Pre-computes key KPIs that are expensive to calculate per-request.

### 5. v_peak_hours_analysis

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Identifies peak reservation hours per branch for capacity planning. |

**Columns:** branch_id, branch_name, day_of_week, hour_slot, average_reservations, average_covers, rank_within_branch

**Tables joined:** reservations, branches

**Why a view:**
- Peak hour analysis requires grouping by hour across many dates.
- The rank helps managers identify their busiest time slots.
- Supports the analytics dashboard heatmap chart.

### 6. v_top_customers

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Identifies the most frequent customers per branch. |

**Columns:** branch_id, branch_name, customer_id, customer_name, customer_email, customer_phone, visit_count, last_visit_date, total_noshows, rank

**Tables joined:** customers, reservations, branches

**Why a view:**
- Supports loyalty and VIP identification.
- Ranked within each branch for localized recognition.
- Filters out customers with excessive no-shows.

### 7. v_no_show_trend

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Monthly no-show rate trend for analytics. |

**Columns:** year_month, branch_id, branch_name, total_reservations, no_show_count, no_show_rate_pct, previous_month_rate_pct, rate_change_pct

**Tables joined:** branches, reservations (aggregated)

**Why a view:**
- Month-over-month comparison requires self-join of aggregated data.
- Enables trend visualization without server-side computation.

### 8. v_reservation_timeline

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Full status change timeline for a reservation detail page. |

**Columns:** history_id, reservation_id, from_status, to_status, changed_by_name, reason, created_at

**Tables joined:** reservation_status_history, users

**Why a view:**
- Simplifies the reservation detail page query.
- Includes the user name who made the change (reduces application joins).

### 9. v_active_reservations

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Quick view of all currently active (CONFIRMED or SEATED) reservations. |

**Columns:** reservation_id, confirmation_code, branch_id, branch_name, customer_name, customer_phone, date, time, party_size, status, table_numbers, elapsed_minutes (for seated)

**Tables joined:** reservations, customers, branches, reservation_tables, users

**Why a view:**
- Used by the real-time operational dashboard.
- Filtered to only CONFIRMED and SEATED statuses for performance.

### 10. v_upcoming_reminders

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Reservations that need a 24-hour reminder notification. |

**Columns:** reservation_id, confirmation_code, branch_id, branch_name, customer_id, customer_name, customer_email, customer_phone, date, time, party_size

**Logic:** Reservations with status CONFIRMED, date = tomorrow, where no REMINDER notification has been sent.

**Tables joined:** reservations, customers, branches, notifications (LEFT JOIN, filtered to reminder type)

**Why a view:**
- Used by the notification scheduler to batch send reminders.
- Pre-joined to avoid multiple queries per reservation.
- Excludes reservations that already received a reminder.

---

## View Materialization Decision

| View | Materialized? | Rationale |
|------|---------------|-----------|
| v_today_reservations | No | Real-time data — changes every minute |
| v_available_tables | No | Real-time — table status changes constantly |
| v_customer_summary | No | Per-request, infrequent |
| v_branch_performance_daily | **Yes (future)** | Consider materializing for reports with date ranges > 30 days |
| v_peak_hours_analysis | **Yes (future)** | Hourly data doesn't change retroactively |
| v_top_customers | No | Frequent enough changes |
| v_no_show_trend | **Yes (future)** | Historical aggregate, rarely changes |
| v_reservation_timeline | No | Per-request |
| v_active_reservations | No | Real-time |
| v_upcoming_reminders | No | Runs once daily |

**MySQL Materialized View Workaround:** MySQL does not support materialized views natively. For v_branch_performance_daily, create a `branch_daily_summary` table populated by a scheduled event or application cron job.

---

## Related Documents

- [indexes.md](./indexes.md) — Indexes that support view queries
- [performance.md](./performance.md) — Performance considerations for views
- [table-design.md](./table-design.md) — Underlying table structures
