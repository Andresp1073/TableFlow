<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,100:06b6d4&height=200&section=header&text=TableFlow&fontSize=60&fontColor=ffffff&fontAlignY=35">
  <img alt="TableFlow" src="https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,100:06b6d4&height=200&section=header&text=TableFlow&fontSize=60&fontColor=ffffff&fontAlignY=35" width="100%">
</picture>

<p align="center">
  <strong>SaaS empresarial de reservas y gestión de mesas para restaurantes multi-sucursal</strong>
  <br>
  Construido con Clean Architecture, RBAC y aislamiento multi-tenant
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

## Descripción general

**TableFlow** es una plataforma SaaS de gestión de reservas de nivel empresarial, diseñada para grupos de restaurantes con múltiples ubicaciones. Proporciona gestión completa de mesas, ciclo de vida de reservas, perfiles de clientes y análisis operativos — todo asegurado con un sistema de control de acceso basado en roles (RBAC) de grano fino.

La plataforma sigue los principios de **Clean Architecture** y **Domain-Driven Design**, garantizando mantenibilidad, testabilidad y una separación clara de responsabilidades en toda la pila.

---

## Arquitectura

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
│  │   Auth   │  │   RBAC   │  │ Reserv.  │  │  Mesas   │   │
│  │  Módulo  │  │  Módulo  │  │  Módulo  │  │  Módulo  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Clientes  │  │ Auditoría│  │ Compart. │  │   ...    │   │
│  │  Módulo  │  │  Módulo  │  │  Capa    │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 Base de datos (MySQL 8)                      │
│  Prisma ORM · InnoDB · utf8mb4 · UUID v4 como PK            │
└─────────────────────────────────────────────────────────────┘
```

### Principios de diseño

| Principio | Aplicación |
|-----------|------------|
| **Clean Architecture** | Capas de dominio, aplicación e infraestructura con reglas de dependencia estrictas |
| **Domain-Driven Design** | Modelos, repositorios y servicios por contexto delimitado |
| **RBAC** | Permisos de grano fino con asignaciones rol-permiso-usuario |
| **Multi-Tenancy** | Datos aislados por organización con separación entre inquilinos |
| **API-First** | Contratos OpenAPI exhaustivos que definen todos los endpoints |
| **Security-First** | Rotación de JWT, hashing con bcrypt, limitación de tasa, bloqueo de cuenta |

---

## Stack tecnológico

### Frontend

| Tecnología | Propósito |
|------------|-----------|
| **React 19** | Librería UI |
| **TypeScript** (modo estricto) | Seguridad de tipos |
| **Vite 6** | Herramienta de build y servidor de desarrollo |
| **TailwindCSS 3** | Estilos utilitarios |
| **TanStack Query 5** | Gestión de estado del servidor |
| **React Router v7** | Enrutamiento del lado del cliente |
| **Axios** | Cliente HTTP |

### Backend

| Tecnología | Propósito |
|------------|-----------|
| **Node.js 20** | Entorno de ejecución |
| **Express** | Framework HTTP |
| **TypeScript** (modo estricto) | Seguridad de tipos |
| **Prisma 6** | ORM y migraciones |
| **MySQL 8** | Base de datos (InnoDB, utf8mb4) |
| **Zod** | Validación de peticiones |
| **JWT** | Autenticación con tokens de acceso y refresco |
| **bcryptjs** | Hashing de contraseñas |
| **Pino** | Logging estructurado |
| **Vitest** | Tests unitarios y de integración |

### Infraestructura

| Tecnología | Propósito |
|------------|-----------|
| **Docker** | Contenerización |
| **Docker Compose** | Orquestación de desarrollo local |
| **Nginx** | Proxy inverso |
| **pnpm workspaces** | Gestión del monorepositorio |

---

## Estructura del proyecto

```
tableflow/
├── apps/
│   ├── frontend/                  # React SPA (puerto 3000)
│   │   ├── src/
│   │   │   ├── components/        # Componentes UI compartidos
│   │   │   ├── features/          # Módulos funcionales
│   │   │   ├── hooks/             # Hooks personalizados
│   │   │   ├── layouts/           # Componentes de layout
│   │   │   ├── pages/             # Páginas de ruta
│   │   │   ├── services/          # Cliente API (Axios)
│   │   │   ├── types/             # Tipos específicos del frontend
│   │   │   └── utils/             # Utilidades
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── tailwind.config.ts
│   │
│   └── backend/                   # Express API (puerto 4000)
│       ├── prisma/
│       │   └── schema.prisma      # Esquema completo del dominio (675 líneas)
│       ├── src/
│       │   ├── config/            # Env, logger, base de datos, constantes
│       │   ├── errors/            # Jerarquía de errores (AppError base)
│       │   ├── events/            # Bus de eventos
│       │   ├── middlewares/        # Auth, validación, limitador de tasa, error handler
│       │   ├── modules/           # Módulos funcionales (auth, autorización, compartido)
│       │   │   ├── auth/          # Servicio de autenticación, repositorio, controlador
│       │   │   ├── authorization/ # RBAC: roles, permisos, asignaciones, middleware
│       │   │   └── shared/        # BaseRepository, BaseService
│       │   ├── routes/            # Agregadores de rutas
│       │   ├── types/             # Tipos específicos del backend
│       │   └── utils/             # Async handler, helpers de fecha
│       ├── vitest.config.ts
│       └── package.json
│
├── packages/
│   ├── shared/                    # Constantes, enums y helpers entre apps
│   ├── types/                     # DTOs e interfaces compartidas
│   ├── ui/                        # Primitivas UI compartidas
│   └── config/                    # Configuración compartida
│
├── docker/
│   ├── docker-compose.yml         # Orquestación MySQL + servicios
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
│
├── scripts/
│   ├── setup.ps1                  # Configuración con un solo comando
│   └── dev.ps1                    # Inicio del entorno de desarrollo
│
├── docs/                          # Documentación exhaustiva
│   ├── api/                       # Contratos API, estándares, especificación OpenAPI
│   ├── architecture/              # Decisiones arquitectónicas, patrones, módulos
│   ├── authorization/             # Documentación RBAC: roles, permisos, asignación
│   ├── database/                  # Esquema, convenciones, índices, migraciones
│   └── ...                        # Requisitos, glosario, roadmap, casos de uso
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

---

## Funcionalidades

### Autenticación y Seguridad
- Rotación de tokens JWT access + refresh con seguimiento familiar
- Hashing de contraseñas con bcrypt
- Bloqueo de cuenta tras intentos fallidos configurables
- Restablecimiento de contraseña con tokens de un solo uso
- Flujo de verificación de email
- Limitación de tasa en endpoints de autenticación
- Gestión de sesiones (listar, revocar, revocar todas)

### Autorización (RBAC)
- **Catálogo de permisos** — permisos granulares con notación de punto (`reservations.create`, `users.read`)
- **Gestión de roles** — roles de sistema vs restaurante con prioridad, estado, color
- **Asignación Rol-Permiso** — asignación masiva, reemplazo, validación
- **Asignación Usuario-Rol** — multi-tenant: diferentes roles por restaurante
- **Middleware de autorización** — `requirePermission`, `requireRole`, `requireRestaurantAccess`
- **Caching por petición** — caché de permisos basada en WeakMap
- **Aislamiento multi-tenant** — roles y datos aislados por organización

### Módulos planeados
- **Reservas** — ciclo de vida completo (pendiente → confirmada → sentado → completada)
- **Mesas** — plano del piso con zonas, formas, capacidad
- **Clientes** — gestión de perfiles con historial de visitas
- **Sucursales** — soporte multi-ubicación con horarios operativos
- **Notificaciones** — plantillas de email/SMS y envío
- **Reportes y Analytics** — métricas agregadas y exportaciones
- **Auditoría** — registro de eventos inmutable

---

## Inicio rápido

### Requisitos previos

- **Node.js** >= 20
- **pnpm** >= 9 (`npm install -g pnpm`)
- **Docker Desktop** (para MySQL)

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Andresp1073/TableFlow.git
cd TableFlow

# 2. Instalar dependencias
pnpm install

# 3. Iniciar MySQL
docker compose -f docker/docker-compose.yml up -d mysql

# 4. Configurar entorno
cp apps/backend/.env.example apps/backend/.env
# Editar apps/backend/.env si es necesario (los valores por defecto funcionan para desarrollo local)

# 5. Generar cliente Prisma y subir esquema
pnpm --filter @tableflow/backend db:generate
pnpm --filter @tableflow/backend db:push

# 6. (Opcional) Sembrar la base de datos
pnpm --filter @tableflow/backend db:seed

# 7. Iniciar servidores de desarrollo
pnpm dev
```

El frontend estará disponible en **http://localhost:3000** y la API backend en **http://localhost:4000**.

### Alternativa: Instalación automatizada (Windows)

```powershell
.\scripts\setup.ps1
```

---

## Referencia de comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia frontend + backend concurrentemente |
| `pnpm dev:frontend` | Inicia solo el frontend (puerto 3000) |
| `pnpm dev:backend` | Inicia solo el backend (puerto 4000) |
| `pnpm build` | Compila todos los paquetes y apps |
| `pnpm lint` | Ejecuta ESLint en todos los paquetes |
| `pnpm lint:fix` | Corrige errores de lint automáticamente |
| `pnpm format` | Formatea código con Prettier |
| `pnpm format:check` | Verifica formato sin cambios |
| `pnpm typecheck` | Ejecuta verificación de tipos TypeScript |
| `pnpm test` | Ejecuta todos los tests (Vitest) |
| `pnpm clean` | Limpia artefactos de build (dist, .tsbuildinfo) |
| `pnpm db:migrate` | Ejecuta migraciones de Prisma |
| `pnpm db:push` | Sube el esquema Prisma a la base de datos |
| `pnpm db:studio` | Abre Prisma Studio GUI |
| `pnpm db:seed` | Siembra la base de datos con datos iniciales |
| `pnpm db:reset` | Reinicia la base de datos (borra todos los datos) |
| `pnpm docker:up` | Inicia todos los servicios Docker |
| `pnpm docker:down` | Detiene todos los servicios Docker |

---

## Variables de entorno

### Backend (`apps/backend/.env`)

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `NODE_ENV` | `development` | Entorno de ejecución |
| `PORT` | `4000` | Puerto del servidor |
| `HOST` | `0.0.0.0` | Host del servidor |
| `DATABASE_URL` | — | Cadena de conexión MySQL |
| `JWT_SECRET` | — | Secreto para firmar JWT |
| `JWT_EXPIRES_IN` | `15m` | Duración del token de acceso |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Duración del token de refresco |
| `CORS_ORIGIN` | `http://localhost:3000` | Origen CORS permitido |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Ventana de limitación de tasa (15 min) |
| `RATE_LIMIT_MAX` | `100` | Máximo de peticiones por ventana |

### Frontend (`apps/frontend/.env`)

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `VITE_API_URL` | `/api/v1` | URL base de la API |

---

## Tests

El proyecto usa **Vitest** con entorno Node para tests unitarios y de integración.

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar un archivo específico
pnpm --filter @tableflow/backend test -- src/modules/auth/auth.service.spec.ts

# Ejecutar tests en modo watch
pnpm --filter @tableflow/backend test:watch

# Cobertura actual: 298 tests en 11 archivos
```

### Estructura de tests
- **Tests unitarios** — co-ubicados con archivos fuente (`*.spec.ts`)
- **Tests de validación** — pruebas de funciones puras para lógica de dominio
- **Tests de servicios** — repositorios mockeados para lógica de negocio
- **Tests de middleware** — req/res/next mockeados de Express
- **Tests de integración** — petición-respuesta completa con base de datos real (`*.test.ts`)

---

## Documentación

La documentación completa está disponible en el directorio [`docs/`](docs/):

- [Visión general de la API](docs/api/api-overview.md) — Estándares API, paginación, filtrado, ordenamiento
- [Catálogo de endpoints](docs/api/endpoint-catalog.md) — Referencia completa de la API con 1900+ líneas
- [Catálogo de errores](docs/api/error-catalog.md) — Todos los códigos de error y respuestas
- [Arquitectura de autorización](docs/authorization/authorization-architecture.md) — Diseño RBAC
- [Catálogo de permisos](docs/authorization/permission-catalog.md) — Todos los permisos definidos
- [Roles](docs/authorization/roles.md) — Definiciones de roles de sistema y restaurante
- [Asignación usuario-rol](docs/authorization/user-role-assignment.md) — Ciclo de vida de asignación
- [Esquema de base de datos](docs/database/database-overview.md) — Relaciones de entidades y diseño
- [Decisiones arquitectónicas](docs/architecture/architecture-decisions.md) — Decisiones técnicas clave

---

## Despliegue con Docker

### Build de producción

```bash
# Construir e iniciar todos los servicios
docker compose -f docker/docker-compose.yml up -d --build

# Servicios:
# - MySQL 8 en puerto 3306
# - Backend API en puerto 4000
# - Frontend SPA en puerto 3000 (vía Nginx)
```

---

## Contribuir

1. Haz fork del repositorio
2. Crea una rama de funcionalidad (`git checkout -b feat/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'feat: agrega nueva funcionalidad'`)
4. Sube la rama (`git push origin feat/nueva-funcionalidad`)
5. Abre un Pull Request

### Convención de commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(authz): implementar asignación de roles a usuarios
fix(auth): evitar reutilización de tokens después de rotación
docs(api): actualizar catálogo de endpoints
test(auth): agregar tests de bloqueo de cuenta
```

---

## Licencia

Este proyecto está licenciado bajo [MIT License](LICENSE).

---

<p align="center">
  Construido con ❤️ para operadores de restaurantes en todo el mundo
</p>
