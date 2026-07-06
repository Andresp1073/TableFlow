# Table Design

**Last updated:** 2026-07-04

## organizations

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Tenant — a restaurant company. Root entity for multi-tenancy. |
| **Estimated Records** | 100–500 |
| **Growth Rate** | Low |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary identifier |
| name | VARCHAR(255) | NOT NULL | Organization name |
| email | VARCHAR(255) | | Contact email |
| phone | VARCHAR(20) | | Contact phone |
| address | TEXT | | Physical address |
| logo_url | VARCHAR(500) | | Logo image URL |
| timezone | VARCHAR(50) | NOT NULL, DEFAULT 'UTC' | Default timezone |
| created_at | DATETIME(3) | NOT NULL | Creation timestamp |
| updated_at | DATETIME(3) | NOT NULL | Last update timestamp |
| deleted_at | DATETIME(3) | NULLABLE | Soft delete timestamp |

**Indexes:** PK (id)
**Related tables:** branches (1:N)

---

## branches

| Attribute | Detail |
|-----------|--------|
| **Purpose** | A single physical restaurant location. |
| **Estimated Records** | 200–1,200 |
| **Growth Rate** | Medium |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations.id, NOT NULL | Parent organization |
| name | VARCHAR(255) | NOT NULL | Branch name |
| address | TEXT | NOT NULL | Street address |
| phone | VARCHAR(20) | | Contact phone |
| email | VARCHAR(255) | | Contact email |
| timezone | VARCHAR(50) | NOT NULL | Branch timezone |
| cuisine_type | VARCHAR(100) | | Cuisine type |
| average_dining_duration | INT | NOT NULL, DEFAULT 90 | Minutes |
| max_advance_booking_days | INT | NOT NULL, DEFAULT 60 | Max days ahead |
| slot_interval | INT | NOT NULL, DEFAULT 30 | Minutes between slots |
| max_party_size | INT | NOT NULL, DEFAULT 20 | Max guests per reservation |
| is_online_reservation_enabled | TINYINT(1) | NOT NULL, DEFAULT 0 | Online booking toggle |
| created_at | DATETIME(3) | NOT NULL | |
| updated_at | DATETIME(3) | NOT NULL | |
| updated_by | UUID | FK → users.id, NULLABLE | Who last updated |
| deleted_at | DATETIME(3) | NULLABLE | |

**Indexes:** PK (id), FK (organization_id), INDEX (organization_id)
**Unique constraints:** (organization_id, name) — branch names unique within an organization

---

## users

| Attribute | Detail |
|-----------|--------|
| **Purpose** | System user accounts for staff and administrators. |
| **Estimated Records** | 500–3,000 |
| **Growth Rate** | Medium |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| phone | VARCHAR(20) | | |
| is_active | TINYINT(1) | NOT NULL, DEFAULT 1 | Account active |
| is_verified | TINYINT(1) | NOT NULL, DEFAULT 0 | Email verified |
| failed_login_attempts | INT | NOT NULL, DEFAULT 0 | Consecutive failures |
| locked_until | DATETIME(3) | NULLABLE | Lockout expiry |
| last_login_at | DATETIME(3) | NULLABLE | Last successful login |
| created_at | DATETIME(3) | NOT NULL | |
| updated_at | DATETIME(3) | NOT NULL | |
| deleted_at | DATETIME(3) | NULLABLE | |

**Indexes:** PK (id), UNIQUE (email), INDEX (is_active)

---

## roles

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Role definitions for RBAC. |
| **Estimated Records** | 10–30 |
| **Growth Rate** | Very Low |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Role identifier |
| description | TEXT | | Human-readable description |
| is_system | TINYINT(1) | NOT NULL, DEFAULT 0 | Cannot be deleted |
| created_at | DATETIME(3) | NOT NULL | |
| updated_at | DATETIME(3) | NOT NULL | |

**Indexes:** PK (id), UNIQUE (name)

---

## permissions

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Granular system permissions. |
| **Estimated Records** | 100–200 |
| **Growth Rate** | Very Low |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(150) | UNIQUE, NOT NULL | e.g., 'reservations.create' |
| description | TEXT | NOT NULL | What this permission allows |
| module | VARCHAR(100) | NOT NULL | Module grouping |
| risk_level | VARCHAR(20) | NOT NULL | low, medium, high, critical |
| created_at | DATETIME(3) | NOT NULL | |

**Indexes:** PK (id), UNIQUE (name), INDEX (module)

---

## role_permissions

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Associative table — maps permissions to roles. |
| **Estimated Records** | 500–1,000 |
| **Growth Rate** | Low |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| role_id | UUID | PK, FK → roles.id | |
| permission_id | UUID | PK, FK → permissions.id | |

**Indexes:** PK (role_id, permission_id), FK (permission_id)

---

## user_roles

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Assigns roles to users with optional branch scope. |
| **Estimated Records** | 500–3,000 |
| **Growth Rate** | Medium |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PK, FK → users.id | |
| role_id | UUID | PK, FK → roles.id | |
| branch_id | UUID | NULLABLE, FK → branches.id | Scope: NULL = organization-wide |

**Indexes:** PK (user_id, role_id, branch_id), FK (role_id), FK (branch_id)

---

## employees

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Links users to branches with employment details. |
| **Estimated Records** | 500–3,000 |
| **Growth Rate** | Medium |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | |
| branch_id | UUID | FK → branches.id, NOT NULL | |
| employee_code | VARCHAR(50) | UNIQUE | Internal code |
| position | VARCHAR(100) | NOT NULL | Job title |
| hired_at | DATE | NOT NULL | |
| created_at | DATETIME(3) | NOT NULL | |
| updated_at | DATETIME(3) | NOT NULL | |
| deleted_at | DATETIME(3) | NULLABLE | |

**Indexes:** PK (id), UNIQUE (employee_code), FK (user_id), FK (branch_id), INDEX (branch_id)

---

## customers

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Diner profiles with contact, preferences, and history. |
| **Estimated Records** | 50,000–500,000 |
| **Growth Rate** | High |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| total_visits | INT | NOT NULL, DEFAULT 0 | Denormalized counter |
| total_cancellations | INT | NOT NULL, DEFAULT 0 | Denormalized counter |
| total_noshows | INT | NOT NULL, DEFAULT 0 | Denormalized counter |
| is_flagged | TINYINT(1) | NOT NULL, DEFAULT 0 | High-risk marker |
| notes | TEXT | | Internal notes |
| preferences | JSON | | Dietary, favorite table, etc. |
| created_at | DATETIME(3) | NOT NULL | |
| updated_at | DATETIME(3) | NOT NULL | |
| updated_by | UUID | FK → users.id, NULLABLE | Who last updated |
| deleted_at | DATETIME(3) | NULLABLE | |

**Indexes:** PK (id), UNIQUE (email), UNIQUE (phone), INDEX (is_flagged), INDEX (last_name)

---

## table_zones

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Groups tables into sections (patio, indoor, bar, VIP). |
| **Estimated Records** | 500–2,000 |
| **Growth Rate** | Low |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| branch_id | UUID | FK → branches.id, NOT NULL | |
| name | VARCHAR(100) | NOT NULL | Zone name |
| description | TEXT | | |
| sort_order | INT | NOT NULL, DEFAULT 0 | Display order |
| created_at | DATETIME(3) | NOT NULL | |
| updated_at | DATETIME(3) | NOT NULL | |

**Indexes:** PK (id), FK (branch_id), UNIQUE (branch_id, name)

---

## tables

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Physical tables in a branch. |
| **Estimated Records** | 4,000–24,000 |
| **Growth Rate** | Medium |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| branch_id | UUID | FK → branches.id, NOT NULL | |
| zone_id | UUID | FK → table_zones.id, NULLABLE | |
| table_number | VARCHAR(20) | NOT NULL | Display number |
| min_capacity | INT | NOT NULL | Minimum seats |
| max_capacity | INT | NOT NULL | Maximum seats |
| is_active | TINYINT(1) | NOT NULL, DEFAULT 1 | |
| position_x | INT | NOT NULL, DEFAULT 0 | Floor plan X |
| position_y | INT | NOT NULL, DEFAULT 0 | Floor plan Y |
| shape | VARCHAR(20) | DEFAULT 'rectangle' | Shape type |
| width | INT | DEFAULT 60 | Visual width px |
| height | INT | DEFAULT 60 | Visual height px |
| created_at | DATETIME(3) | NOT NULL | |
| updated_at | DATETIME(3) | NOT NULL | |
| updated_by | UUID | FK → users.id, NULLABLE | Who last updated |
| deleted_at | DATETIME(3) | NULLABLE | |

**Indexes:** PK (id), FK (branch_id), FK (zone_id), INDEX (branch_id, is_active), UNIQUE (branch_id, table_number)

---

## reservations

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Central entity — a booking made by a customer. |
| **Estimated Records** | 500,000–5,000,000 |
| **Growth Rate** | High |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| branch_id | UUID | FK → branches.id, NOT NULL | |
| customer_id | UUID | FK → customers.id, NOT NULL | |
| created_by | UUID | FK → users.id, NOT NULL | Staff who created |
| assigned_to | UUID | FK → users.id, NULLABLE | Waiter assigned |
| confirmation_code | VARCHAR(20) | UNIQUE, NOT NULL | Customer-facing code |
| date | DATE | NOT NULL | Reservation date |
| time | TIME | NOT NULL | Reservation time |
| party_size | INT | NOT NULL | Number of guests |
| status | VARCHAR(20) | NOT NULL | PENDING, CONFIRMED, SEATED, COMPLETED, NO_SHOW, CANCELLED |
| cancellation_reason | VARCHAR(500) | NULLABLE | |
| special_requests | TEXT | NULLABLE | Allergies, occasions |
| internal_notes | TEXT | NULLABLE | Staff notes |
| is_walk_in | TINYINT(1) | NOT NULL, DEFAULT 0 | |
| source | VARCHAR(20) | NOT NULL | PHONE, WALK_IN, ONLINE, STAFF |
| checked_in_at | DATETIME(3) | NULLABLE | |
| checked_out_at | DATETIME(3) | NULLABLE | |
| cancelled_at | DATETIME(3) | NULLABLE | |
| no_show_marked_at | DATETIME(3) | NULLABLE | |
| created_at | DATETIME(3) | NOT NULL | |
| updated_at | DATETIME(3) | NOT NULL | |
| updated_by | UUID | FK → users.id, NULLABLE | Who last updated |

**Indexes:** PK (id), UNIQUE (confirmation_code), FK (branch_id), FK (customer_id), FK (created_by), FK (assigned_to), INDEX (branch_id, date), INDEX (branch_id, status), INDEX (customer_id), INDEX (date)

**Status values:** `PENDING`, `CONFIRMED`, `SEATED`, `COMPLETED`, `NO_SHOW`, `CANCELLED`

---

## reservation_tables

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Links reservations to assigned tables. |
| **Estimated Records** | 600,000–6,000,000 |
| **Growth Rate** | High |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| reservation_id | UUID | PK, FK → reservations.id | |
| table_id | UUID | PK, FK → tables.id | |
| assigned_at | DATETIME(3) | NOT NULL | When table was assigned |

**Indexes:** PK (reservation_id, table_id), FK (table_id), INDEX (table_id)

---

## reservation_status_history

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Immutable log of reservation status changes. |
| **Estimated Records** | 1,500,000–15,000,000 |
| **Growth Rate** | High |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| reservation_id | UUID | FK → reservations.id, NOT NULL | |
| from_status | VARCHAR(20) | NOT NULL | |
| to_status | VARCHAR(20) | NOT NULL | |
| changed_by | UUID | FK → users.id, NULLABLE | |
| reason | VARCHAR(500) | NULLABLE | |
| created_at | DATETIME(3) | NOT NULL | |

**Indexes:** PK (id), FK (reservation_id), INDEX (reservation_id, created_at), INDEX (created_at)

---

## business_hours

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Standard operating hours per day of week. |
| **Estimated Records** | 1,400–8,400 (7 per branch) |
| **Growth Rate** | Low |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| branch_id | UUID | FK → branches.id, NOT NULL | |
| day_of_week | TINYINT | NOT NULL | 1=Monday, 7=Sunday |
| open_time | TIME | NULLABLE | Opening time |
| close_time | TIME | NULLABLE | Closing time |
| is_closed | TINYINT(1) | NOT NULL, DEFAULT 0 | Closed all day |
| created_at | DATETIME(3) | NOT NULL | |
| updated_at | DATETIME(3) | NOT NULL | |

**Indexes:** PK (id), FK (branch_id), UNIQUE (branch_id, day_of_week)

---

## holiday_hours

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Override hours for holidays and special dates. |
| **Estimated Records** | 500–3,000 |
| **Growth Rate** | Low |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| branch_id | UUID | FK → branches.id, NOT NULL | |
| date | DATE | NOT NULL | |
| open_time | TIME | NULLABLE | |
| close_time | TIME | NULLABLE | |
| is_closed | TINYINT(1) | NOT NULL, DEFAULT 0 | |
| description | VARCHAR(255) | NULLABLE | Holiday name |
| created_at | DATETIME(3) | NOT NULL | |
| updated_at | DATETIME(3) | NOT NULL | |

**Indexes:** PK (id), FK (branch_id), UNIQUE (branch_id, date), INDEX (date)

---

## notifications

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Records of notification deliveries. |
| **Estimated Records** | 1,000,000–10,000,000 |
| **Growth Rate** | High |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| branch_id | UUID | FK → branches.id, NOT NULL | |
| reservation_id | UUID | FK → reservations.id, NULLABLE | |
| type | VARCHAR(30) | NOT NULL | CONFIRMATION, REMINDER, CANCELLATION, MODIFICATION |
| recipient_email | VARCHAR(255) | NULLABLE | |
| recipient_phone | VARCHAR(20) | NULLABLE | |
| status | VARCHAR(20) | NOT NULL | PENDING, SENT, FAILED |
| sent_at | DATETIME(3) | NULLABLE | |
| error_message | TEXT | NULLABLE | |
| created_at | DATETIME(3) | NOT NULL | |

**Indexes:** PK (id), FK (branch_id), FK (reservation_id), INDEX (status, created_at), INDEX (type)

---

## notification_templates

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Configurable templates for notification content. |
| **Estimated Records** | 50–500 |
| **Growth Rate** | Low |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| branch_id | UUID | FK → branches.id, NULLABLE | NULL = system default |
| type | VARCHAR(30) | NOT NULL | CONFIRMATION, REMINDER, etc. |
| subject | VARCHAR(500) | NOT NULL | Email subject |
| body | TEXT | NOT NULL | Email/SMS body |
| created_at | DATETIME(3) | NOT NULL | |
| updated_at | DATETIME(3) | NOT NULL | |

**Indexes:** PK (id), FK (branch_id), UNIQUE (branch_id, type)

---

## audit_logs

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Immutable system-wide event log. |
| **Estimated Records** | 1,000,000–10,000,000 |
| **Growth Rate** | High |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NULLABLE | NULL for system actions |
| action | VARCHAR(100) | NOT NULL | e.g., 'reservation.cancel' |
| resource_type | VARCHAR(50) | NOT NULL | e.g., 'reservation' |
| resource_id | VARCHAR(36) | NOT NULL | UUID of affected resource |
| details | JSON | NULLABLE | Before/after values |
| ip_address | VARCHAR(45) | NULLABLE | |
| user_agent | VARCHAR(500) | NULLABLE | |
| created_at | DATETIME(3) | NOT NULL | |

**Indexes:** PK (id), FK (user_id), INDEX (resource_type, resource_id), INDEX (action), INDEX (created_at), INDEX (user_id)

---

## refresh_tokens

| Attribute | Detail |
|-----------|--------|
| **Purpose** | JWT refresh token tracking for session management. |
| **Estimated Records** | 10,000–60,000 |
| **Growth Rate** | Medium |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | |
| token_hash | VARCHAR(255) | NOT NULL | SHA-256 hash of token |
| expires_at | DATETIME(3) | NOT NULL | |
| is_revoked | TINYINT(1) | NOT NULL, DEFAULT 0 | |
| created_at | DATETIME(3) | NOT NULL | |

**Indexes:** PK (id), FK (user_id), INDEX (token_hash), INDEX (user_id, is_revoked, expires_at)

---

## settings

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Flexible key-value configuration store. |
| **Estimated Records** | 2,000–10,000 |
| **Growth Rate** | Low |

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| branch_id | UUID | FK → branches.id, NULLABLE | NULL = organization level |
| key | VARCHAR(100) | NOT NULL | Setting name |
| value | JSON | NOT NULL | Setting value |
| created_at | DATETIME(3) | NOT NULL | |
| updated_at | DATETIME(3) | NOT NULL | |

**Indexes:** PK (id), FK (branch_id), UNIQUE (branch_id, key)

---

## Related Documents

- [entity-analysis.md](./entity-analysis.md) — Entity purpose and classification
- [relationships.md](./relationships.md) — Relationship details
- [constraints.md](./constraints.md) — Integrity constraints
