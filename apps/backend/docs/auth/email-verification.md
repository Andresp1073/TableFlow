# Email Verification Flow

## Overview

The email verification endpoint (`POST /api/v1/auth/verify-email`) confirms a user's email address using a one-time verification token. Tokens are generated during registration or via the resend-verification flow and delivered to the user's email inbox.

## Verification Flow

1. Client submits the verification token received in their email
2. Server validates the token format
3. Server hashes the received token with SHA-256
4. Server looks up the hashed token in the `email_verification_tokens` table
5. If the token **does not exist**, is **expired**, is **already used**, the user is **disabled**, or the email is **already verified** — returns generic error (no information leakage)
6. If the token **exists and is valid**:
   a. Marks the user's `isVerified` flag as `true`
   b. Marks the verification token as used (`usedAt = now`)
   c. Logs the successful verification with user ID and IP address
7. Returns success response

## Token Lifecycle

| Stage | Description |
|---|---|
| Created | `usedAt = null`, `expiresAt = now + 24 hours` |
| Invalidated | Previous active tokens for the same user are marked `usedAt = now` on resend |
| Used | Token is marked `usedAt = now` after successful verification |
| Expired | `expiresAt < now` — token is rejected by `findVerificationToken` |
| Reuse | One-time use enforced; calling verify-email twice with the same token fails |

## Security Strategy

- **No information leakage**: response is identical for invalid, expired, used, disabled, and already-verified cases
- **Token hashing**: `crypto.randomBytes(32)` → SHA-256 → stored; raw token only in email URL
- **One active token per user**: previous tokens are invalidated before creating a new one
- **24-hour expiry**: `expiresAt` set to `Date.now() + 86400000`
- **One-time use**: `usedAt` set on consumption; `findVerificationToken` filters `usedAt: null`
- **Replay attack prevention**: used tokens cannot be replayed; already-verified emails cannot be re-verified
- **Audit trail**: every request is logged with reason, user ID, IP address, and whether it succeeded or failed

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
| Missing token | 400 | — |
| Invalid token | 400 | — |
| Expired token | 400 | — |
| Already used token | 400 | — |
| Already verified email | 400 | — |
| Disabled account | 400 | — |
| Rate limit exceeded | 429 | — |
| Successful verification | 200 | — |

## Response Shape

**Success (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Email verified successfully"
}
```

**Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Invalid or expired verification token. Request a new verification email."
  }
}
```
