<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,100:06b6d4&height=200&section=header&text=TableFlow&fontSize=60&fontColor=ffffff&fontAlignY=35">
  <img alt="TableFlow" src="https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,100:06b6d4&height=200&section=header&text=TableFlow&fontSize=60&fontColor=ffffff&fontAlignY=35" width="100%">
</picture>

<p align="center">
  <strong>Enterprise Multi-Restaurant Reservation & Table Management SaaS</strong>
  <br>
  Built with Clean Architecture, RBAC, and Multi-Tenant Isolation
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white" alt="pnpm">
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" alt="Docker">
</p>

---

## Overview

**TableFlow** is a comprehensive, enterprise-grade reservation management platform designed for multi-location restaurant groups. It provides end-to-end table management, reservation lifecycle handling, customer profiles, and operational analytics — all secured with a fine-grained Role-Based Access Control (RBAC) system.

The platform follows **Clean Architecture** and **Domain-Driven Design** principles, ensuring maintainability, testability, and clear separation of concerns across the entire stack.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React SPA)                      │
│  React 19 · TypeScript · Vite · TailwindCSS · TanStack Query│
│  React Router v7 · Axios                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/JSON (REST)
┌──────────────────────▼──────────────────────────────────────┐
│                    Backend (Express API)                     │
│  Node.js · TypeScript · Prisma ORM · Zod · JWT              │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │   RBAC   │  │Reserv.   │  │  Tables  │   │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Customers │  │  Audit   │  │  Shared  │  │   ...    │   │
│  │  Module  │  │  Module  │  │  Layer   │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 Database (MySQL 8)                           │
│  Prisma ORM · InnoDB · utf8mb4 · UUID v4 PKs                │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

| Principle | Application |
|-----------|-------------|
| **Clean Architecture** | Domain, Application, Infrastructure layers with strict dependency rules |
| **Domain-Driven Design** | Models, repositories, services per bounded context |
| **RBAC** | Fine-grained permissions with role-permission-user assignments |
| **Multi-Tenancy** | Organization-scoped data with cross-tenant isolation |
| **API-First** | Comprehensive OpenAPI contracts define all endpoints |
| **Security-First** | JWT rotation, bcrypt hashing, rate limiting, account lockout |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 19** | UI library |
| **TypeScript** (strict mode) | Type safety |
| **Vite 6** | Build tool & dev server |
| **TailwindCSS 3** | Utility-first styling |
| **TanStack Query 5** | Server state management |
| **React Router v7** | Client-side routing |
| **Axios** | HTTP client |

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js 20** | Runtime |
| **Express** | HTTP framework |
| **TypeScript** (strict mode) | Type safety |
| **Prisma 6** | ORM & migrations |
| **MySQL 8** | Database (InnoDB, utf8mb4) |
| **Zod** | Request validation |
| **JWT** | Access & refresh token auth |
| **bcryptjs** | Password hashing |
| **Pino** | Structured logging |
| **Vitest** | Unit & integration testing |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Local development orchestration |
| **Nginx** | Reverse proxy |
| **pnpm workspaces** | Monorepo management |

---

## Project Structure

```
tableflow/
├── apps/
│   ├── frontend/                  # React SPA (port 3000)
│   │   ├── src/
│   │   │   ├── components/        # Shared UI components
│   │   │   ├── features/          # Feature modules
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   ├── layouts/           # Layout components
│   │   │   ├── pages/             # Route pages
│   │   │   ├── services/          # API client (Axios)
│   │   │   ├── types/             # Frontend-specific types
│   │   │   └── utils/             # Utilities
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── tailwind.config.ts
│   │
│   └── backend/                   # Express API (port 4000)
│       ├── prisma/
│       │   └── schema.prisma      # Complete domain schema (675 lines)
│       ├── src/
│       │   ├── config/            # Env, logger, database, constants
│       │   ├── errors/            # Error hierarchy (AppError base)
│       │   ├── events/            # Event bus
│       │   ├── middlewares/        # Auth, validation, rate limiter, error handler
│       │   ├── modules/           # Feature modules (auth, authorization, shared)
│       │   │   ├── auth/          # Auth service, repository, controller
│       │   │   ├── authorization/ # RBAC: roles, permissions, assignments, middleware
│       │   │   └── shared/        # BaseRepository, BaseService
│       │   ├── routes/            # Route aggregators
│       │   ├── types/             # Backend-specific types
│       │   └── utils/             # Async handler, date helpers
│       ├── vitest.config.ts
│       └── package.json
│
├── packages/
│   ├── shared/                    # Cross-app constants, enums, helpers
│   ├── types/                     # Shared DTOs and interfaces
│   ├── ui/                        # Shared UI primitives
│   └── config/                    # Shared configuration
│
├── docker/
│   ├── docker-compose.yml         # MySQL + services orchestration
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
│
├── scripts/
│   ├── setup.ps1                  # One-command project setup
│   └── dev.ps1                    # Development environment start
│
├── docs/                          # Comprehensive documentation
│   ├── api/                       # API contracts, standards, OpenAPI spec
│   ├── architecture/              # Architecture decisions, patterns, modules
│   ├── authorization/             # RBAC docs: roles, permissions, assignment
│   ├── database/                  # Schema, conventions, indexes, migrations
│   └── ...                        # Requirements, glossary, roadmap, use cases
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

---

## Features

### Authentication & Security
- JWT access + refresh token rotation with family tracking
- bcrypt password hashing
- Account lockout after configurable failed attempts
- Password reset with one-time tokens
- Email verification flow
- Rate limiting on auth endpoints
- Session management (list, revoke, revoke all)

### Authorization (RBAC)
- **Permission Catalog** — granular dot-notation permissions (`reservations.create`, `users.read`)
- **Role Management** — system vs restaurant roles with priority, status, color
- **Role-Permission Assignment** — bulk assign, replace, validate
- **User-Role Assignment** — multi-tenant: different roles per restaurant
- **Authorization Middleware** — `requirePermission`, `requireRole`, `requireRestaurantAccess`
- **Request-level caching** — WeakMap-based permission cache per request
- **Multi-tenant isolation** — organization-scoped roles and data

### Planned Modules
- **Reservations** — full lifecycle (pending → confirmed → seated → completed)
- **Tables** — floor plan with zones, shapes, capacity
- **Customers** — profile management with visit history
- **Branches** — multi-location support with operating hours
- **Notifications** — email/SMS templates and delivery
- **Reports & Analytics** — aggregated metrics and exports
- **Audit Logging** — immutable event log

---

## Quick Start

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 (`npm install -g pnpm`)
- **Docker Desktop** (for MySQL)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/Andresp1073/TableFlow.git
cd TableFlow

# 2. Install dependencies
pnpm install

# 3. Start MySQL
docker compose -f docker/docker-compose.yml up -d mysql

# 4. Configure environment
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env to match your setup (defaults work for local dev)

# 5. Generate Prisma client & push schema
pnpm --filter @tableflow/backend db:generate
pnpm --filter @tableflow/backend db:push

# 6. (Optional) Seed the database
pnpm --filter @tableflow/backend db:seed

# 7. Start development servers
pnpm dev
```

The frontend will be available at **http://localhost:3000** and the backend API at **http://localhost:4000**.

### Alternative: Automated Setup (Windows)

```powershell
.\scripts\setup.ps1
```

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start frontend + backend concurrently |
| `pnpm dev:frontend` | Start frontend only (port 3000) |
| `pnpm dev:backend` | Start backend only (port 4000) |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check formatting without changes |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run all tests (Vitest) |
| `pnpm clean` | Clean all build artifacts (dist, .tsbuildinfo) |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:studio` | Open Prisma Studio GUI |
| `pnpm db:seed` | Seed database with initial data |
| `pnpm db:reset` | Reset database (drops all data) |
| `pnpm docker:up` | Start all Docker services |
| `pnpm docker:down` | Stop all Docker services |

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `4000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `DATABASE_URL` | — | MySQL connection string |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

### Frontend (`apps/frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api/v1` | API base URL |

---

## Testing

The project uses **Vitest** with Node environment for both unit and integration tests.

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm --filter @tableflow/backend test -- src/modules/auth/auth.service.spec.ts

# Run tests in watch mode
pnpm --filter @tableflow/backend test:watch

# Current coverage: 298 tests across 11 test files
```

### Test Structure
- **Unit tests** — co-located with source files (`*.spec.ts`)
- **Validation tests** — pure function testing for domain logic
- **Service tests** — mocked repositories for business logic
- **Middleware tests** — mocked Express req/res/next
- **Integration tests** — full request-response with real database (`*.test.ts`)

---

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- [API Overview](docs/api/api-overview.md) — API standards, pagination, filtering, sorting
- [Endpoint Catalog](docs/api/endpoint-catalog.md) — Complete API reference with 1900+ lines
- [Error Catalog](docs/api/error-catalog.md) — All error codes and responses
- [Authorization Architecture](docs/authorization/authorization-architecture.md) — RBAC design
- [Permission Catalog](docs/authorization/permission-catalog.md) — All permissions defined
- [Roles](docs/authorization/roles.md) — System and restaurant role definitions
- [User Role Assignment](docs/authorization/user-role-assignment.md) — Assignment lifecycle
- [Database Schema](docs/database/database-overview.md) — Entity relationships and design
- [Architecture Decisions](docs/architecture/architecture-decisions.md) — Key technical decisions

---

## Docker Deployment

### Production Build

```bash
# Build and start all services
docker compose -f docker/docker-compose.yml up -d --build

# Services:
# - MySQL 8 on port 3306
# - Backend API on port 4000
# - Frontend SPA on port 3000 (via Nginx)
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(authz): implement user role assignment
fix(auth): prevent token reuse after rotation
docs(api): update endpoint catalog
test(auth): add account lockout tests
```

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ for restaurant operators everywhere
</p>
