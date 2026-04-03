# Role-Based Access Control (RBAC)

Complete role-based access control system for Mbole Pay. Implements three-tier permission model with granular control over financial operations and group management.

## Overview

Mbole Pay uses a **group-scoped RBAC** system where users have different roles in each group they belong to:

- **ADMIN**: Full group management and operations
- **TREASURER**: Financial operations and approvals
- **MEMBER**: Basic access and personal contributions

## Architecture

```
┌─────────────────────────────────────┐
│      User Request                    │
│      (API Endpoint)                  │
├─────────────────────────────────────┤
│      Authentication Check            │
│      (NextAuth.js)                   │
├─────────────────────────────────────┤
│      Group Access Check              │
│      (Membership lookup)              │
├─────────────────────────────────────┤
│      Permission Check                │
│      (Role → Permissions mapping)     │
├─────────────────────────────────────┤
│      Business Logic                  │
│      (API handler)                   │
└─────────────────────────────────────┘
```

## Role Definitions

### ADMIN (Group Administrator)

**Permissions (24 total):**
- Group management: view, edit, delete
- Member management: view, add, remove
- Contribution management: full CRUD
- Payment operations: view, create, approve, retry
- Payout operations: view, create, approve
- Reports: generate, view, export
- Disputes: view, create, resolve

**Use Case:** Group creator, group owner with full control

### TREASURER

**Permissions (18 total):**
- Group viewing and member viewing
- Contribution viewing and editing
- Payment operations: view, create, approve, retry
- Payout operations: view, create, approve
- Reports: generate, view, export
- Dispute only viewing

**Use Case:** Finance manager, payment processor, audit coordinator

### MEMBER

**Permissions (7 total):**
- Group viewing
- Contribution viewing
- Payment viewing and creation (own only)
- Report viewing
- Dispute viewing and creation

**Use Case:** Regular group member, contributor

## Permission Model

### Permission Categories

**Group Operations:**
- `group:view` - View group details
- `group:edit` - Modify group settings
- `group:delete` - Archive/delete group

**Member Management:**
- `members:view` - List group members
- `members:add` - Invite new members
- `members:remove` - Remove members

**Contribution Management:**
- `contributions:view` - View contribution records
- `contributions:edit` - Adjust contributions
- `contributions:create` - Create new contributions
- `contributions:delete` - Remove contributions

**Payment Operations:**
- `payments:view` - View payment records
- `payments:create` - Initiate payments
- `payments:approve` - Approve payments
- `payments:retry` - Retry failed payments

**Payout Management:**
- `payouts:view` - View payout schedules
- `payouts:create` - Schedule payouts
- `payouts:approve` - Approve payout execution

**Reporting:**
- `reports:generate` - Create new reports
- `reports:view` - View existing reports
- `reports:export` - Download in multiple formats

**Dispute Resolution:**
- `disputes:view` - See dispute cases
- `disputes:create` - File disputes
- `disputes:resolve` - Settle disputes

## API Usage

### Type Definitions

```typescript
import { GroupRole, hasPermission, type Permission } from "@/types/roles";

// Available roles
type Role = "ADMIN" | "TREASURER" | "MEMBER";

// Available permissions (24 total)
type Permission =
  | "group:view"
  | "group:edit"
  | "group:delete"
  | "members:view"
  | "members:add"
  | "members:remove"
  | "contributions:view"
  | "contributions:edit"
  | "contributions:create"
  | "contributions:delete"
  | "payments:view"
  | "payments:create"
  | "payments:approve"
  | "payments:retry"
  | "payouts:view"
  | "payouts:create"
  | "payouts:approve"
  | "reports:generate"
  | "reports:view"
  | "reports:export"
  | "disputes:view"
  | "disputes:create"
  | "disputes:resolve";
```

### Checking Permissions in Code

```typescript
import { userHasPermission, isGroupAdmin, isGroupTreasurerOrAbove } from "@/lib/rbac";

// Check specific permission
const canGenerateReports = await userHasPermission(
  userId,
  groupId,
  "reports:generate"
);

// Check role level
const isAdmin = await isGroupAdmin(userId, groupId);
const isTreasurer = await isGroupTreasurerOrAbove(userId, groupId);

// Get user's role
const role = await getUserGroupRole(userId, groupId);
// Returns: "ADMIN" | "TREASURER" | "MEMBER" | null
```

### API Endpoint Example

```typescript
// app/api/reports/generate/route.ts
import { userHasPermission } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  
  // Check group access and permission
  if (body.groupId) {
    const hasPermission = await userHasPermission(
      user.id,
      body.groupId,
      "reports:generate"
    );
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Unauthorized: Insufficient permissions" },
        { status: 403 }
      );
    }
  }
  
  // Proceed with business logic
  // ...
}
```

## Protected Operations

### Financial Operations (Treasurer+ Required)

- Creating payments
- Approving payments
- Retrying payments
- Scheduling payouts
- Approving payouts
- Generating financial reports
- Exporting report data

### Administrative Operations (Admin Required)

- Modifying group settings
- Adding/removing members
- Editing contribution amounts
- Deleting records
- Changing member roles
- Resolving disputes

### Personal Operations (Any Member)

- Paying own contributions
- Viewing own statements
- Creating personal disputes
- Downloading personal reports

## Implementation Details

### Role Hierarchy

```typescript
const RoleHierarchy = {
  MEMBER: 1,      // Base level
  TREASURER: 2,   // Middle level
  ADMIN: 3,       // Highest level
};

// Admin outranks everyone
roleOutranks(GroupRole.ADMIN, GroupRole.MEMBER);     // true
roleOutranks(GroupRole.ADMIN, GroupRole.TREASURER);  // true

// Treasurer outranks members
roleOutranks(GroupRole.TREASURER, GroupRole.MEMBER); // true
```

### Database Schema

```prisma
model Membership {
  id        String @id @default(cuid())
  role      String // "ADMIN" | "TREASURER" | "MEMBER"
  userId    String
  groupId   String
  createdAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id])
  group Group @relation(fields: [groupId], references: [id])

  @@unique([userId, groupId])
}
```

## Security Best Practices

### 1. Always Check Permissions

```typescript
// ✅ CORRECT
const canDelete = await userHasPermission(userId, groupId, "contributions:delete");
if (!canDelete) throw new Error("Unauthorized");

// ❌ INCORRECT - Relying on client-side checks only
if (userRole !== "ADMIN") { /* dangerous */ }
```

### 2. Use Role-Specific Endpoints

```typescript
// ✅ CORRECT - Dedicated treasure endpoint
POST /api/payments/approve (TREASURER+ only)

// ❌ INCORRECT - Generic endpoint with client-side filtering
POST /api/payments/update?approve=true
```

### 3. Log Permission Checks

```typescript
console.log(`[RBAC] User ${userId} checked permission ${permission} in group ${groupId}`);
console.log(`[RBAC] Access ${hasPermission ? "GRANTED" : "DENIED"}`);
```

### 4. Validate User Still Has Access

```typescript
// Re-check on sensitive operations
const currentRole = await getUserGroupRole(userId, groupId);
if (!currentRole) {
  throw new Error("User no longer has access to this group");
}
```

## Testing

### Unit Tests

```bash
npm test -- __tests__/rbac.test.ts
```

Tests verify:
- Permission mappings correct for each role
- Role hierarchy working correctly
- hasPermission() logic accurate
- All permissions accounted for

### Integration Tests

```bash
npm test -- __tests__/api-endpoints.test.ts
```

Tests verify:
- API endpoints enforce permissions
- Unauthorized requests rejected
- Valid requests processed
- Error handling working

### Test Coverage

```bash
npm test -- --coverage
```

Target coverage:
- Statements: 90%+
- Branches: 85%+
- Functions: 90%+
- Lines: 90%+

## API Endpoints with RBAC

### Reports API

```typescript
// Generate report (TREASURER+)
POST /api/reports/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "reportType": "GROUP_SUMMARY",
  "format": "PDF",
  "groupId": "group-123"
}

Response (200):
{
  "success": true,
  "reportType": "GROUP_SUMMARY",
  "fileName": "GROUP_SUMMARY_1704067200000.pdf",
  "fileSize": 45120,
  "generatedAt": "2024-01-01T10:30:00Z"
}

Error Response (403):
{
  "error": "Unauthorized: You do not have permission to generate reports"
}
```

### Payments API

```typescript
// Create payment (MEMBER+)
POST /api/payments/create
Authorization: Bearer <token>

// Approve payment (TREASURER+)
POST /api/payments/approve
Authorization: Bearer <token>

// Retry payment (TREASURER+)
POST /api/payments/retry
Authorization: Bearer <token>
```

### Group Management API

```typescript
// Edit group (ADMIN)
POST /api/groups/[id]/edit
Authorization: Bearer <token>

// Add member (ADMIN)
POST /api/groups/[id]/members/add
Authorization: Bearer <token>

// Remove member (ADMIN)
DELETE /api/groups/[id]/members/[userId]
Authorization: Bearer <token>
```

## Troubleshooting

### User Cannot Perform Operation

1. **Check role in group:**
   ```typescript
   const role = await getUserGroupRole(userId, groupId);
   console.log("User role:", role);
   ```

2. **Verify permission exists:**
   ```typescript
   const hasPermission = await userHasPermission(userId, groupId, "operation:name");
   console.log("Has permission:", hasPermission);
   ```

3. **Check API endpoint protection:**
   - Confirm middleware is applied
   - Verify permission check in handler
   - Check error messages in logs

### Permission Too Restrictive

- Review [RolePermissions](#role-definitions) mapping
- Adjust role assignments if needed
- Consider creating new role if pattern emerges

### Permission Too Permissive

- Review role definitions
- Audit who has which roles
- Strengthen checks if needed

## Future Enhancements

1. **Dynamic Roles:** Allow creating custom roles
2. **Time-based Permissions:** Temporary elevated access
3. **IP-based Restrictions:** Lock operations to specific IPs
4. **Audit Trails:** Track all permission-guarded operations
5. **Permission Delegation:** Allow temporary permission transfer
6. **Group-level Policies:** Define org-wide RBAC rules

## Reference

- [Types: roles.ts](../../types/roles.ts)
- [Utilities: lib/rbac.ts](../../lib/rbac.ts)
- [Tests: __tests__/rbac.test.ts](__tests__/rbac.test.ts)
