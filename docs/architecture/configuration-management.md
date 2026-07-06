# Configuration Management

**Last updated:** 2026-07-04

## Principles

1. **All configuration is externalized.** No hardcoded values in the codebase.
2. **Environment variables are the source of truth** for runtime configuration.
3. **Validation at startup.** The system fails fast if required configuration is missing.
4. **Secrets never committed.** `.env` files are in `.gitignore`. Only `.env.example` is committed.

---

## Environment Variable Schema

All environment variables are validated at startup using Zod.

```
# ==========================================
# APPLICATION
# ==========================================
NODE_ENV=development|testing|production
PORT=3000
API_PREFIX=/api/v1

# ==========================================
# DATABASE
# ==========================================
DATABASE_URL=mysql://user:password@host:3306/tableflow

# ==========================================
# AUTHENTICATION
# ==========================================
JWT_SECRET=<min 32 characters>
JWT_ISSUER=tableflow
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

# ==========================================
# CORS
# ==========================================
CORS_ORIGIN=http://localhost:5173

# ==========================================
# SMTP (Email)
# ==========================================
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@tableflow.com

# ==========================================
# RATE LIMITING
# ==========================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# ==========================================
# LOGGING
# ==========================================
LOG_LEVEL=debug|info|warn|error
LOG_FORMAT=json|pretty
```

---

## Environment-Specific Configuration

### Development

```
NODE_ENV=development
DATABASE_URL=mysql://root:root@localhost:3306/tableflow_dev
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

**Characteristics:**
- Local MySQL server.
- Pretty-printed logs for readability.
- No email delivery (log emails instead).
- CORS allows local frontend dev server.

### Testing

```
NODE_ENV=testing
DATABASE_URL=mysql://root:root@localhost:3306/tableflow_test
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=silent
```

**Characteristics:**
- Separate test database (dropped and recreated before each test run).
- Logging disabled for performance.
- In-memory email service.
- Shortened timeouts for faster test feedback.

### Production

```
NODE_ENV=production
DATABASE_URL=mysql://user:@production-host:3306/tableflow_prod
JWT_SECRET=<managed by secrets manager>
CORS_ORIGIN=https://app.tableflow.com
LOG_LEVEL=info
LOG_FORMAT=json
```

**Characteristics:**
- Managed MySQL with read replicas.
- Secrets from secrets manager (Vault, AWS Secrets Manager, or environment).
- JSON logging for centralized log aggregation.
- Strict CORS with production frontend domain.

---

## Configuration File Structure

### `.env.example`

A template file committed to version control. Contains all variables with placeholder values. No real secrets.

```
JWT_SECRET=change-me-in-production
```

### `.env`

Actual environment variables. **Never committed to version control.** Added to `.gitignore`.

### `config/env.ts`

Zod schema that validates and parses all environment variables at startup.

```typescript
// config/env.ts — simplified structure
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'testing', 'production']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  CORS_ORIGIN: z.string(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const env = envSchema.parse(process.env);
```

---

## Secrets Management

| Environment | Secret Storage Method |
|-------------|----------------------|
| Development | `.env` file (local) |
| Testing | `.env.test` file (local) |
| CI | GitHub Secrets (CI environment variables) |
| Staging | Environment variables in deployment platform |
| Production | Secrets manager (AWS Secrets Manager / HashiCorp Vault) |

### Secret Rotation Policy

| Secret | Rotation Frequency |
|--------|--------------------|
| JWT signing key | Every 90 days |
| Database password | Every 180 days |
| SMTP credentials | Every 180 days |
| API keys | On compromise or annually |

---

## Configuration Access Pattern

All modules access configuration through the centralized `config/` module:

```typescript
// Good — centralized config access
import { env } from '@/config/env';
const port = env.PORT;

// Bad — direct process.env access
const port = process.env.PORT; // ❌
```

---

## Docker Configuration

Docker Compose passes environment variables to containers:

```yaml
# docker-compose.yml
services:
  backend:
    image: tableflow-backend
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://user:password@db:3306/tableflow
```

---

## Related Documents

- [security-guidelines.md](../.ai/security-guidelines.md) — Secrets management details
- [backend-architecture.md](./backend-architecture.md) — config/ directory role
- [deployment (future)] — Production configuration guide
