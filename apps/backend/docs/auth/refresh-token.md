# Refresh Token Flow

## Overview

The refresh token endpoint (`POST /api/v1/auth/refresh`) implements the **Token Rotation** pattern. Each refresh operation invalidates the previous refresh token and issues a new pair (access + refresh).

## Flow

1. Client sends the current refresh token in the request body
2. Server verifies the JWT signature and decodes the JTI (JWT ID)
3. Server looks up the token hash in the database
4. Server validates:
   - Token exists (not unknown/fabricated)
   - Token is not revoked
   - Token has not expired
   - Associated user account is active
5. Old refresh token is revoked (rotation)
6. New access token and refresh token are generated
7. New refresh token hash is persisted in the database
8. Response contains `accessToken`, `refreshToken`, `expiresIn` (seconds), and `user`

## Rotation Strategy

- **Every refresh** revokes the previous refresh token
- A new `refreshToken` is always issued alongside the new `accessToken`
- The old refresh token's `isRevoked` flag is set to `true`

## Replay Attack Prevention

- If a **revoked** refresh token is presented, the server:
  1. Logs a `reuse_detected` warning
  2. Revokes **all** refresh tokens for that user
  3. Returns `401 auth.token.revoked`
- This ensures that if a refresh token is stolen and used by an attacker, the legitimate user's subsequent request will also fail (alerting them to the breach)

## Security Considerations

- Refresh tokens have a longer expiry than access tokens (configured via `JWT_REFRESH_EXPIRES_IN`)
- Token hashes are stored using SHA-256, never raw JWTs
- JTI is a cryptographically random UUID v4
- Rate limiting is applied (`AUTH_RATE_LIMIT_*` env vars)
- Generic error messages prevent oracle attacks

## Error Codes

| Code | Meaning |
|---|---|
| `auth.token.invalid` | Invalid signature, malformed, or unknown token |
| `auth.token.invalid_type` | Token is not a refresh token |
| `auth.token.revoked` | Token was already revoked (may trigger replay protection) |
| `auth.token.expired` | Token has passed its expiry date |
| `auth.account_disabled` | User account is inactive |

## Response Shape

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 899,
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "System Administrator"
    }
  },
  "message": "Token refreshed"
}
```
