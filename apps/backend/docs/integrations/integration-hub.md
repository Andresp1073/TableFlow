# Enterprise Integration Hub

## Architecture

The Integration Hub is a DDD bounded context providing a unified abstraction over external system integrations. It follows Hexagonal Architecture with strict separation of domain, application, and infrastructure layers.

### Directory Structure

```
modules/integrations/
├── domain/
│   ├── models/            # Core domain entities and value objects
│   ├── events/            # Domain events
│   ├── repositories/      # Repository interfaces (contracts)
│   ├── services/          # Domain services (orchestration, adapters, health)
│   └── index.ts
├── application/
│   ├── dtos/              # Data transfer objects with mapper functions
│   ├── services/          # Application service (wraps domain)
│   └── index.ts
├── infrastructure/
│   ├── repositories/      # In-memory repository implementations
│   ├── providers/         # Provider adapter re-exports
│   └── index.ts
├── errors/                # Domain-specific error classes
├── tests/                 # Unit tests
└── index.ts
```

### Domain Models

| Model | Description |
|-------|-------------|
| `IntegrationDefinition` | Core entity defining an integration (type, status, capabilities, config) |
| `ConnectionProfile` | Connection credentials, lifecycle state, retry tracking |
| `IntegrationProvider` | Provider metadata (name, type, version, capabilities) |
| `IntegrationAdapter` | Adapter configuration for a provider |
| `IntegrationCapability` | Capability definition (import, export, sync, events, commands, scheduled) |
| `IntegrationContext` | Execution context for a single integration run |
| `IntegrationHealth` | Health check result with per-check details |

### Integration Types

- `erp` - Enterprise Resource Planning
- `crm` - Customer Relationship Management
- `pos` - Point of Sale
- `accounting` - Accounting systems
- `payments` - Payment gateways
- `marketing` - Marketing platforms
- `messaging` - Messaging services
- `analytics` - Analytics platforms
- `identity` - Identity providers
- `custom` - Custom integrations

### Integration States

```
Draft → Configured → Connected ↔ Disconnected
                        ↓
                      Failed
                        ↓
                     Archived
```

### Capability Model

| Capability | Category | Description |
|------------|----------|-------------|
| `data_import` | import | Import data from external system |
| `data_export` | export | Export data to external system |
| `synchronization` | sync | Bidirectional data sync |
| `events` | event | Subscribe to external events |
| `commands` | command | Send commands to external system |
| `scheduled_execution` | schedule | Scheduled data operations |

## Connection Lifecycle

1. **Create** - A `ConnectionProfile` is created in `pending` status
2. **Connect** - Transition to `connected` with authentication
3. **Health Check** - Periodic monitoring via `HealthMonitor`
4. **Disconnect** - Graceful `disconnected` transition
5. **Fail** - Error state with automatic retry (configurable `maxRetries`)
6. **Expire** - Credential expiry handling

### Authentication Types

- `api_key` - API key-based authentication
- `oauth2` - OAuth 2.0 flow
- `basic` - HTTP Basic Auth
- `bearer` - Bearer token
- `custom` - Custom authentication

## Domain Services

### IntegrationManager
Central orchestrator that coordinates all integration operations. Delegates to:

- **ConnectionManager** - Connection lifecycle management
- **HealthMonitor** - Health checking and monitoring
- **IntegrationOrchestrator** - Sync/async execution orchestration

### IntegrationProviderAdapter (Strategy Pattern)
Simulated adapters for all 10 integration types, each implementing:
- `execute()` - Run integration operation
- `validate()` - Validate configuration
- `checkHealth()` - Health check
- `getCapabilities()` - Capability discovery

### ConnectionManager
Manages connection lifecycle:
- Create, connect, disconnect, fail with retry
- Active profile discovery per integration
- Event emission (IntegrationConnected, IntegrationDisconnected, IntegrationFailed)

### HealthMonitor
Health checking service:
- Adapter-based health checks
- Health record persistence
- Unhealthy integration tracking

### IntegrationOrchestrator
Execution orchestration:
- Adapter lookup by integration type
- Execution context lifecycle
- Event emission (SynchronizationRequested, SynchronizationCompleted)

## Adapter Pattern

Each integration type has a simulated adapter implementing `IntegrationProviderAdapter`:

```
IntegrationProviderAdapter (interface)
├── ERPAdapter
├── CRMAdapter
├── POSAdapter
├── AccountingAdapter
├── PaymentsAdapter
├── MarketingAdapter
├── MessagingAdapter
├── AnalyticsAdapter
├── IdentityAdapter
└── CustomAdapter
```

## Events Published

| Event | Description |
|-------|-------------|
| `IntegrationCreated` | Integration definition created |
| `IntegrationConnected` | Connection established |
| `IntegrationDisconnected` | Connection closed |
| `IntegrationFailed` | Integration error occurred |
| `SynchronizationRequested` | Sync operation started |
| `SynchronizationCompleted` | Sync operation finished |

## Dependencies

- **Configuration Center** - Integration configuration storage
- **Secrets Management** - Credential references (`credentialsRef`)
- **Event Bus** - Domain event publishing
- **Monitoring Platform** - Health monitoring integration
- **Observability** - Execution context tracking
- **Scheduler** - Scheduled execution support

## Future Providers

The adapter pattern allows adding new provider types by:
1. Implementing `IntegrationProviderAdapter` interface
2. Registering with `IntegrationOrchestrator.registerAdapter()`
3. Adding the provider type to the `IntegrationType` union
4. Creating a corresponding `IntegrationProvider` definition

No changes to domain models, application service, or infrastructure are required.
