# Enterprise Payments Platform

## Architecture

The Payments Platform is an independent bounded context within TableFlow, designed
following Clean Architecture and Domain-Driven Design principles. It provides a
secure, extensible payment orchestration layer that abstracts away provider-specific
implementation details behind a uniform adapter interface.

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                   │
│            (REST endpoints — future scope)            │
├─────────────────────────────────────────────────────┤
│                 Application Layer                     │
│   PaymentManager    PaymentProviderService           │
│   RefundManager     EventPublisher                   │
├─────────────────────────────────────────────────────┤
│                  Domain Layer                         │
│   PaymentTransaction   PaymentIntent   PaymentMethod │
│   PaymentProvider      PaymentResult   RefundRequest │
│   PaymentPolicy                                      │
│   PaymentLifecycleManager   PaymentFraudCheck        │
│   RefundPolicyService       PaymentValidationService │
├─────────────────────────────────────────────────────┤
│               Infrastructure Layer                   │
│   BasePaymentAdapter       StripeProvider            │
│   AdyenProvider            MercadoPagoProvider       │
│   SquarePaymentsProvider   PayPalProvider            │
│   BankProvider                                       │
│   InMemoryPaymentRepositories                        │
└─────────────────────────────────────────────────────┘
```

## Payment Lifecycle

```
Created → Pending → Authorized → Captured → Refunded
                ↘        ↘           ↘
                 Failed   Cancelled    Failed
```

| Status    | Description                                   |
|-----------|-----------------------------------------------|
| Created   | Transaction record initialized                |
| Pending   | Awaiting provider authorization               |
| Authorized| Funds held by provider, not yet captured      |
| Captured  | Funds captured from customer                  |
| Failed    | Transaction failed at any stage               |
| Cancelled | Transaction cancelled before capture          |
| Refunded  | Full or partial refund completed              |
| Expired   | Authorization window expired                  |

## Provider Adapters

Each payment provider implements the `PaymentAdapter` interface:

| Method          | Description                        |
|-----------------|------------------------------------|
| createPayment   | Initialize payment with provider   |
| authorize       | Hold funds (authorization)         |
| capture         | Capture authorized funds           |
| cancel          | Cancel pending/authorized payment  |
| refund          | Process full or partial refund     |
| verifyStatus    | Check current status from provider |

### Supported Providers (prepared, not integrated)

| Provider       | ID                | Type     |
|----------------|-------------------|----------|
| Stripe         | stripe            | Processor|
| Adyen          | adyen             | Processor|
| Mercado Pago   | mercadopago       | Processor|
| Square Payments| square_payments   | Processor|
| PayPal         | paypal            | Wallet   |
| Bank Transfer  | bank_transfer     | Manual   |

## Security Model

### Tokenization
- Payment adapters prepare support for tokenization where required
- Sensitive payment data is never stored in TableFlow
- Provider references are stored instead of raw payment details

### Sensitive Data Isolation
- Payment module does not accept or store raw card numbers (PAN)
- Tokenized references used throughout the system
- PCI scope is limited to the provider integration layer

### Payment Audit Trail
- Full transaction lifecycle is recorded via domain events
- Every status transition, refund, and cancellation emits events
- Events are consumed by the Audit module for compliance

### Fraud Detection Extension Point
```typescript
interface FraudCheckExtension {
  name: string;
  check(input: FraudCheckInput): Promise<FraudCheckResult>;
}
```
- Register custom fraud checks via `PaymentFraudCheck.registerExtension()`
- Risk levels: Low, Medium, High, Critical
- Critical risk blocks the transaction automatically

## Refund Workflow

```
RefundRequest (Pending)
    │
    ├── requiresApproval=false → Approved
    │       │
    │       └── Processing → Completed / Failed
    │
    └── requiresApproval=true → Pending
            │
            ├── approve() → Approved → Processing → Completed / Failed
            └── reject() → Rejected
```

### Refund Types
- **Full Refund**: Entire transaction amount
- **Partial Refund**: Portion of transaction amount

### Refund Policies
- Configurable approval thresholds
- Maximum refund window (days since capture)
- Maximum retry attempts

## Domain Models

### PaymentTransaction
- Full lifecycle state machine with validated transitions
- Tracks authorized/captured/refunded amounts
- Immutable: every transition creates a new instance

### PaymentIntent
- Reference object representing intent to collect payment
- Contains amount, currency, customer, restaurant context
- Independent from transaction (supports retry with new transactions)

### PaymentMethod
- Describes accepted payment types (credit card, digital wallet, etc.)
- Flags for tokenization requirements and processing time

### PaymentProvider
- Registered provider with capability matrix
- Supports priority-based provider selection
- Health status: Active, Inactive, Degraded, Maintenance

### PaymentResult
- Standardized response from adapter operations
- Supports success, failure, pending, and requires_action outcomes

### RefundRequest
- Tracks refund lifecycle with approval workflow
- Supports full and partial refunds
- Audit trail via status transitions

### PaymentPolicy
- Configurable rules for authorization, capture, refund, and fraud
- Priority-based policy resolution

## Events

| Event              | Trigger                        | Payload                                    |
|--------------------|--------------------------------|--------------------------------------------|
| PaymentCreated     | Transaction initialized        | transactionId, intentId, providerId, amount |
| PaymentAuthorized  | Authorization successful       | transactionId, authorizationCode, amount   |
| PaymentCaptured    | Funds captured                 | transactionId, capturedAmount              |
| PaymentFailed      | Authorization/capture failed   | transactionId, errorMessage, errorCode     |
| PaymentCancelled   | Transaction cancelled          | transactionId, reason                      |
| RefundCreated      | Refund requested               | refundId, transactionId, amount, type      |
| RefundCompleted    | Refund processed               | refundId, transactionId, providerReference |

## Future Providers

To add a new payment provider:

1. Create a class extending `BasePaymentAdapter`
2. Implement all required methods
3. Register the adapter with `PaymentManager.registerAdapter()`
4. Register the provider with `PaymentProviderService.registerProvider()`

```typescript
export class CustomProvider extends BasePaymentAdapter {
  readonly providerId = "custom";
  readonly providerName = "Custom Payments";

  async authorize(transaction: PaymentTransaction): Promise<PaymentResult> {
    // Implement provider-specific authorization logic
  }
  // ... other methods
}
```

## Dependencies

| Dependency          | Usage                                      |
|---------------------|--------------------------------------------|
| Secrets Management  | Provider API keys and credentials          |
| Configuration Center| Provider configuration and feature flags   |
| Event Bus           | Domain event publishing                    |
| Observability       | Transaction monitoring and alerting        |
| Audit Module        | Payment audit trail                        |
| POS Integration     | Payment data synchronization with POS      |

## Testing

```bash
# Run all payment tests
npx vitest run src/modules/payments/tests/

# Run specific test file
npx vitest run src/modules/payments/tests/PaymentLifecycle.spec.ts
```

### Test Coverage
- Payment lifecycle transitions
- Payment intent creation and state changes
- Transaction state machine validation
- Refund approval and processing workflow
- Provider adapter compatibility (all 6 providers)
- Fraud detection extension points
- Full integration scenario (create → authorize → capture → refund)
