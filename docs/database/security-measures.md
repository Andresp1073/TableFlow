# Security Measures — Database Layer

**Last updated:** 2026-07-04

## PII Encryption Strategy

### Scope of PII

| Table | Column | PII Classification | Risk Level |
|-------|--------|--------------------|------------|
| customers | email | Direct identifier | **Critical** |
| customers | phone | Direct identifier | **Critical** |
| customers | first_name | Personal data | **High** |
| customers | last_name | Personal data | **High** |
| customers | preferences | Special category (health) | **Critical** |
| users | email | Login identifier | **High** |
| branches | email | Business contact | **Low** |
| branches | phone | Business contact | **Low** |
| notifications | recipient_email | Personal data | **Medium** |
| notifications | recipient_phone | Personal data | **Medium** |

### Approach: Application-Level Encryption

**Decision:** Encrypt PII at the application layer using `crypto.createCipheriv` (AES-256-GCM) rather than MySQL `AES_ENCRYPT`.

| Reason | Detail |
|--------|--------|
| **ORM compatibility** | MySQL `AES_ENCRYPT` produces binary blobs that Prisma cannot handle transparently |
| **Key management** | Application can integrate with KMS (AWS KMS, Vault) without database changes |
| **Audit logging** | Plaintext values are never exposed to database logs or slow query logs |
| **Search** | Can implement deterministic encryption for exact-match lookups (email/phone) |

### Column Storage

Encrypted columns are stored as `TEXT` (base64-encoded ciphertext):

| Column | Storage Type | Format | Searchable |
|--------|-------------|--------|------------|
| `email` (customers) | TEXT | AES-256-GCM, base64 | **Deterministic** (for uniqueness checks) |
| `phone` (customers) | TEXT | AES-256-GCM, base64 | **Deterministic** (for deduplication) |
| `first_name` (customers) | TEXT | AES-256-GCM, base64 | No |
| `last_name` (customers) | TEXT | AES-256-GCM, base64 | No |
| `preferences` (customers) | TEXT | AES-256-GCM, base64 | No |
| `email` (users) | TEXT | AES-256-GCM, base64 | **Deterministic** (for login) |

**Update to [table-design.md](./table-design.md):** These columns should be changed from `VARCHAR`/`JSON` to `TEXT` when encryption is implemented.

### Encryption Implementation

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes, hex-encoded

// For non-deterministic encryption (full_name, preferences)
function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store: base64(iv + authTag + ciphertext)
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decrypt(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, 16);
  const authTag = buf.subarray(16, 32);
  const encrypted = buf.subarray(32);
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

### Deterministic Encryption for Search

For email and phone (need equality lookups), use AES-256-GCM with a fixed IV derived from the plaintext:

```typescript
// Deterministic encryption for email/phone lookup
function deterministicEncrypt(plaintext: string): string {
  const hmac = createHash('sha256').update(plaintext).digest();
  const iv = hmac.subarray(0, 16); // Deterministic IV from plaintext hash
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}
```

**WARNING:** Deterministic encryption reveals equality patterns (same email always produces same ciphertext). Acceptable for login/search but review if the threat model requires hiding equality.

### Key Management

| Concern | Mitigation |
|---------|------------|
| Key rotation | Each ciphertext includes the IV. Old keys can decrypt old data. Store key version as prefix. |
| Key storage | Environment variable `ENCRYPTION_KEY` (32-byte hex). Production: KMS with auto-rotation. |
| Key compromise | Change key, re-encrypt all PII columns (background job). |
| Development | Separate key per environment. Dev keys never used in production. |

### Performance Impact

| Operation | Overhead | Mitigation |
|-----------|----------|------------|
| Encrypt on insert | ~0.5ms per field | Acceptable for single-record operations |
| Decrypt on read | ~0.5ms per field | Only decrypt when displaying to authorized users |
| Search by encrypted email | Index scan (no B-tree on encrypted data) | Cache email→customer_id mapping in Redis, or use HMAC-based lookup index |
| Bulk operations | Significant | Avoid decrypting in bulk queries. Decrypt after fetching. |

### Migration Path

```
Phase 1 (Before Launch):
  1. Add encrypted columns alongside plaintext (e.g., email_encrypted TEXT NULL)
  2. Backfill encrypted data from plaintext
  3. Update application to read from encrypted column, fallback to plaintext
  4. Add trigger to sync plaintext → encrypted on writes

Phase 2 (Post-Launch):
  5. Once all clients read from encrypted column, drop plaintext columns
  6. Confirm no performance regressions
  7. Remove plaintext columns via migration

Alternative (Greenfield): If no production data exists, store directly as encrypted TEXT
from day one and skip the dual-write phase.
```

### Tables Affected

| Table | Columns to Change | Prisma Schema Change |
|-------|-------------------|---------------------|
| customers | email: VARCHAR → TEXT, phone: VARCHAR → TEXT, first_name: VARCHAR → TEXT, last_name: VARCHAR → TEXT, preferences: JSON → TEXT | `@db.Text` |
| users | email: VARCHAR → TEXT | `@db.Text` |
| notifications | recipient_email: VARCHAR → TEXT, recipient_phone: VARCHAR → TEXT | `@db.Text` |

---

## Related Documents

- [security-architecture.md](../architecture/security-architecture.md) — Application-layer security
- [table-design.md](./table-design.md) — Current column definitions (to be updated)
- [database-conventions.md](./database-conventions.md) — Naming and type conventions
