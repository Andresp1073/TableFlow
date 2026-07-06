# Future Evolution

**Last updated:** 2026-07-04

## Evolution Philosophy

TableFlow is designed with **15-year maintainability** in mind. The modular monolith architecture with Clean Architecture boundaries ensures that the system can evolve without rewrites. This document describes how each evolution path would work given the current architecture.

---

## Evolution Paths

### 1. Microservices Extraction

**When:** A module needs independent scaling, independent deployment, or a different tech stack.

**Extraction order (most likely first):**

| Module | Reason for Extraction | Effort |
|--------|----------------------|--------|
| Notifications | I/O-bound email sending blocks API. Needs dedicated workers. | Low — module already isolated |
| Reports | CPU-intensive report generation. | Low — read-heavy, no real-time requirements |
| Audit | High-volume write load. | Medium — needs event bus for cross-service events |
| Reservations | Core business logic, highest load. | High — most dependencies |

**How to extract:**

```
1. Create new service from the module's codebase
2. Module's Prisma schema becomes its own database
3. Module's interface becomes a REST/gRPC API
4. Monolith module becomes an HTTP client to the new service
5. Communication via API gateway or service mesh
```

**Cost:** Low — Clean Architecture boundaries mean the module's domain logic is already isolated from the monolith.

---

### 2. Mobile Applications (iOS / Android)

**When:** Market validation after web launch.

**How:**

```
Current: React SPA (browser)
Future:  React SPA + React Native apps
         └── Both use the same REST API
```

**Impact:**
- No backend changes needed — REST API serves both web and mobile.
- Add mobile-specific endpoints if needed (push notifications, device registration).
- Shared validation schemas already in `packages/shared/`.

---

### 3. GraphQL API

**When:** Clients demand flexible data fetching and reduced over-fetching.

**How:**

```
Current: REST API
Future:  REST API + GraphQL API (side by side)
         └── GraphQL wrapped around existing services
```

**Impact:**
- Backend: Add GraphQL layer (Apollo Server) that delegates to existing service layer.
- No changes to services or repositories.
- REST API maintained for backward compatibility.

---

### 4. Redis / Caching

**When:** Traffic grows and database becomes a bottleneck.

**Phased adoption:**

| Phase | What | Impact |
|-------|------|--------|
| 1 | In-memory cache (role-permissions) | Minimal code change, single instance |
| 2 | Redis: distributed caching | Add Redis container, configure cache-aside |
| 3 | Redis: rate limiting | Move rate limit state from memory to Redis |
| 4 | Redis: session blacklist | Token revocation across instances |

---

### 5. Message Queue / Event-Driven Architecture

**When:** Modules need decoupled async communication.

**Currently:** Module A calls Module B's service synchronously.

**Future:**

```
Reservation Created
        │
        ▼
   Event Bus (Redis Pub/Sub / RabbitMQ)
        │
        ├──► Notifications Service (async email)
        ├──► Audit Service (async log write)
        └──► Analytics Service (async aggregation)
```

**Impact:**
- Services publish events, don't know who consumes them.
- Consumers subscribe and process independently.
- Better resilience (consumer failure doesn't affect reservation creation).

---

### 6. Real-Time Notifications (WebSockets)

**When:** Staff needs real-time updates (new reservation, table status change).

**How:**
- WebSocket server (Socket.IO) alongside Express.
- Or: Server-Sent Events for simpler unidirectional flow.
- Dashboard and table floor plan update in real time.

---

### 7. AI/ML Features

**When:** Sufficient historical data collected.

| Feature | Data Required | Implementation |
|---------|---------------|----------------|
| No-show prediction | Reservation history with no-show patterns | ML model returns probability score |
| Demand forecasting | Historical occupancy data | Time series prediction |
| Dynamic table pricing | Occupancy + revenue data | Rule engine → ML model |
| Smart table assignment | Historical seating data | Optimization algorithm |

**Architecture:**
- ML models as separate services (Python or Node.js with TensorFlow.js).
- Models consume data via API or database read replicas.
- Predictions cached and served via REST endpoints.

---

### 8. Online Payments

**When:** Restaurants want deposits or pre-payments for reservations.

**Integration:**
- Payment gateway: Stripe or similar.
- No PCI scope — use Stripe Elements or Checkout (tokenization).
- Payment records stored in a `payments` table.
- Reservation status depends on payment status.

---

### 9. POS Integration

**When:** Real-time table synchronization with POS systems.

**Integration patterns:**
- Option A: POS pushes table status changes to TableFlow API.
- Option B: TableFlow polls POS for changes.
- Option C: Both systems subscribe to an event bus.

**Standard protocol:** Vendor-specific APIs (Toast, Square, Clover).

---

### 10. Public Booking Widget

**When:** Customers should self-serve reservations.

**How:**
- Embeddable React widget (micro-frontend).
- Loaded on restaurant's website via `<script>` tag.
- Widget calls the same REST API as the main SPA.
- Separate authentication (short-lived guest tokens).

---

### 11. Multi-Tenant Enhancements

**When:** Enterprise clients require tenant isolation.

| Enhancement | Complexity | Description |
|-------------|------------|-------------|
| Database per tenant | High | Separate MySQL database per organization |
| Sharding | High | Distribute tenants across database instances |
| Custom domain | Medium | `restaurant.tableflow.com` or CNAME |

**Current:** Row-level tenant isolation (all tenants share tables, filtered by `organization_id`).

---

### 12. Developer API / Public API

**When:** Third-party developers want to integrate with TableFlow.

**How:**
- Public REST API with API keys.
- Developer portal with documentation and key management.
- Rate limiting per API key.
- Webhooks for event notifications.

---

## Evolution Decision Framework

When evaluating any evolution path, consider:

| Question | Consideration |
|----------|---------------|
| Does this add business value now? | If not, defer. |
| Does the current architecture support it? | If yes, implement within existing structure. |
| Is it backward compatible? | If no, plan migration and communication. |
| What is the cost of deferring? | If low, defer to reduce complexity. |
| Does it require a new technology? | Record decision in `decision-log.md`. |

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why |
|-------------|-----|
| Premature microservices | Adds operational complexity before business need. |
| Over-abstraction | YAGNI applies to abstractions too. |
| Big bang rewrites | Evolve incrementally, not via rewrite. |
| Ignoring backward compatibility | Breaks integrations and erodes trust. |
| Technology for technology's sake | Every new technology must solve a real problem. |

---

## Related Documents

- [architecture-decisions.md](./architecture-decisions.md) — Decision log for evolution decisions
- [scalability.md](./scalability.md) — Scaling strategy
- [project-roadmap.md](../docs/project-roadmap.md) — Development phases timeline
