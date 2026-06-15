# Security Specification

## Data Invariants
1. A transaction cannot be created or viewed outside its parent organization.
2. A user cannot read or edit organization data unless they are a validated member of the organization.
3. Member roles are strictly set to 'admin' or 'member'. Only 'admin' users can invite or manage other members.
4. User profiles are readable and writable only by the authenticated owner.

## The Dirty Dozen Payloads (Intrusions and Violations)
The following payloads are designed to challenge Identity, Integrity, and State:

1. **User Identity Spoofing**: Trying to create a user profile for a different UID.
2. **User PII Read Leak**: Non-owner trying to read another user's profile containing their private email.
3. **Orphan Organization**: Creating an organization without establishing a synchronous membership document for the creator.
4. **Organization Hijack**: Modifying the `createdBy` property of an organization to transfer ownership.
5. **Unauthorized Member Ingress**: A non-admin member of an organization adding a new member.
6. **Self-Promotion Hook**: A member trying to update their own role from 'member' to 'admin'.
7. **Cross-Tenant Financial Snoop**: Trying to read transactions of an organization the user does not belong to.
8. **Malicious Negative Transaction**: Injecting a negative transaction amount.
9. **Junk Document ID Injection**: Attempting to inject a huge junk string as a transaction ID.
10. **Shadow Field Injection**: Adding an unapproved system-only field (`isInternalApproved: true`) to a transaction.
11. **Timestamp Spoofing**: Creating a transaction with a pre-dated client timestamp instead of the server time.
12. **Post-Terminal Update**: Attempting to modify historical transaction dates to manipulate closing cash.

## Firestore Rules Test Runner
Here is a conceptual test runner for testing these rules.

```typescript
// firestore.rules.test.ts
// Test runner for LedgerSpace Multi-Org Security Rules
import { assertSucceeds, assertFails, initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Multi-Org Budget Tracker Security Rules', () => {
  // Test suites confirming that each of the Dirty Dozen Payloads is correctly blocked (PERMISSION_DENIED).
});
```
