# Authentication

**Last updated:** 2026-07-04

## Auth Endpoints

All auth endpoints are unauthenticated (except Change Password and Logout).

```
Base path: /api/v1/auth
```

---

### POST /api/v1/auth/register

**Purpose:** Create a new user account (organization registration).

**Authentication:** None

**Permissions:** None

**Request Body:**

```json
{
  "email": "admin@restaurant.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "La Trattoria Group",
  "phone": "+14155551234"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email, unique |
| `password` | string | ✅ | Min 12 chars, uppercase, lowercase, digit, special |
| `firstName` | string | ✅ | 1–100 chars |
| `lastName` | string | ✅ | 1–100 chars |
| `organizationName` | string | ✅ | 1–255 chars |
| `phone` | string | ❌ | E.164 format |

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "admin@restaurant.com",
    "firstName": "John",
    "lastName": "Doe",
    "organizationId": "org-uuid",
    "createdAt": "2026-07-04T10:00:00.000Z"
  },
  "meta": {
    "requestId": "req-uuid-v4",
    "location": "/api/v1/users/user-uuid"
  },
  "error": null
}
```

**Errors:** `400` (validation), `409` (duplicate email)

**Business Rules:**
- Creates organization with `organizationName`
- Creates user with `restaurant_admin` role for that org
- Sends verification email (async)
- Account starts in `UNVERIFIED` status

---

### POST /api/v1/auth/login

**Purpose:** Authenticate and receive JWT tokens.

**Authentication:** None

**Permissions:** None

**Request Body:**

```json
{
  "email": "admin@restaurant.com",
  "password": "SecurePass123!"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `password` | string | ✅ | Not empty |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "dGhpcyBpcyBh...",
    "expiresIn": 900,
    "user": {
      "id": "user-uuid",
      "email": "admin@restaurant.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "restaurant_admin"
    }
  },
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `401` (invalid credentials), `429` (rate limit), `403` (account locked)

**Headers:**

| Header | Value |
|--------|-------|
| `Set-Cookie` | `refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800` |

**Business Rules:**
- Rate limit: 10 attempts/minute per IP
- Failed attempts increment `failed_login_attempts`
- Lock account for 30 minutes after 5 failed attempts
- Generic error message: "Invalid credentials" (never reveal which field is wrong)
- On success, reset `failed_login_attempts` to 0
- Access token expires in 15 minutes
- Refresh token expires in 7 days

---

### POST /api/v1/auth/refresh

**Purpose:** Obtain a new access token using a refresh token.

**Authentication:** Refresh token (cookie or body)

**Permissions:** None

**Request Body (alternative to cookie):**

```json
{
  "refreshToken": "dGhpcyBpcyBh..."
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `refreshToken` | string | ❌ (cookie preferred) | Valid JWT |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "bmV3IHJlZnJl...",
    "expiresIn": 900,
    "user": {
      "id": "user-uuid",
      "email": "admin@restaurant.com",
      "role": "restaurant_admin"
    }
  },
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `401` (invalid/expired/revoked refresh token)

**Business Rules:**
- Old refresh token is revoked (rotation)
- New refresh token issued
- If a revoked token is reused, revoke all tokens for that user (token theft detection)

---

### POST /api/v1/auth/logout

**Purpose:** Revoke the current refresh token.

**Authentication:** ✅ Required

**Permissions:** None

**Headers:**

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <access-token>` |

**Request Body (optional):**

```json
{
  "refreshToken": "dGhpcyBpcyBh..."
}
```

**Response:** `204 No Content`

**Errors:** `401` (invalid token)

**Business Rules:**
- Revokes the refresh token
- Clears the refresh token cookie
- Access token remains valid until expiry (rely on short expiry)

---

### POST /api/v1/auth/forgot-password

**Purpose:** Send a password reset email.

**Authentication:** None

**Permissions:** None

**Request Body:**

```json
{
  "email": "admin@restaurant.com"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": null,
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

**Business Rules:**
- Always return 200 (even if email not found — prevent enumeration)
- Rate limit: 3 requests per email per hour
- Reset token expires in 1 hour
- Token is single-use

---

### POST /api/v1/auth/reset-password

**Purpose:** Reset password using a reset token.

**Authentication:** None

**Permissions:** None

**Request Body:**

```json
{
  "token": "reset-token-uuid",
  "password": "NewSecurePass123!"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `token` | string | ✅ | Valid reset token |
| `password` | string | ✅ | Min 12 chars, complexity rules |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { "message": "Password successfully reset" },
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `400` (invalid/expired token), `422` (password reuse)

**Business Rules:**
- Token is single-use
- New password cannot match last 5 passwords (history check)
- On success, revoke all refresh tokens for the user
- Send confirmation email

---

### POST /api/v1/auth/verify-email

**Purpose:** Verify email address using verification token.

**Authentication:** None

**Permissions:** None

**Request Body:**

```json
{
  "token": "verification-token-uuid"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `token` | string | ✅ | Valid verification token |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { "message": "Email verified successfully" },
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `400` (invalid/expired token)

**Business Rules:**
- Sets `is_verified = TRUE`
- Token is single-use
- Token expires in 48 hours

---

### POST /api/v1/auth/change-password

**Purpose:** Change password for authenticated user.

**Authentication:** ✅ Required

**Permissions:** None

**Headers:**

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <access-token>` |

**Request Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `currentPassword` | string | ✅ | Must match current password |
| `newPassword` | string | ✅ | Min 12 chars, complexity, different from current |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { "message": "Password changed successfully" },
  "meta": { "requestId": "req-uuid-v4" },
  "error": null
}
```

**Errors:** `400` (validation), `401` (wrong current password), `422` (password reuse)

**Business Rules:**
- New password cannot match last 5 passwords
- On success, revoke all refresh tokens (force re-login)
- Send notification email

## Cross-References

- [authorization.md](./authorization.md) — RBAC and permission enforcement
- [request-response-standards.md](./request-response-standards.md) — Response format
- [error-catalog.md](./error-catalog.md) — Auth error codes
- [rate-limit.md](./rate-limit.md) — Auth rate limits
- [validation.md](./validation.md) — Password validation rules
