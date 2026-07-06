# Folder Structure

**Last updated:** 2026-07-04

## Complete Project Tree

```
TableFlow/
│
├── .ai/                              # AI knowledge base (20 files)
│   ├── README.md
│   ├── project-context.md
│   ├── project-goals.md
│   ├── architecture-principles.md
│   ├── coding-standards.md
│   ├── folder-structure.md
│   ├── naming-conventions.md
│   ├── git-workflow.md
│   ├── documentation-standards.md
│   ├── api-conventions.md
│   ├── database-conventions.md
│   ├── security-guidelines.md
│   ├── ui-guidelines.md
│   ├── testing-strategy.md
│   ├── definition-of-done.md
│   ├── tech-stack.md
│   ├── decision-log.md
│   ├── development-workflow.md
│   ├── prompt-rules.md
│   └── common-rules.md
│
├── .github/                          # GitHub configuration
│   ├── workflows/
│   │   ├── ci.yml                    # CI pipeline (lint, typecheck, test, build)
│   │   └── deploy.yml               # CD pipeline (deploy to staging/production)
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug-report.md
│   │   └── feature-request.md
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docs/                             # Project documentation
│   ├── architecture/                 # Architecture documentation (17 files)
│   │   ├── architecture-overview.md
│   │   ├── architecture-style.md
│   │   ├── frontend-architecture.md
│   │   ├── backend-architecture.md
│   │   ├── module-architecture.md
│   │   ├── folder-structure.md
│   │   ├── design-patterns.md
│   │   ├── coding-flow.md
│   │   ├── request-lifecycle.md
│   │   ├── dependency-rules.md
│   │   ├── configuration-management.md
│   │   ├── error-handling.md
│   │   ├── logging-strategy.md
│   │   ├── scalability.md
│   │   ├── security-architecture.md
│   │   ├── future-evolution.md
│   │   └── architecture-decisions.md
│   ├── README.md
│   ├── vision.md
│   ├── objectives.md
│   ├── project-scope.md
│   ├── stakeholders.md
│   ├── user-roles.md
│   ├── functional-requirements.md
│   ├── non-functional-requirements.md
│   ├── business-rules.md
│   ├── use-cases.md
│   ├── modules.md
│   ├── project-roadmap.md
│   ├── glossary.md
│   ├── roles.md
│   ├── permissions.md
│   ├── authorization-model.md
│   └── permission-matrix.md
│
├── packages/                         # Shared packages (monorepo)
│   └── shared/                       # Shared code between frontend and backend
│       ├── src/
│       │   ├── schemas/              # Zod schemas (shared validation)
│       │   │   ├── reservation.schema.ts
│       │   │   ├── customer.schema.ts
│       │   │   ├── user.schema.ts
│       │   │   ├── table.schema.ts
│       │   │   └── auth.schema.ts
│       │   ├── types/                # Shared types
│       │   │   ├── enums.ts          # ReservationStatus, TableStatus, UserRole
│       │   │   ├── pagination.ts
│       │   │   └── api-response.ts
│       │   ├── constants/            # Shared constants
│       │   │   ├── permissions.ts    # Permission definitions
│       │   │   └── errors.ts         # Error codes
│       │   └── utils/                # Shared utilities
│       │       ├── date.ts
│       │       └── validation.ts
│       ├── tsconfig.json
│       └── package.json
│
├── frontend/                         # React Single Page Application
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── robots.txt
│   │   └── manifest.json
│   ├── src/
│   │   ├── assets/                   # Static assets
│   │   │   ├── images/
│   │   │   ├── fonts/
│   │   │   └── icons/
│   │   ├── components/               # Reusable components
│   │   │   ├── ui/                   # Atomic primitives
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── Skeleton.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── index.ts
│   │   │   ├── layout/               # Layout components
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── AuthLayout.tsx
│   │   │   │   └── PageLayout.tsx
│   │   │   └── shared/               # Domain-agnostic composites
│   │   │       ├── SearchInput.tsx
│   │   │       ├── DateRangePicker.tsx
│   │   │       ├── StatusBadge.tsx
│   │   │       ├── ConfirmDialog.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       └── ErrorState.tsx
│   │   ├── features/                 # Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── pages/
│   │   │   │   ├── schemas/
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   ├── reservations/
│   │   │   ├── tables/
│   │   │   ├── customers/
│   │   │   ├── restaurants/
│   │   │   ├── branches/
│   │   │   ├── staff/
│   │   │   ├── reports/
│   │   │   ├── dashboard/
│   │   │   └── settings/
│   │   ├── hooks/                    # Global hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useDebounce.ts
│   │   │   └── useMediaQuery.ts
│   │   ├── services/                 # HTTP client services
│   │   │   ├── api.ts                # Axios instance
│   │   │   ├── reservation.service.ts
│   │   │   ├── table.service.ts
│   │   │   ├── customer.service.ts
│   │   │   └── ...
│   │   ├── stores/                   # Client state (Zustand)
│   │   │   ├── auth.store.ts
│   │   │   └── ui.store.ts
│   │   ├── lib/                      # Library configuration
│   │   │   ├── query-client.ts       # TanStack Query client
│   │   │   └── axios.ts              # Axios config
│   │   ├── types/                    # Global types
│   │   │   └── index.ts
│   │   ├── utils/                    # Utilities
│   │   │   ├── formatDate.ts
│   │   │   ├── cn.ts                 # className utility
│   │   │   └── formatCurrency.ts
│   │   ├── routes/                   # Route definitions
│   │   │   └── index.tsx
│   │   ├── styles/                   # Global styles
│   │   │   └── globals.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── package.json
│
├── backend/                          # Express REST API
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── modules/                  # Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.repository.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.validator.ts
│   │   │   │   ├── auth.dto.ts
│   │   │   │   ├── auth.types.ts
│   │   │   │   ├── auth.interfaces.ts
│   │   │   │   ├── __tests__/
│   │   │   │   └── index.ts
│   │   │   ├── reservations/
│   │   │   ├── tables/
│   │   │   ├── customers/
│   │   │   ├── restaurants/
│   │   │   ├── branches/
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── notifications/
│   │   │   ├── reports/
│   │   │   ├── dashboard/
│   │   │   ├── settings/
│   │   │   └── audit/
│   │   ├── common/                   # Cross-cutting concerns
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── rbac.middleware.ts
│   │   │   │   ├── validate.middleware.ts
│   │   │   │   ├── rateLimiter.middleware.ts
│   │   │   │   ├── errorHandler.middleware.ts
│   │   │   │   ├── requestLogger.middleware.ts
│   │   │   │   └── audit.middleware.ts
│   │   │   ├── errors/
│   │   │   │   └── AppError.ts
│   │   │   ├── interfaces/
│   │   │   │   ├── IRepository.ts
│   │   │   │   └── IService.ts
│   │   │   ├── types/
│   │   │   │   ├── express.d.ts
│   │   │   │   ├── pagination.ts
│   │   │   │   └── response.ts
│   │   │   └── utils/
│   │   │       ├── date.ts
│   │   │       ├── pagination.ts
│   │   │       ├── crypto.ts
│   │   │       └── token.ts
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   ├── database.ts
│   │   │   ├── auth.ts
│   │   │   ├── logger.ts
│   │   │   └── cors.ts
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   └── swagger.ts
│   │   ├── routes/
│   │   │   └── index.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── __tests__/
│   │   ├── integration/
│   │   ├── fixtures/
│   │   └── helpers/
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
│
├── docker/                           # Docker configuration
│   ├── backend/
│   │   └── Dockerfile
│   ├── frontend/
│   │   └── Dockerfile
│   ├── mysql/
│   │   └── init.sql
│   └── nginx/
│       └── default.conf
│
├── scripts/                          # Utility scripts
│   ├── seed.ts                       # Database seeding
│   ├── migrate.ts                    # Migration helper
│   ├── backup.ts                     # Database backup
│   └── restore.ts                    # Database restore
│
├── .editorconfig
├── .env.example                      # Environment variable template
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── docker-compose.yml
├── LICENSE
├── package.json                      # Monorepo root (workspaces)
├── README.md
└── tsconfig.base.json                # Shared TypeScript config
```

---

## Directory Responsibility Summary

| Directory | Responsibility |
|-----------|----------------|
| `.ai/` | AI assistant knowledge base — conventions, standards, decision log |
| `.github/` | CI/CD workflows, issue and PR templates |
| `docs/` | Project documentation — requirements, architecture, specifications |
| `docs/architecture/` | Software architecture — layers, patterns, decisions |
| `packages/shared/` | Shared code (Zod schemas, types, constants) used by both frontend and backend |
| `frontend/` | React SPA — all UI code |
| `backend/` | Express API — all server code |
| `docker/` | Dockerfiles and configuration for each service |
| `scripts/` | Utility scripts for development and operations tasks |
