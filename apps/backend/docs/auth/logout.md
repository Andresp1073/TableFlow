# Logout Flow

## Overview

The logout endpoint (`POST /api/v1/auth/logout`) revokes the current refresh token, invalidating the session. It requires authentication via `BearerAuth` (access token).

## Flow

1. Client sends the refresh token to revoke, authenticated with an access token
2. Server validates the refresh token JWT signature
3. Server looks up the token hash in the database
4. Server validates:
   - Token exists (not unknown/fabricated)
   - Token belongs to the authenticated user (user ID match)
5. Token is revoked (`isRevoked = true`) unless already revoked
6. Returns `204 No Content`

## Validation

| Scenario | Response |
|---|---|
| Missing access token | 401 Unauthorized |
| Invalid refresh token signature | 401 `auth.token.invalid` |
| Token not found in DB | 401 `auth.token.invalid` |
| Token belongs to another user | 401 `auth.token.user_mismatch` |
| Token already revoked | 204 (idempotent — no error) |
| Empty refresh token | 400 (validation error) |

## Security

- **User ownership verification**: the refresh token must belong to the authenticated user (matched via `userId` from the access token JWT)
- **Idempotent revocation**: revoking an already-revoked token returns 204 silently — no information leakage
- **No sensitive info in errors**: all error messages are generic
- **Rate limiting**: logout is subject to the same `AUTH_RATE_LIMIT_*` limits as login and refresh

## Audit Logging

All logout attempts are logged with:

- `reason`: `success`, `invalid_signature`, `token_not_found`, `user_mismatch`, `already_revoked`
- `userId`: the authenticated user's ID (if available)
- `ip`: client IP address
- `userAgent`: User-Agent header

## Idempotency

Logout is idempotent for already-revoked tokens. Calling logout twice with the same refresh token returns 204 both times.

## Response Shape

```
Status: 204 No Content
Body: (empty)
```
