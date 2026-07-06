# Authentication API

Base URL: `/api/v1/auth`

## Endpoints

### POST /auth/login

Authenticate a user with email and password.

**Request:**
```json
{
  "email": "admin@tableflow.io",
  "password": "Admin123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@tableflow.io",
      "firstName": "System",
      "lastName": "Administrator",
      "role": "System Administrator",
      "organizationId": "uuid",
      "isVerified": true
    },
    "tokens": {
      "accessToken": "jwt...",
      "refreshToken": "jwt...",
      "expiresIn": 899935
    }
  },
  "message": "Login successful"
}
```

**Errors:** 401 (invalid credentials, account locked/disabled)

---

### POST /auth/refresh

Exchange a refresh token for a new token pair (rotation pattern).

**Request:**
```json
{
  "refreshToken": "jwt..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 899,
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "admin@tableflow.io",
      "firstName": "System",
      "lastName": "Administrator",
      "role": "System Administrator"
    }
  },
  "message": "Token refreshed"
}
```

**Errors:** 401 (invalid/expired/revoked/invalid-type refresh token, disabled account)

---

### POST /auth/logout

Revoke the current refresh token. Requires authentication (Bearer access token). Idempotent — returns 204 even if token was already revoked.

**Request:**
```json
{
  "refreshToken": "jwt..."
}
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response:** 204 No Content

**Errors:** 401 (missing/invalid token, user mismatch, unknown token)

---

### POST /auth/change-password

Change the authenticated user's password. Requires authentication. All existing refresh tokens are revoked.

**Request:**
```json
{
  "currentPassword": "OldPass1!",
  "newPassword": "NewPass1!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Password changed successfully"
}
```

**Errors:** 400 (incorrect current password, weak new password, same password), 401 (unauthenticated)

**Password rules:** 8+ chars, uppercase, lowercase, number.

---

### POST /auth/forgot-password

Request a password reset link. Always returns a success message (does not reveal whether the email exists).

**Request:**
```json
{
  "email": "admin@tableflow.io"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "If that email is registered, you will receive a password reset link."
  }
}
```

**Rate limit:** Yes (auth rate limit)

---

### POST /auth/reset-password

Reset a password using a reset token.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewPass1!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Password reset successfully"
}
```

**Errors:** 400 (invalid/expired token, weak password)

---

### POST /auth/verify-email

Verify an email address using a verification token.

**Request:**
```json
{
  "token": "verification-token-from-email"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Email verified successfully"
}
```

**Errors:** 400 (invalid/expired token)

---

### POST /auth/resend-verification

Resend the verification email. Requires authentication.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Verification email sent to a***@tableflow.io"
  }
}
```

**Errors:** 400 (already verified), 401 (unauthenticated)

---

### GET /auth/sessions

List active sessions for the authenticated user. Requires authentication.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "createdAt": "2026-07-05T16:07:00.000Z",
      "expiresAt": "2026-07-12T16:07:00.000Z",
      "isCurrent": true
    }
  ]
}
```

**Errors:** 401 (unauthenticated)

---

### DELETE /auth/sessions

Revoke all sessions except the current one. Requires authentication.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "All other sessions revoked successfully"
}
```

---

### DELETE /auth/sessions/:id

Revoke a specific session by ID. Requires authentication.

**Headers:** `Authorization: Bearer <accessToken>`

**Response:** 204 No Content

**Errors:** 401 (unauthenticated), 404 (session not found)

## Rate Limiting

Auth endpoints are rate-limited separately from the general API rate limiter. Default: 10 requests per minute per IP.

## Authentication Flow

1. **Login** → receive `accessToken` (15min expiry) + `refreshToken` (7d expiry)
2. **Use access token** for all subsequent requests via `Authorization: Bearer <token>`
3. **Refresh** before expiry: call `POST /auth/refresh` with the current refresh token to get a new pair (old refresh token is revoked — rotation pattern)
4. **Logout** → call `POST /auth/logout` to revoke the refresh token client-side
