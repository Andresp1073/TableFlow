# Change Password Flow

## Overview

The change password endpoint (`POST /api/v1/auth/change-password`) allows an authenticated user to update their password. Requires the current password for verification and invalidates all existing sessions.

## Flow

1. Authenticate request via Bearer JWT access token
2. Load the current user from the database
3. Verify account is active (`isActive === true`)
4. Verify current password using bcrypt.compare
5. Validate new password against password policy:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one digit
   - At least one special character
   - Must differ from current password
6. Validate `confirmPassword` matches `newPassword` (Zod-level)
7. Hash the new password with bcrypt (12 rounds)
8. Update the user's password hash
9. Revoke ALL active refresh tokens for this user
10. Log the security event
11. Return success response

## Validation

| Scenario | HTTP | Error Code |
|---|---|---|
| Missing/malformed body | 400 | — |
| Password confirmation mismatch | 400 | — |
| Weak new password | 400 | — |
| New password same as current | 400 | — |
| Current password incorrect | 401 | `auth.invalid_credentials` |
| User not found | 401 | `auth.user.not_found` |
| Account disabled | 401 | `auth.account_disabled` |
| No authentication | 401 | — |
| Success | 200 | — |

## Password Policy

- Minimum 8 characters
- At least 1 uppercase letter (`[A-Z]`)
- At least 1 lowercase letter (`[a-z]`)
- At least 1 digit (`[0-9]`)
- At least 1 special character (`[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]`)
- Must not equal current password

## Security Decisions

- **Current password verified first** — prevents unauthorized changes if session is hijacked
- **Disabled account check** — inactive accounts cannot change passwords
- **Refresh token revocation** — all existing refresh tokens are invalidated, forcing re-login on all devices
- **Timing-safe** — password comparison uses bcrypt.compare (constant-time)
- **Special character required** — added per enterprise password policy
- **No information leakage** — user-not-found and account-disabled both return 401

## Session Invalidation

After a successful password change:
- `AuthRepository.revokeUserRefreshTokens(userId)` marks all active refresh tokens as revoked
- The current access token remains valid until it expires (JWT is stateless)
- The user should obtain a new access token by logging in again

## Response Shape

```json
{
  "success": true,
  "data": null,
  "message": "Password changed successfully"
}
```
