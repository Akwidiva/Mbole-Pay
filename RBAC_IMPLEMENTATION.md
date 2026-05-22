# Role-Based Access Control (RBAC) Implementation Guide

## Overview
Mbole Pay now has a comprehensive role-based access control system with two levels:
1. **System-level roles** (for the entire application)
2. **Group-level roles** (for specific groups)

---

## System-Level Roles

### 1. **SUPER_ADMIN** (Level 3)
- Full system access
- Can manage all users and assign roles
- Can manage all groups and their status
- Can access all admin endpoints
- Can suspend groups or users

### 2. **ADMIN** (Level 2)
- Can manage groups they created or admin
- Can view system groups and their own groups
- Can manage group members and assign group roles
- Can update group status for groups they manage
- Cannot access user management endpoints (requires SUPER_ADMIN)

### 3. **USER** (Level 1)
- Regular member
- Can create groups (becomes group ADMIN)
- Can join groups
- Can view their own data
- Can participate in group activities

---

## Group-Level Roles

### 1. **ADMIN** (Level 3)
- Manage group members
- Assign group roles
- Update group settings
- Create disputes
- Manage payments

### 2. **TREASURER** (Level 2)
- Record payments
- Generate reports
- Manage payment records
- Cannot change group settings

### 3. **MEMBER** (Level 1)
- Make contributions
- View group data
- Participate in voting
- Cannot manage group

---

## File Structure

```
lib/
├── role-middleware.ts       # Role checking functions
└── roles.ts                 # Role utility functions and hierarchy

app/api/admin/
├── users/route.js           # Super Admin only - manage users
└── groups/route.js          # Admin+ - manage groups
```

---

## Usage Examples

### 1. Check System-Level Role in API Endpoint

```typescript
import { checkUserRole, roleErrorResponse } from '@/lib/role-middleware';

export async function GET(request) {
  // Check if user is ADMIN or higher
  const roleCheck = await checkUserRole('ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  const { user } = roleCheck;
  // User is authorized, proceed with endpoint logic
}
```

### 2. Check Group-Level Role in API Endpoint

```typescript
import { checkGroupRole, roleErrorResponse } from '@/lib/role-middleware';

export async function POST(request, { params }) {
  // Check if user is TREASURER or higher in a specific group
  const roleCheck = await checkGroupRole(params.groupId, 'TREASURER');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  const { user, membership } = roleCheck;
  // User has required group role, proceed
}
```

### 3. Client-Side Role Checking

```typescript
import { hasRole, hasGroupRole, getRoleName } from '@/lib/roles';

// Check if user has at least ADMIN role
if (hasRole(userRole, 'ADMIN')) {
  // Show admin features
}

// Check if user has at least TREASURER role in a group
if (hasGroupRole(memberRole, 'TREASURER')) {
  // Show treasurer features
}

// Get readable role name
const displayName = getRoleName(userRole);
```

---

## Protected Endpoints

### Super Admin Only
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/[userId]/role` - Change user role

### Admin+ 
- `GET /api/admin/groups` - List manageable groups
- `POST /api/admin/groups/[groupId]/status` - Update group status

---

## Database Schema Update

The `User` model now has a `role` field:

```prisma
model User {
  id    String   @id @default(cuid())
  email String   @unique
  // ... other fields
  role  String   @default("USER")  // "SUPER_ADMIN" | "ADMIN" | "USER"
  // ... relations
}
```

---

## Migration Steps (Required)

1. **Stop your dev server** if it's running
2. Run the migration:
   ```bash
   npx prisma migrate dev --name add_user_role
   ```
3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
4. **Seed an initial Super Admin** (see next section)
5. Restart your dev server

---

## Seeding Initial Super Admin

Add this to `prisma/seed.ts` to create a super admin user:

```typescript
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  // Create super admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@mbole-pay.com" },
    update: { role: "SUPER_ADMIN" },
    create: {
      email: "admin@mbole-pay.com",
      name: "Super Admin",
      password: await bcrypt.hash("super_admin_password_123", 10),
      role: "SUPER_ADMIN",
    },
  });

  console.log("Super Admin created:", superAdmin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Then run:
```bash
npx prisma db seed
```

---

## UI Components That Need Updates

1. **Navbar** - Show role badge
2. **Sidebar** - Hide admin links for non-admins
3. **Dashboard** - Show role-specific widgets
4. **Group Management** - Show/hide based on group role
5. **Admin Panel** - Only visible to SUPER_ADMIN

---

## Best Practices

1. ✅ **Always check roles on both client and server**
2. ✅ **Use role hierarchy for permission checks**
3. ✅ **Log role changes for audit trail**
4. ✅ **Validate role changes at the backend**
5. ❌ **Don't rely only on client-side role checks**
6. ❌ **Don't hardcode role strings**

---

## Testing the RBAC System

### Test Super Admin Access
```bash
curl -H "Authorization: Bearer [token]" \
  http://localhost:3000/api/admin/users
```

### Test Insufficient Permissions
```bash
curl -H "Authorization: Bearer [user-token]" \
  http://localhost:3000/api/admin/users
# Should return 403 Forbidden
```

---

## Next Steps

1. Update UI components to respect roles
2. Create admin dashboard
3. Add role management interface
4. Implement audit logging
5. Add role-based feature flags
