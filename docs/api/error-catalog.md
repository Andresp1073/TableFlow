# Error Catalog

**Last updated:** 2026-07-04

## Error Response Format

See [request-response-standards.md](./request-response-standards.md) for the full envelope.

## Error Codes

### Authentication & Authorization

| Code | HTTP | Message | Description | Recovery |
|------|------|---------|-------------|----------|
| `auth.token.missing` | 401 | Authentication required | No `Authorization` header provided | Include `Bearer <token>` in request |
| `auth.token.invalid` | 401 | Invalid access token | Token malformed or signature invalid | Obtain a new token via login/refresh |
| `auth.token.expired` | 401 | Access token has expired | Token is past its `exp` claim | Refresh the token |
| `auth.token.revoked` | 401 | Token has been revoked | Refresh token was revoked | Re-authenticate |
| `auth.refresh.invalid` | 401 | Invalid refresh token | Refresh token malformed or not found | Re-authenticate |
| `auth.refresh.expired` | 401 | Refresh token has expired | Refresh token past 7-day expiry | Re-authenticate |
| `auth.forbidden` | 403 | Insufficient permissions | User lacks required permission | Request access from admin |
| `auth.scope` | 403 | Resource not in scope | User lacks branch/organization access | Request scope change from admin |
| `auth.account.locked` | 403 | Account is locked | Too many failed login attempts | Wait 30 minutes or reset password |
| `auth.account.unverified` | 403 | Email not verified | Account requires email verification | Check email for verification link |
| `auth.credentials.invalid` | 401 | Invalid credentials | Email or password incorrect | Verify credentials and retry |

### Validation

| Code | HTTP | Message | Description | Recovery |
|------|------|---------|-------------|----------|
| `validation.failed` | 400 | Request validation failed | One or more fields failed validation | Check `details` array for per-field errors |
| `validation.required` | 400 | Field is required | Missing required field | Include the field in request |
| `validation.type` | 400 | Invalid field type | Field has wrong data type | Correct the field type |
| `validation.format` | 400 | Invalid field format | Field does not match expected pattern | Check format constraints |
| `validation.min_length` | 400 | Value too short | String below minimum length | Increase string length |
| `validation.max_length` | 400 | Value too long | String exceeds maximum length | Truncate string |
| `validation.min` | 400 | Value too low | Number below minimum | Increase value |
| `validation.max` | 400 | Value too high | Number exceeds maximum | Decrease value |
| `validation.enum` | 400 | Invalid enum value | Value not in allowed set | Use one of the allowed values |
| `validation.email.invalid` | 400 | Invalid email format | Email does not match RFC 5322 | Provide valid email |
| `validation.uuid.invalid` | 400 | Invalid UUID format | Not a valid UUID v4/v7 | Provide valid UUID |
| `validation.date.invalid` | 400 | Invalid date format | Not in YYYY-MM-DD format | Use ISO 8601 date format |
| `validation.time.invalid` | 400 | Invalid time format | Not in HH:mm:ss format | Use 24-hour time format |
| `validation.password.complexity` | 400 | Password too weak | Fails complexity requirements | Min 12 chars with uppercase, lowercase, digit, special |
| `validation.search.too_short` | 400 | Search query too short | Search query must be at least 2 characters | Provide longer search term |

### Business Rules — Reservations

| Code | HTTP | Message | Description | Recovery |
|------|------|---------|-------------|----------|
| `reservation.overlap` | 409 | Table already booked | Requested table is occupied for the time slot | Choose different table or time |
| `reservation.past_date` | 422 | Cannot book in the past | Reservation date is before today | Choose future date |
| `reservation.booking_window` | 422 | Outside booking window | Date exceeds max advance booking days | Choose earlier date |
| `reservation.business_hours` | 422 | Outside business hours | Time falls outside restaurant hours | Choose time during operating hours |
| `reservation.status_transition` | 422 | Invalid status change | Status transition not allowed | Follow valid status flow |
| `reservation.table_capacity` | 422 | Party size mismatch | Party exceeds table capacity | Choose larger table or reduce party |
| `reservation.not_modifiable` | 422 | Cannot modify | Reservation in terminal status (COMPLETED, CANCELLED, NO_SHOW) | Cannot modify completed reservations |
| `reservation.not_found` | 404 | Reservation not found | No reservation with given ID | Verify reservation ID |
| `reservation.duplicate` | 409 | Duplicate reservation | Customer already has a reservation at this time | Confirm before creating duplicate |

### Business Rules — Customers

| Code | HTTP | Message | Description | Recovery |
|------|------|---------|-------------|----------|
| `customer.duplicate_email` | 409 | Email already exists | Customer with this email already exists | Use existing customer or update email |
| `customer.duplicate_phone` | 409 | Phone already exists | Customer with this phone already exists | Use existing customer or update phone |
| `customer.not_found` | 404 | Customer not found | No customer with given ID | Verify customer ID |
| `customer.cannot_merge` | 422 | Cannot merge customers | Customers belong to different organizations | Only merge within same organization |

### Business Rules — Users

| Code | HTTP | Message | Description | Recovery |
|------|------|---------|-------------|----------|
| `user.duplicate_email` | 409 | Email already exists | User with this email already exists | Use different email |
| `user.not_found` | 404 | User not found | No user with given ID | Verify user ID |
| `user.cannot_delete_last_admin` | 422 | Cannot remove last admin | Organization must have at least one admin | Promote another user to admin first |
| `user.password_reuse` | 422 | Password previously used | Password matches one of last 5 passwords | Choose a different password |

### Business Rules — General

| Code | HTTP | Message | Description | Recovery |
|------|------|---------|-------------|----------|
| `resource.not_found` | 404 | Resource not found | No resource with given ID | Verify resource ID |
| `resource.duplicate` | 409 | Resource already exists | Resource with given properties already exists | Use different properties |
| `resource.in_use` | 409 | Resource in use | Cannot delete resource that has dependent records | Remove dependencies first |
| `resource.gone` | 410 | Resource permanently deleted | Resource was hard-deleted | Resource no longer exists |
| `branch.not_found` | 404 | Branch not found | No branch with given ID | Verify branch ID |
| `table.not_found` | 404 | Table not found | No table with given ID | Verify table ID |

### Idempotency

| Code | HTTP | Message | Description | Recovery |
|------|------|---------|-------------|----------|
| `idempotency.collision` | 422 | Idempotency key collision | Key used with different request body | Generate new key for new request |
| `idempotency.invalid_format` | 400 | Invalid idempotency key | Key must be UUID v4 | Provide valid UUID v4 |

### Rate Limiting

| Code | HTTP | Message | Description | Recovery |
|------|------|---------|-------------|----------|
| `rate_limit.exceeded` | 429 | Too many requests | Rate limit exceeded for this endpoint | Wait and retry after `retryAfter` seconds |

### System

| Code | HTTP | Message | Description | Recovery |
|------|------|---------|-------------|----------|
| `internal.error` | 500 | Unexpected error | Server encountered an error | Retry later; contact support if persists |
| `internal.database` | 500 | Database error | Database connection or query failed | Retry later |
| `internal.timeout` | 504 | Request timed out | Request exceeded processing time | Retry with simpler query |
| `service.maintenance` | 503 | Service unavailable | System is in maintenance mode | Retry after maintenance window |
| `service.overloaded` | 503 | Service overloaded | System is under heavy load | Retry with backoff |

## Cross-References

- [request-response-standards.md](./request-response-standards.md) — Response format with error envelope
- [validation.md](./validation.md) — Validation rules producing these errors
- [rate-limit.md](./rate-limit.md) — Rate limiting errors
- [idempotency.md](./idempotency.md) — Idempotency errors
