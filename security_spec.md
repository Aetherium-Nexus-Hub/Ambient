# Security Specification - Animus Nexus

## Data Invariants
- `VaultItem` and `Message` documents in the `users` subcollection must strictly belong to the owner identified by the `userId`.
- `VisionState` and `ConnectivityTest` documents are public read-only (or system-only writes).
- Timestamps must be handled as numbers or server timestamps (in this app, they are stored as `Date.now()` which is a number).

## The Dirty Dozen Payloads

1. **Identity Spoofing**: User A trying to write a message to User B's collection.
2. **Path Variable Hardening**: Trying to access `artifacts/animus-nexus-v4/users/very-long-junk-id-string-exceeding-limit/vault/item1`.
3. **Ghost Fields**: Adding `isVerified: true` to a `VaultItem`.
4. **Invalid Type**: Sending `timestamp: "not-a-number"` in a message.
5. **PII Blanket Test**: Trying to list messages of all users.
6. **Query Trust Test**: Querying messages without a `where` clause on `userId` (the rules must enforce this).
7. **Resource Poisoning**: Sending a 1MB string as the `text` field in a message.
8. **Status Shortcutting**: (Not applicable yet, but if status exists, jumping from 'pending' to 'extracted' without progress).
9. **System-Only Field Modification**: Trying to update `vision_node/current_state` from the client.
10. **Orphaned Write**: Adding a `VaultItem` with a non-existent `appId`.
11. **Shadow Update**: Updating a message and changing its `role` to 'system'.
12. **Recursive Attack**: Rapidly adding thousands of records (mitigated by size limits and auth).

## Test Runner (Draft Logic)

```typescript
// Example tests in firestore.rules.test.ts
// Test: User cannot write to another user's vault
// const db = testEnv.authenticatedContext('userA').firestore();
// await assertFails(addDoc(collection(db, 'artifacts/app1/users/userB/vault'), { name: 'fragment' }));
```
