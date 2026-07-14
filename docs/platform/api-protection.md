# Enterprise API Protection Engine

## Overview
A reusable, provider-agnostic API protection layer implementing Chain of Responsibility for request validation. Designed for OWASP API Security Top 10 compliance. Integrates with Security Foundation, Observability, Event Bus, and Rate Limiting Engine.

## Architecture

### ApiProtectionEngine
Public facade. Evaluates a request through the ProtectionPipeline, publishes events, records metrics, and logs decisions. Supports configuration-driven rule registration.

```
ProtectionContext → ProtectionPipeline → ProtectionDecision
                         │
               ┌─────────┼─────────┐
               │         │         │
         HeaderRule  ThreatRule  FutureRule
               │         │         │
               └─────────┼─────────┘
                    ProtectionDecision
                    (allow/reject/warn/continue)
```

### ProtectionPipeline
Chain of Responsibility. Runs rules in priority order (ascending). Short-circuits on the first `reject`. Returns the final decision plus all intermediate decisions.

### ProtectionContext
Immutable request snapshot containing: method, path, headers, query, body, contentType, contentLength, ipAddress, userAgent, origin, referer, securityContext, metadata. Built via `ProtectionContextBuilder`.

### ProtectionDecision
Value object with 4 actions:
| Action | Meaning |
|---|---|
| `allow` | Request passed validation |
| `reject` | Request must be blocked |
| `warn` | Suspicious but not blocked |
| `continue` | Rule does not apply |

## Rules

| Rule | Priority | Category | Description |
|---|---|---|---|
| HeaderValidationRule | 10 | `header_injection` | Validates required/forbidden headers, checks for injection patterns (CRLF), enforces max header count (50) |
| ContentTypeValidationRule | 20 | `invalid_content_type` | Validates Content-Type against whitelist, rejects forbidden types (executable scripts, Java archives) |
| PayloadSizeValidationRule | 30 | `oversized_payload` | Enforces min/max payload size (default 10MB max) |
| HttpMethodValidationRule | 40 | `unexpected_method` | Validates HTTP method; blocks TRACE/CONNECT by default |
| OriginValidationRule | 50 | `suspicious_origin` | Validates Origin/Referer against whitelist, scheme, and TLD; supports wildcard patterns |
| UserAgentValidationRule | 60 | `malicious_user_agent` | Detects blank/suspicious User-Agents; optionally blocks known malicious scanners (sqlmap, nikto, etc.) |
| ThreatDetectionRule | 70 | varies | Delegates to ThreatAnalyzer; rejects critical/high threats, warns on medium findings |
| FutureExtensionRule | configurable | — | Generic hook for future security checks via callback |

### Rule Lifecycle
- Rules are registered via `pipeline.addRule()` or `engine.registerRule()`
- Rules can be enabled/disabled individually
- Disabled rules are skipped during pipeline execution
- Rules run in priority order (lower number = higher priority)
- A rule can be removed at runtime via `pipeline.removeRule(name)`

## Threat Detection

`ThreatAnalyzer` scans:
- **Query parameters**: SQL injection, XSS, path traversal, suspicious parameter names (`__proto__`, `constructor`, `.env`)
- **Request body**: Recursive deep scan of nested objects and arrays
- **Request path**: Path traversal patterns (`../`, `%00`, `%2f`)
- **Request anomalies**: Body without Content-Type, malformed characters in JSON

### Risk scoring
Each threat is weighted: low=1, medium=3, high=7, critical=15. Total is capped at 100.

## Events

| Event Type | Trigger |
|---|---|
| `api_request_rejected` | Pipeline returns a `reject` decision |
| `api_protection_warning` | Pipeline returns a `warn` decision |
| `api_threat_detected` | Threat severity meets or exceeds escalation threshold (default: medium) |

## Metrics

| Method | Description |
|---|---|
| `incrementRejected(ruleName, category)` | Tracks rejected requests per rule |
| `incrementWarnings(ruleName, category)` | Tracks warnings per rule |
| `incrementThreatCategory(category)` | Tracks threat category occurrences |
| `recordPipelineDuration(durationMs)` | Records pipeline execution time |

## Extension Points
- **FutureExtensionRule**: Inject custom validation logic at any priority level
- **Custom rules**: Implement the `ProtectionRule` interface and register via `engine.registerRule()`
- **ThreatAnalyzer**: Extend with additional threat scanning patterns
- **Pipeline composition**: Multiple named pipelines can be created for different API surfaces (public, admin, webhook)

## Usage
```typescript
import { ApiProtectionEngine, ProtectionPipeline, HeaderValidationRule,
  HttpMethodValidationRule, ThreatDetectionRule, ThreatAnalyzer, createProtectionContext } from "../platform/index.js";

const pipeline = new ProtectionPipeline("api");
pipeline.addRules([
  new HeaderValidationRule(),
  new HttpMethodValidationRule(),
  new ThreatDetectionRule(new ThreatAnalyzer()),
]);

const engine = new ApiProtectionEngine({
  pipeline,
  eventPublisher,
  metrics: myMetricsCollector,
  logger: myLogger,
});

const ctx = createProtectionContext({
  requestId: req.id,
  method: req.method,
  path: req.path,
  headers: req.headers,
  body: req.body,
});

const decision = await engine.evaluate(ctx);

if (decision.action === "reject") {
  res.status(429).json({ error: "request_rejected", reason: decision.reason });
}
```

## Test Summary
- 93 tests across 6 suites (decisions, context, rules, pipeline, threat analyzer, engine)
- Full coverage: all 7 rules, pipeline short-circuit, priority ordering, error isolation, event publishing, metrics recording, threat scanning
