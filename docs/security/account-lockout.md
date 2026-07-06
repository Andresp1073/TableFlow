# Account Lockout Protection

Protects against brute-force login attacks by temporarily locking accounts after repeated failed attempts.

## Configuration

All lockout parameters are environment-configured:

| Variable | Default | Description |
|---|---|---|
| `AUTH_MAX_LOGIN_ATTEMPTS` | 5 | Failed attempts before lockout |
| `AUTH_LOCKOUT_MINUTES` | 30 | Duration account remains locked |
| `AUTH_RESET_ATTEMPTS_AFTER` | 15 | Minutes of inactivity before failed counter resets |

## Lockout Flow

1. Failed login increments `failedLoginAttempts` and sets `lastFailedLoginAt`
2. When `failedLoginAttempts >= AUTH_MAX_LOGIN_ATTEMPTS`, account is locked:
   - `lockedAt` = current timestamp
   - `lockedUntil` = `lockedAt + AUTH_LOCKOUT_MINUTES`
   - `lockReason` = descriptive reason
3. Locked accounts receive a generic error message
4. After `AUTH_RESET_ATTEMPTS_AFTER` minutes of no failed attempts, counter resets
5. After `AUTH_LOCKOUT_MINUTES` elapses, account auto-unlocks on next login attempt

## Unlock

- **Automatic**: When `lockedUntil` passes, next login attempt resets all fields
- **Manual**: System Administrator via `POST /users/:userId/unlock`

## Security Notes

- Generic error messages prevent account enumeration
- Failed attempt counter resets only after successful login or cool-down period
- Lockout applies per-account, not per-IP
