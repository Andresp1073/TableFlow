# Coding Flow

**Last updated:** 2026-07-04

## New Feature Development Lifecycle

```
Planning → Design → Implementation → Testing → Documentation → Review → Deploy
```

---

## Phase 1: Planning

**Who:** Product Owner, Software Architect

| Step | Artifact |
|------|----------|
| 1. Capture requirement | Updated functional requirement (FR-XXX) |
| 2. Define acceptance criteria | Issue description |
| 3. Identify affected modules | Module list in issue |
| 4. Assess architecture impact | Decision record if needed |
| 5. Add story points | Issue estimate |

**Output:** A well-defined GitHub issue with clear acceptance criteria and tagged modules.

---

## Phase 2: Design

**Who:** Developer, Software Architect (for complex features)

**Steps:**

| Step | Action |
|------|--------|
| 1 | Review relevant architectural documents (`.ai/`, `docs/architecture/`) |
| 2 | Identify which modules need changes |
| 3 | Define the API contract (endpoint, request/response DTOs) |
| 4 | Define database changes if any (new columns, tables, indexes) |
| 5 | Update Swagger documentation |
| 6 | For complex features: write a brief design doc in the issue |

**Design Rules:**
- API contract is defined **before** frontend implementation (API-first).
- Database migration must be backward-compatible.
- If the feature touches multiple modules, identify the primary module.

---

## Phase 3: Implementation

**Who:** Developer

**Order of implementation (backend-first):**

```
 1. Database schema (Prisma schema + migration)
 2. Repository interface
 3. Repository implementation
 4. Service interface
 5. Service implementation (with unit tests)
 6. Validator (Zod schema)
 7. DTOs
 8. Controller
 9. Routes
10. Integration tests
```

**Order of implementation (frontend):**

```
 1. Service (API client method)
 2. Hook (TanStack Query)
 3. Types
 4. Schema (Zod if form)
 5. Components
 6. Page
 7. Route
 8. Tests
```

---

## Phase 4: Testing

**Who:** Developer

| Test Type | When | Coverage Target |
|-----------|------|-----------------|
| Unit tests (service) | During implementation | All branches and edge cases |
| Integration tests (API) | After controller | Happy path + errors |
| Component tests (UI) | After component | States: loading, empty, error, success |
| E2E tests | After all code | Critical flow |

**Testing Flow:**

```
1. Write unit tests for all service methods
2. Verify with npm run test:unit
3. Write integration tests for new endpoints
4. Verify with npm run test:integration
5. Manual smoke test with Swagger UI
```

---

## Phase 5: Documentation

**Who:** Developer

| Documentation | When |
|---------------|------|
| Swagger/OpenAPI | During controller implementation (decorators) |
| Readme update | If setup or configuration changed |
| `.ai/` update | If conventions changed |
| Decision log | If architectural decision was made |

---

## Phase 6: Review

**Who:** Developer + Peer Reviewer

**Checklist before opening PR:**

- [ ] All tests pass
- [ ] Lint passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Swagger docs updated
- [ ] No hardcoded values
- [ ] Error handling in place
- [ ] Input validation in place
- [ ] No TODO/FIXME comments without issue reference
- [ ] Branch name follows convention
- [ ] Commit messages follow conventional commits

---

## Phase 7: Deploy

**Who:** Developer + CI/CD

| Step | Action |
|------|--------|
| 1 | PR merged to `develop` |
| 2 | CI runs tests on `develop` |
| 3 | Deploy to staging environment |
| 4 | QA verification on staging |
| 5 | Release PR opened: `develop` → `main` |
| 6 | Tag release (e.g., `v1.2.0`) |
| 7 | CI/CD deploys to production |
| 8 | Health check verification |

---

## Feature Implementation Template

```markdown
## Feature: [Title]

### Affected Modules
- Backend: [module names]
- Frontend: [module names]

### API Contract
- `POST /api/v1/{resource}` — Create {resource}
- Request body: `{ ... }`
- Response: `{ ... }`

### Database Changes
- New table: `{name}` — {columns}
- New column on `{table}`: `{column}` — {type}

### Test Plan
1. Unit: Service method `{method}` — [test cases]
2. Integration: `POST /api/v1/{resource}` — [success + error cases]
3. Frontend: Component `{component}` — [loading, empty, error, success]

### Checklist
- [ ] Prisma schema
- [ ] Migration
- [ ] Repository (interface + impl)
- [ ] Service (with unit tests)
- [ ] Controller
- [ ] Validator
- [ ] DTOs
- [ ] Routes
- [ ] Integration tests
- [ ] Frontend service
- [ ] Frontend hooks
- [ ] Frontend components
- [ ] Swagger docs
```

---

## Related Documents

- [development-workflow.md](../.ai/development-workflow.md) — Full development workflow
- [git-workflow.md](../.ai/git-workflow.md) — Branching and commit conventions
- [definition-of-done.md](../.ai/definition-of-done.md) — Completion checklist
