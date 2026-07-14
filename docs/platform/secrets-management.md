# Secrets Management

## Architecture

The Secrets Management module provides a centralized, extensible system for managing sensitive credentials across the TableFlow platform. It follows Clean Architecture and Dependency Inversion principles.

```
┌─────────────────────────────────────────────────────────────┐
│                     Business Modules                         │
│              (depend only on SecretProvider)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    SecretProvider                             │
│              (interface — dependency inversion)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     SecretManager                             │
│   ┌───────────┬─────────────┬──────────┬────────────────┐    │
│   │ Secret    │ Secret      │ Secret   │ Secret         │    │
│   │ Resolver  │ Validator   │ Cache    │ RotationPolicy │    │
│   └─────┬─────┴──────┬──────┴────┬─────┴────────┬───────┘    │
│         │            │           │              │            │
│   ┌─────▼────┐ ┌─────▼─────┐ ┌──▼───┐  ┌───────▼───────┐   │
│   │ Env Vars │ │ Config    │ │Cache │  │ Rotation      │   │
│   │ Source   │ │ Source    │ │Found.│  │ Policies      │   │
│   └──────────┘ └───────────┘ └──────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Responsibility |
|---|---|
| **SecretProvider** | Interface consumed by business modules. Provides `getSecret`, `getSecretOrFail`, `hasSecret`, `getSecretMetadata`, `refreshSecret`, `getRotationStatus`. |
| **SecretManager** | Main orchestrator implementing `SecretProvider`. Manages sources, registration, rotation, validation, caching, and event publishing. |
| **SecretResolver** | Resolves secrets from configured sources in priority order. First source to return a value wins. |
| **SecretValidator** | Validates secret structure, required fields, format constraints, expiration, and version integrity per secret type. |
| **SecretCache** | Wraps the Cache Foundation with secret-specific TTL, prefix isolation, and cache-aside pattern via `getOrFetch`. |
| **SecretRotationPolicy** | Defines rotation rules: max age, expiry threshold, version retention, auto-rotation window, and approval requirements. |

## Secret Lifecycle

```
  ┌──────────┐
  │ Register │  → Secret registered with metadata and type
  └────┬─────┘
       │
  ┌────▼─────┐
  │  Load    │  → Resolved from sources (env → config → vault → ...)
  └────┬─────┘
       │
  ┌────▼──────┐
  │  Cache    │  → Cached with configurable TTL
  └────┬──────┘
       │
  ┌────▼─────────┐
  │  Validate    │  → Required fields, format, expiration, version
  └────┬─────────┘
       │
  ┌────▼────────┐
  │  Rotate     │  → New version created, old version marked "previous"
  └────┬────────┘
       │
  ┌────▼──────────┐
  │  Expire/Retire│  → Secret expires, rotation required, notification sent
  └───────────────┘
```

### Events Published

| Event | Trigger |
|---|---|
| `secret.loaded` | Secret resolved from source and cached |
| `secret.rotated` | Secret rotated via `rotateSecret()` |
| `secret.expired` | Secret past its `expiresAt` date (detected during validation) |
| `secret.validation_failed` | Validation check failed |

## Secret Types

| Type | Prefix | Required Fields |
|---|---|---|
| `database_credentials` | `db_` | host, port, username, password, database |
| `jwt_signing_key` | `jwt_` | key, algorithm |
| `api_key` | `api_` | key |
| `smtp_credentials` | `smtp_` | host, port, username, password |
| `storage_credentials` | `storage_` | accessKeyId, secretAccessKey |
| `webhook_secret` | `wh_` | secret |
| `encryption_key` | `enc_` | key, algorithm |
| `oauth_client_secret` | `oauth_` | clientId, clientSecret |

## Rotation Strategy

### Configuration

```typescript
interface SecretRotationPolicyConfig {
  maxAgeMs: number;              // Maximum age before rotation required (default: 90 days)
  rotateBeforeExpiryMs: number;  // How far before expiry to trigger rotation (default: 7 days)
  versionsToKeep: number;        // Number of previous versions to retain (default: 2)
  autoRotate: boolean;           // Automatically rotate within allowed window
  notifyOnRotation: boolean;     // Publish notification events
  allowedRotationWindow?: {      // Restrict rotation to a time window
    start: string;               // e.g. "02:00"
    end: string;                 // e.g. "05:00"
  };
  requireApproval?: boolean;     // Require manual approval for rotation
}
```

### Statuses

| Status | Description |
|---|---|
| `ok` | Secret is valid and within all thresholds |
| `expiring_soon` | Within `rotateBeforeExpiryMs` of expiration |
| `expired` | Past expiration date |
| `rotation_required` | Secret version exceeds `maxAgeMs` or is outside expiry threshold |
| `compromised` | Marked as compromised — rotation bypasses all guards |

### Helper Functions

- `shouldRotate(status)` — Returns true if status requires rotation
- `isRotationAllowed(status)` — Checks auto-rotate flag and time window
- `requiresApproval(status)` — Returns true if manual approval needed (compromised bypasses)

## Source Priority Order

Sources are queried in ascending priority order. The first source to return a non-null value wins.

| Source | Default Priority | Enabled by Default | Status |
|---|---|---|---|
| Environment Variables | 10 | ✅ Yes | Implemented |
| Configuration Center | 20 | ✅ Yes | Implemented |
| HashiCorp Vault | 30 | ❌ No | Future |
| AWS Secrets Manager | 40 | ❌ No | Future |
| Azure Key Vault | 50 | ❌ No | Future |
| Google Secret Manager | 60 | ❌ No | Future |
| Kubernetes Secrets | 70 | ❌ No | Future |

```typescript
const DEFAULT_SECRET_SOURCE_PRIORITY: SecretSourceConfig[] = [
  { name: "environment", priority: 10, enabled: true },
  { name: "configuration", priority: 20, enabled: true },
  { name: "vault", priority: 30, enabled: false },
  { name: "aws-secrets-manager", priority: 40, enabled: false },
  { name: "azure-key-vault", priority: 50, enabled: false },
  { name: "gcp-secret-manager", priority: 60, enabled: false },
  { name: "kubernetes", priority: 70, enabled: false },
];
```

## Environment Variables

Secrets can be defined as environment variables with the `SECRET_` prefix:

```bash
# API Key (plain string)
SECRET_API_STRIPE=sk_live_abc123

# Structured secrets as JSON
SECRET_DB_MAIN={"host":"db.example.com","port":5432,"username":"app","password":"s3cret","database":"tableflow","ssl":true}
SECRET_JWT_MAIN={"key":"my-signing-key","algorithm":"HS256"}
```

The environment key is derived by uppercasing the secret key and replacing `.-` with `_`:
- `db_main` → `SECRET_DB_MAIN`
- `jwt_auth` → `SECRET_JWT_AUTH`

## Configuration Center

Secrets can be defined via the Configuration Center under the `secrets.` prefix:

```typescript
configProvider.registerSchema({
  key: "secrets.db_main",
  type: "object",
  properties: {
    host: { key: "host", type: "string", required: true },
    port: { key: "port", type: "number", required: true },
    username: { key: "username", type: "string", required: true },
    password: { key: "password", type: "string", required: true, secret: true },
    database: { key: "database", type: "string", required: true },
  },
});
```

## Cache Integration

Reuses the Cache Foundation module with the `secret:` prefix. Configurable TTL (default: 300s).

```typescript
manager.setCacheProvider(cacheProvider, { ttlMs: 60000, enabled: true });
```

## Usage

### Registration

```typescript
const secretsManager = new SecretManager();

// Add sources
secretsManager.addSource(new EnvironmentSource());
secretsManager.addSource(new ConfigurationSource(configProvider));

// Register secret metadata
secretsManager.registerSecret({
  key: "db_main",
  type: SecretType.DatabaseCredentials,
  name: "Main Database",
  currentVersion: 1,
  versions: [{ version: 1, value: dbCredentials, createdAt: new Date(), status: "active" }],
});
```

### Consumption (via SecretProvider)

```typescript
const dbCredentials = await secretsManager.provider.getSecret<DatabaseCredentials>(
  "db_main",
  SecretType.DatabaseCredentials,
);
// Returns typed credentials or null
```

### Rotation

```typescript
const newCredentials: DatabaseCredentials = { host: "new-host", ... };
const rotated = await secretsManager.rotateSecret("db_main", newCredentials, "admin@example.com");
```

### Validation

```typescript
const result = await secretsManager.validateSecret("db_main");
// result.valid, result.errors, result.warnings
```

## Error Handling

| Error | Code | When |
|---|---|---|
| `SecretNotFoundError` | SECRET_NOT_FOUND | Secret not found in any source |
| `SecretExpiredError` | SECRET_EXPIRED | Secret past expiration |
| `SecretValidationFailedError` | SECRET_VALIDATION_FAILED | Validation errors during rotation |
| `SecretRotationFailedError` | SECRET_ROTATION_FAILED | Rotation rejected by policy |

## Future Providers

The `SecretSource` interface enables adding new providers without modifying existing code:

```typescript
interface SecretSource {
  readonly name: string;
  readonly priority: number;
  readonly enabled: boolean;
  get(type: SecretType, key: string): Promise<Secret | null>;
  has(type: SecretType, key: string): Promise<boolean>;
  getAll(): Promise<Secret[]>;
}
```

To add a new provider:
1. Implement `SecretSource`
2. Add to `DEFAULT_SECRET_SOURCE_PRIORITY` with appropriate priority
3. Register via `secretsManager.addSource(new YourProvider())`
