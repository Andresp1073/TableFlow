# DTO Consistency

**Last updated:** 2026-07-04

## Request DTO Analysis

### Request Body Field Alignment

| DTO | Field | endpoint-catalog.md | openapi.yaml | Match |
|-----|-------|---------------------|--------------|-------|
| `LoginRequest` | `email` | ✅ string | ✅ string, format: email | ✅ |
| `LoginRequest` | `password` | ✅ string | ✅ string | ✅ |
| `RegisterRequest` | `email` | ✅ | ✅ | ✅ |
| `RegisterRequest` | `password` | ✅ | ✅ minLength: 12 | ✅ |
| `RegisterRequest` | `firstName` | ✅ | ✅ maxLength: 100 | ✅ |
| `RegisterRequest` | `lastName` | ✅ | ✅ maxLength: 100 | ✅ |
| `RegisterRequest` | `organizationName` | ✅ | ✅ maxLength: 255 | ✅ |
| `RegisterRequest` | `phone` | ❌ optional | ✅ optional | ✅ |
| `CreateReservationRequest` | `branchId` | ✅ UUID required | ✅ UUID required | ✅ |
| `CreateReservationRequest` | `customerId` | ✅ UUID required | ✅ UUID required | ✅ |
| `CreateReservationRequest` | `date` | ✅ date | ✅ format: date | ✅ |
| `CreateReservationRequest` | `time` | ✅ time | ✅ string | ✅ |
| `CreateReservationRequest` | `partySize` | ✅ 1-20 | ✅ min: 1, max: 20 | ✅ |
| `CreateReservationRequest` | `source` | ✅ default: PHONE | ✅ default: PHONE | ✅ |
| `CreateReservationRequest` | `tableIds` | ❌ optional | ❌ optional | ✅ |
| `CreateBranchRequest` | `name` | ✅ required | ✅ required | ✅ |
| `CreateBranchRequest` | `address` | ✅ required | ✅ required | ✅ |
| `CreateBranchRequest` | `timezone` | ✅ required | ✅ required | ✅ |
| `CreateBranchRequest` | `cuisineType` | ❌ optional | ❌ optional | ✅ |
| `CreateCustomerRequest` | `email` | ✅ required | ✅ required | ✅ |
| `CreateCustomerRequest` | `phone` | ✅ required | ✅ required | ✅ |
| `CreateCustomerRequest` | `firstName` | ✅ required | ✅ required | ✅ |
| `CreateCustomerRequest` | `lastName` | ✅ required | ✅ required | ✅ |

**Verdict:** ✅ All request DTO fields are consistent between endpoint-catalog.md and openapi.yaml.

### Validation Rules Consistency

| DTO | Field | endpoint-catalog.md | openapi.yaml | Match |
|-----|-------|---------------------|--------------|-------|
| `CreateReservationRequest` | `partySize` | min: 1, max: 20 | min: 1, max: 20 | ✅ |
| `CreateBranchRequest` | `averageDiningDuration` | 30-240 | 30-240 | ✅ |
| `CreateBranchRequest` | `slotInterval` | 15, 30, or 60 | enum: [15, 30, 60] | ✅ |
| `CreateBranchRequest` | `maxAdvanceBookingDays` | 1-365 | 1-365 | ✅ |
| `CreateBranchRequest` | `maxPartySize` | 1-50 | 1-50 | ✅ |
| `CreateTableRequest` | `minCapacity` | 1-50 | 1-50 | ✅ |
| `CreateTableRequest` | `maxCapacity` | 1-50 | 1-50 | ✅ |
| `RegisterRequest` | `password` | min 12, complexity | minLength: 12 (no complexity) | ⚠️ |
| `CreateUserRequest` | `password` | min 12, complexity | minLength: 12 (no complexity) | ⚠️ |

**Issue Found:** 🟡 MEDIUM — OpenAPI password validation only specifies `minLength: 12` but does not enforce complexity rules (uppercase, lowercase, digit, special character) described in the endpoint catalog. OpenAPI cannot express regex-based password complexity natively, but this gap should be documented.

## Response DTO Analysis

### Response Field Alignment

| DTO | Field | endpoint-catalog.md | openapi.yaml | Match |
|-----|-------|---------------------|--------------|-------|
| `SuccessResponse` | `success` | ✅ boolean | ✅ boolean, enum [true] | ✅ |
| `SuccessResponse` | `data` | ✅ object/null | ✅ object, nullable | ✅ |
| `SuccessResponse` | `message` | ❌ not shown | ✅ string, required | 🔴 |
| `ErrorResponse` | `success` | ✅ boolean | ✅ boolean, enum [false] | ✅ |
| `ErrorResponse` | `error.code` | ✅ string | ✅ string | ✅ |
| `ErrorResponse` | `error.message` | ✅ string | ✅ string | ✅ |
| `ErrorResponse` | `error.details` | ✅ array | ✅ array | ✅ |
| `PaginationMeta` | `page` | ✅ integer | ✅ integer | ✅ |
| `PaginationMeta` | `pageSize` | ✅ integer | ✅ integer | ✅ |
| `PaginationMeta` | `totalCount` | ✅ integer | ✅ integer | ✅ |
| `PaginationMeta` | `totalPages` | ✅ integer | ✅ integer | ✅ |
| `PaginationMeta` | `hasNextPage` | ✅ boolean | ✅ boolean | ✅ |
| `PaginationMeta` | `hasPreviousPage` | ✅ boolean | ✅ boolean | ✅ |
| `PaginationMeta` | `requestId` | ✅ string | ✅ string | ✅ |

### Missing Response Fields

| DTO | Missing Field | Source | Severity |
|-----|--------------|--------|----------|
| `Reservation` | `updatedBy` | DB table-design.md | 🟡 MEDIUM |
| `Reservation` | `noShowMarkedAt` | DB table-design.md | 🟡 MEDIUM |
| `Customer` | `updatedBy` | DB table-design.md | 🟡 MEDIUM |
| `Branch` | `updatedBy` | DB table-design.md | 🟡 MEDIUM |
| `RestaurantTable` | `updatedBy` | DB table-design.md | 🟡 MEDIUM |
| `User` | `updatedBy` | Not in DB (users table lacks updated_by) | ✅ Correct |
| `Employee` | `updatedBy` | Not in DB (employees table lacks updated_by) | ✅ Correct |

## DTO Naming Convention

| Source | Convention | Examples | Status |
|--------|-----------|----------|--------|
| endpoint-catalog.md | PascalCase | `LoginRequest`, `CreateReservationRequest` | ✅ |
| openapi.yaml | PascalCase | `LoginRequest`, `CreateReservationRequest` | ✅ |
| validation.md | PascalCase | `CreateReservationRequest` (implied) | ✅ |

**Verdict:** ✅ Consistent across all sources.

## Cross-References

- [database-api-alignment.md](./database-api-alignment.md) — DB vs API field mapping
- [data-flow-validation.md](./data-flow-validation.md) — Request/response flow
- [naming-inconsistencies.md](./naming-inconsistencies.md) — Naming conventions
