# Reset Password Flow

## Overview

The reset password endpoint (`POST /api/v1/auth/reset-password`) consumes a one-time recovery token to set a new password. It revokes all active sessions and refresh tokens.

## Flow

1. Client submits token, new password, and password confirmation
2. Server validates request (format, strength, confirmation match)
3. Server hashes the received token with SHA-256
4. Server looks up matching `PasswordResetToken` record
5. Server validates:
   - Token exists (not fabricated)
   - Token has not been used (`usedAt === null`)
   - Token has not expired (`expiresAt >= now`)
   - Associated user account is active (`isActive === true`)
6. Server hashes the new password with bcrypt (12 rounds)
7. User's `passwordHash` is updated
8. Token is marked as used (`usedAt = now`)
9. All active refresh tokens for the user are revoked
10. Success response returned

## Validation

| Scenario | HTTP | Error Message |
|---|---|---|
| Missing token | 400 | — |
| Missing or weak password | 400 | — |
| Password confirmation mismatch | 400 | Passwords do not match |
| Invalid/expired/used token | 400 | Invalid or expired reset token. Request a new password reset. |
| Disabled user account | 400 | Invalid or expired reset token. Request a new password reset. |
| Success | 200 | Password reset successfully |

All token-related failures return the **same generic message** — no information leakage.

## Security Strategy

- **One-time use**: token is marked `usedAt = now` immediately after successful reset
- **Immediate invalidation**: all refresh tokens revoked, forcing re-login
- **Replay prevention**: using the same token twice fails with generic error
- **Password hashing**: bcrypt with 12 salt rounds
- **Token hashing**: SHA-256 — raw token only exists in the reset email URL
- **Constant error messages**: all token failures return identical text
- **Audit logging**: every attempt logged with reason, userId, ip, userAgent

## Token Lifecycle

```
ForgotPassword → token created (usedAt: null, expiresAt: +1h)
                                              ↓
ResetPassword  → token marked used (usedAt: now)
                refresh tokens revoked
                sessions invalidated
```

## Refresh Token Revocation

On successful reset:
- `AuthRepository.revokeUserRefreshTokens(userId)` sets `isRevoked = true` on every active refresh token for that user
- The user must log in again to obtain new tokens
- This prevents an attacker who obtained a refresh token from maintaining access after a password reset

## Response Shape

```json
{
  "success": true,
  "data": null,
  "message": "Password reset successfully"
}
```
