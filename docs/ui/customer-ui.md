# Customer UI

**Last updated:** 2026-07-04

## Overview

Customer management pages allow staff to view, search, and manage guest profiles. Each customer has a complete history of reservations, preferences, and notes.

---

## Customer List View

### Layout

```
+------------------------------------------------------------------+
| Customers                [+ New Customer] [Import] [Export CSV]  |
+------------------------------------------------------------------+
| [Search by name, email, phone...]  [Status: All ▼] [Sort: ▼]    |
+------------------------------------------------------------------+
| ☐ | Name          | Email           | Phone        | Visits | Flag |
| ☐ | Smith, John   | john@email.com  | (555) 123.. | 12     | ⭐    |
| ☐ | Jones, Mary   | mary@email.com  | (555) 456.. | 8      | —    |
| ☐ | Lee, Sarah    | sarah@email.com | (555) 789.. | 3      | 🚫   |
| ☐ | ...           | ...             | ...         | ...    | ...  |
+------------------------------------------------------------------+
| [PG] < 1  2  3 ... 20 >  Showing 1-10 of 198                     |
+------------------------------------------------------------------+
```

### Columns

| Column | Type | Detail |
|--------|------|--------|
| Select | Checkbox | Batch actions |
| Name | Text + avatar | Link to detail page |
| Email | Text | Truncated |
| Phone | Text | Formatted |
| Total Visits | Number | Sorted desc by default |
| Last Visit | Date | Relative ("2d ago") |
| Flag | Icon | ⭐ VIP / 🚫 No-show risk / — Normal |

### Filters

| Filter | Type | Options |
|--------|------|---------|
| Search | Text | Searches name, email, phone |
| Status | Select | All, VIP, Flagged, No-show risk |
| Date range | Date range | Last visit filter |
| Minimum visits | Number | ≥ X visits |

### Actions

| Action | Behavior |
|--------|----------|
| Select all | Checkbox in header |
| Batch add note | Modal: "Add note to 5 selected customers" |
| Batch flag/unflag | Toggle VIP status |
| Create reservation | Opens modal with customer pre-filled |

---

## Customer Detail Page

### Layout (Two-Column)

```
+------------------------------------------------------------------+
| < Customers  |  John Smith                          Edit Profile |
+------------------------------------------------------------------+
|                                                                    |
|  ⬤ JS                                         VIP ⭐ [Edit]      |
|  john@email.com · (555) 123-4567                                  |
|  Customer since: Jan 2024                                         |
|  Total visits: 12  |  No-shows: 1  |  Last visit: 2 days ago    |
|                                                                    |
+----------------------------+---------------------------------------+
| Profile Information        | Recent Reservations                  |
| ─────────────────────────  | ────────────────────────────────────  |
| Preferences:               | Date       | Time | Sts | Table      |
| • Prefers window table     | Jul 1      | 7PM  | ✅   | T-12     |
| • Prefers booth            | Jun 28     | 8:30 | ❌   | —         |
| • Allergic to nuts         | Jun 20     | 6PM  | ✅   | T-8      |
|                             | ...                                |
| Default party: 4           |                                     |
|                             |                                     |
| Notes                      | [View All Reservations →]            |
| ─────────────────────────  |                                     |
| (no internal notes)        |                                     |
|                             |                                     |
| [Add Note]                 | [Create Reservation for John]        |
+----------------------------+---------------------------------------+
```

### Detail Sections

| Section | Content |
|---------|---------|
| **Header** | Avatar, name, email, phone, customer since date, VIP badge |
| **Stats row** | Total visits, no-shows, last visit, avg party size |
| **Profile** | Preferences, dietary restrictions, default party size |
| **Notes** | Internal staff notes (addable by staff) |
| **Reservation History** | Last 5 reservations with status, link to full list |
| **Tags** | Customer tags (VIP, Dietary, Frequent, etc.) |

### Actions

| Action | Opens |
|--------|-------|
| Edit Profile | Customer edit modal |
| Add Note | Inline text editor + save |
| Create Reservation | Reservation modal (pre-filled with customer) |
| View All Reservations | Filtered reservation list |
| Flag as VIP | Toggle with confirmation |
| Merge Customer | Merge with duplicate profile (admin only) |

---

## Quick Create Customer Modal

| Field | Required | Validation |
|-------|----------|------------|
| First name | Yes | 1–50 chars |
| Last name | Yes | 1–50 chars |
| Email | No | Valid email format |
| Phone | No | Valid phone format |
| Notes | No | 500 char max |

**Behavior**: Minimal form (name + phone) with "Create & Continue" to reservation flow.

---

## Customer Search (Global)

### Search Modal Behavior

| Trigger | Cmd+K or click search icon |
|---------|---------------------------|
| Results grouped | Customers, Reservations, Users |
| Customer result shows | Name, phone, last visit, total visits |
| Actions from search | Click to view profile, or "+" to create reservation |

---

## Edge Cases

| Scenario | UI Behavior |
|----------|-------------|
| Duplicate customer detected | Warning: "This phone number is associated with John Smith. Merge or create new?" |
| Customer with no-show flag | Red warning badge on profile + list row |
| Customer with 0 visits | Show "No visit history" empty state |
| Customer with sensitive note | Note hidden behind "Show" button (access control) |
| Phone-only customer | Show "No email" label, disable email-dependent features |

## Cross-References

- [reservation-flow-ui.md](./reservation-flow-ui.md) — Customer selection in reservation flow
- [forms-and-validation-ui.md](./forms-and-validation-ui.md) — Customer form validation
- [empty-loading-error-states.md](./empty-loading-error-states.md) — Empty state for new customers
