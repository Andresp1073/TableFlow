# Refresh Token Security

Enterprise-grade refresh token protection implementing rotation, token families, reuse detection, and automatic revocation.

## Token Family

Every login creates a **Token Family** identified by a UUID (`familyId`). All refresh tokens generated from subsequent rotations belong to the same family, forming a chain:

```
Login
  └── Token A (parentTokenId: null)  ← root of family
        └── Token B (parentTokenId: A)  ← first rotation
              └── Token C (parentTokenId: B)  ← second rotation
```

### Schema

The `RefreshToken` model includes:

| Field | Type | Description |
|---|---|---|
| `familyId` | `Char(36)` | UUID grouping tokens from the same login session |
| `parentTokenId` | `Char(36)?` | Links to the previous token in the rotation chain |
| `rotatedAt` | `DateTime?` | Set when this token is used to generate a new one |
| `revokedAt` | `DateTime?` | Timestamp of revocation |
| `reuseDetected` | `Boolean` | True if this token triggered reuse detection |

## Rotation Strategy

On each refresh request, the old token is atomically rotated and a new one is created:

1. **Validate** JWT signature and type (`refresh`)
2. **Lookup** stored token by SHA-256 hash of JTI
3. **Rotate** old token atomically (sets `rotatedAt`, `isRevoked`)
4. **Create** new token with same `familyId` and `parentTokenId` = old token id
5. **Return** new access + refresh token pair

### Atomic Rotation

Uses `updateMany` with `WHERE id = ? AND isRevoked = false` to prevent race conditions:

```typescript
const result = await this.repository.rotateRefreshToken(storedToken.id);
if (result.count === 0) {
  // Another request already rotated or revoked this token
  await this.repository.revokeFamily(storedToken.familyId);
  // → force re-authentication
}
```

## Reuse Detection

If a token with `rotatedAt` set is presented again, it signals token theft:

1. **Detect** `rotatedAt` is non-null on the stored token
2. **Revoke** the entire token family (`revokeFamily`)
3. **Mark** the reused token with `reuseDetected = true`
4. **Log** security incident with `userId`, `familyId`, `tokenId`, `ip`
5. **Return** 401 Unauthorized

### Reuse Flow

```
Receive old rotated token
  ↓
Detect rotatedAt is set
  ↓
Revoke entire family (all tokens with same familyId)
  ↓
Log security incident
  ↓
Return 401 Unauthorized
```

## Automatic Revocation

Revocation occurs in these scenarios:

| Scenario | Scope | Mechanism |
|---|---|---|
| Token reuse (theft) | Entire family | `revokeFamily()` |
| Concurrent rotation race | Entire family | `rotateRefreshToken()` → count=0 → `revokeFamily()` |
| Logout | Single token | `revokeRefreshToken()` |
| Password change | All user tokens | `revokeUserRefreshTokens()` |
| Password reset | All user tokens | `revokeUserRefreshTokens()` |
| Admin session revoke | Single token | `revokeRefreshToken()` |

## Security Properties

- **Replay prevention**: Each token can be used exactly once for rotation
- **Theft mitigation**: Stolen token reuse revokes the entire family, forcing re-login
- **Race condition safety**: Atomic rotation prevents concurrent token proliferation
- **Audit trail**: All rotation and revocation events are logged with userId, ip, familyId
- **No enumeration**: Error messages are generic and consistent

## Logging Events

| Event | Fields |
|---|---|
| Token rotation | `userId`, `familyId`, `ip` |
| Reuse detected | `userId`, `familyId`, `tokenId`, `ip` |
| Concurrent rotation | `userId`, `familyId`, `tokenId`, `ip` |
| Family revoked | `familyId`, `reason` |

## Test Coverage

- **Unit tests** (69): Successful rotation, reuse detection, family revocation, concurrent rotation race, invalid/expired/revoked tokens
- **Integration tests** (59): End-to-end rotation flow, reuse with family cascade, admin unlock, non-admin denial, DB state verification
