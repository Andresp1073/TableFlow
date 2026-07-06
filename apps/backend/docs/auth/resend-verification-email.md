# Resend Verification Email Flow

## Overview

The resend verification email endpoint (`POST /api/v1/auth/resend-verification-email`) allows users who have not yet verified their email address to request a new verification token. The endpoint is unauthenticated — it accepts an email address and always returns the same generic response to prevent email enumeration.

## Flow

1. Client submits their email address
2. Server validates the email format
3. Server looks up the user by email
4. If the user **does not exist**, is **disabled**, or is **already verified** — returns generic success (no enumeration)
5. If the user **exists, is active, and unverified**:
   a. Invalidates any previously active (unused + not expired) verification tokens for this user
   b. Generates a cryptographically secure random token (`crypto.randomBytes(32)`)
   c. Hashes the token with SHA-256 — only the hash is persisted
   d. Persists the hash with a 24-hour expiry
   e. Sends the email containing the raw (unhashed) token in the verification URL
6. Returns the same generic success message

## Token Lifecycle

| Stage | Description |
|---|---|
| Created | `usedAt = null`, `expiresAt = now + 24 hours` |
| Invalidated | Previous active tokens for the same user are marked `usedAt = now` on resend |
| Used | Token is marked `usedAt = now` after successful email verification |
| Expired | `expiresAt < now` — token is rejected by `findVerificationToken` |
| Reuse | One-time use enforced; calling verify-email twice with the same token fails |

## Security Strategy

- **No account enumeration**: response is identical for existing, missing, disabled, and already-verified accounts
- **Constant-time message**: same string literal returned in all cases
- **Token hashing**: `crypto.randomBytes(32)` → SHA-256 → stored; raw token only in email URL
- **One active token per user**: previous tokens are invalidated before creating a new one
- **24-hour expiry**: `expiresAt` set to `Date.now() + 86400000`
- **One-time use**: `usedAt` set on consumption; `findVerificationToken` filters `usedAt: null`
- **Audit trail**: every request is logged with reason, ip, and user-id

## Rate Limiting

The endpoint uses the same `authRateLimit` as login and refresh (configured via `AUTH_RATE_LIMIT_WINDOW_MS` and `AUTH_RATE_LIMIT_MAX`).

## Database Model

```
EmailVerificationToken {
  id          String   @id @default(uuid())
  userId      String
  tokenHash   String   @unique  // SHA-256 of the raw token
  expiresAt   DateTime           // now + 24 hours
  usedAt      DateTime?          // null = active, set on use
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
    "message": "If that account exists and is unverified, a verification email has been sent."
  }
}
```
