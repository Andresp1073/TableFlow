# Forgot Password Flow

## Overview

The forgot password endpoint (`POST /api/v1/auth/forgot-password`) initiates a password recovery by sending a reset link to the user's email. It always returns the same response regardless of whether the account exists, preventing email enumeration.

## Flow

1. Client submits their email address
2. Server validates the email format
3. Server looks up the user by email
4. If the user **does not exist** or is **disabled** — returns generic success (no enumeration)
5. If the user **exists and is active**:
   a. Invalidates any previously active (unused + not expired) reset tokens for this user
   b. Generates a cryptographically secure random token (`crypto.randomBytes(48)`)
   c. Hashes the token with SHA-256 — only the hash is persisted
   d. Persists the hash with a 1-hour expiry and optional IP/User-Agent metadata
   e. Sends the email containing the raw (unhashed) token in the reset URL
6. Returns the same generic success message

## Token Lifecycle

| Stage | Description |
|---|---|
| Created | `usedAt = null`, `expiresAt = now + 1 hour` |
| Invalidated | Previous active tokens for the same user are marked `usedAt = now` |
| Used | Token is marked `usedAt = now` after successful password reset |
| Expired | `expiresAt < now` — token is rejected by `findPasswordResetToken` |
| Reuse | One-time use enforced; calling reset-password twice with the same token fails |

## Security Strategy

- **No account enumeration**: response is identical for existing, missing, and disabled accounts
- **Constant-time message**: same string literal returned in all cases
- **Token hashing**: `crypto.randomBytes(48)` → SHA-256 → stored; raw token only in email URL
- **One active token per user**: previous tokens are invalidated before creating a new one
- **1-hour expiry**: `expiresAt` set to `Date.now() + 3600000`
- **One-time use**: `usedAt` set on consumption; `findPasswordResetToken` filters `usedAt: null`
- **Audit trail**: every request is logged with reason, ip, and user-agent

## Rate Limiting

The endpoint uses the same `authRateLimit` as login and refresh (configured via `AUTH_RATE_LIMIT_WINDOW_MS` and `AUTH_RATE_LIMIT_MAX`).

## Database Model

```
PasswordResetToken {
  id          String   @id @default(uuid())
  userId      String
  tokenHash   String   @unique  // SHA-256 of the raw token
  expiresAt   DateTime           // now + 1 hour
  usedAt      DateTime?          // null = active, set on use
  ipAddress   String?            // request source (audit)
  userAgent   String?            // User-Agent header (audit)
  createdAt   DateTime @default(now())
}
```

## Error Codes

| Scenario | HTTP Status | Code |
|---|---|---|
| Invalid email format | 400 | — |
| Rate limit exceeded | 429 | — |
| Any email (exists or not) | 200 | — |

## Response Shape

```json
{
  "success": true,
  "data": {
    "message": "If that email is registered, you will receive a password reset link."
  }
}
```
