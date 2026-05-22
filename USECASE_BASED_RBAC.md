# RBAC Implementation - Use Case Based

## Use Case Diagram Implementation

This RBAC system is built directly from your use case diagram with three main actors:

### **User (Member)**
- **Register/Login** → `/api/auth/signin`
- **Create/Join Group** → `/api/groups/create`, `/api/groups/join`
- **Contribute to Group** → `/api/groups/[groupId]/contribute`
- **Vote in Disputes** → `/api/disputes/[disputeId]/vote`
- **Receive Payout** → `/api/payouts`

### **Admin**
- **Manage Group** → `/api/groups/[groupId]/members`
- **View Reports** → `/api/groups/[groupId]/reports`
- **Manage Members** → Assign/remove group roles
- **Group-level Admin** → Can manage only groups they're admin of

### **Super Admin**
- **Approve/Reject Members** → `/api/admin/members/[memberId]`
- **Resolve Disputes** → `/api/admin/disputes/[disputeId]/resolve`
- **Manage All Groups** → `/api/admin/groups`
- **Manage All Users** → `/api/admin/users`

---

## All Created Endpoints

| Endpoint | Method | Actor | Use Case |
|----------|--------|-------|----------|
| `/api/groups/create` | POST | User | Create Group |
| `/api/groups/join` | POST | User | Join Group |
| `/api/groups/[groupId]/contribute` | POST | Member | Contribute to Group |
| `/api/disputes/[disputeId]/vote` | POST | Member | Vote in Disputes |
| `/api/payouts` | GET | Member | Receive Payout |
| `/api/groups/[groupId]/members` | GET/PUT/DELETE | Admin | Manage Group |
| `/api/groups/[groupId]/reports` | GET | Admin/Treasurer | View Reports |
| `/api/admin/members/[memberId]` | POST/DELETE | Super Admin | Approve/Reject Member |
| `/api/admin/disputes/[disputeId]/resolve` | POST | Super Admin | Resolve Dispute |
| `/api/admin/users` | GET/PUT | Super Admin | Manage Users |
| `/api/admin/groups` | GET/POST | Admin+ | Manage Groups |

---

## Quick Start Testing

### 1. Create a Group (as User/Member)
```bash
curl -X POST http://localhost:3000/api/groups/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Savings Group",
    "description": "Community savings",
    "contributionAmount": 50000,
    "frequency": "MONTHLY",
    "cycleType": "ROTATING"
  }'
```

### 2. Join a Group (as User/Member)
```bash
curl -X POST http://localhost:3000/api/groups/join \
  -H "Content-Type: application/json" \
  -d '{"inviteCode": "ABC123XYZ"}'
```

### 3. Make a Contribution (as Member)
```bash
curl -X POST http://localhost:3000/api/groups/[groupId]/contribute \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "dueDate": "2026-06-30"}'
```

### 4. Vote on Dispute (as Member)
```bash
curl -X POST http://localhost:3000/api/disputes/[disputeId]/vote \
  -H "Content-Type: application/json" \
  -d '{"vote": "UPHOLD"}'
```

### 5. Get Your Payouts (as Member)
```bash
curl -X GET http://localhost:3000/api/payouts
```

### 6. View Group Reports (as Admin)
```bash
curl -X GET http://localhost:3000/api/groups/[groupId]/reports
```

### 7. Manage Group Members (as Admin)
```bash
curl -X GET http://localhost:3000/api/groups/[groupId]/members
```

### 8. Approve/Reject Member (as Super Admin)
```bash
curl -X POST http://localhost:3000/api/admin/members/[memberId]/route \
  -H "Content-Type: application/json" \
  -d '{"groupId": "[groupId]"}'
```

### 9. Resolve Dispute (as Super Admin)
```bash
curl -X POST http://localhost:3000/api/admin/disputes/[disputeId]/resolve \
  -H "Content-Type: application/json" \
  -d '{"resolution": "UPHELD", "status": "RESOLVED"}'
```

---

## Next Steps

1. Test all endpoints with appropriate auth tokens
2. Create UI components for each use case
3. Add role-based navbar/sidebar visibility
4. Create admin dashboard
5. Implement real Smart Contract integration for dispute resolution
