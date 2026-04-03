# 🧪 WEEK 1-2 COMPREHENSIVE TESTING PLAN
**Date:** April 1, 2026  
**Status:** Ready to Execute  
**Coverage:** All 14 API endpoints + Frontend integration

---

## 📋 **Test Scenarios**

### **PHASE 1: Authentication & Users**

#### Test 1.1: User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "phone": "+237123456789"
  }'
```
**Expected:** 201 - User created with hashed password
**Verify:** Check `users` table in DB

#### Test 1.2: User Sign In
```bash
# After creating user, sign in with NextAuth
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'
```
**Expected:** 200 - Session token returned

---

### **PHASE 2: Group Management**

#### Test 2.1: Create Group
```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Authorization: Bearer {SESSION_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Savings Group Alpha",
    "description": "Monthly savings group for logistics workers",
    "contributionAmount": 5000,
    "frequency": "MONTHLY",
    "cycleType": "ROTATING"
  }'
```
**Expected:** 201 - Group created with:
- Auto-generated invite code (8 characters, unique)
- Creator auto-added as ADMIN
- Empty memberships count

**Verify:** 
- Check `groups` table
- Check `memberships` table (creator as ADMIN)
- Check `inviteCode` is 8 alphanumeric chars

---

#### Test 2.2: List User's Groups
```bash
curl -X GET http://localhost:3000/api/groups \
  -H "Authorization: Bearer {SESSION_TOKEN}"
```
**Expected:** 200 - Array of groups with:
- Group details
- Member count
- Total contributions
- User's role in group

**Verify:**
- Returns only groups where user is a member
- Includes contribution stats
- Includes member count

---

#### Test 2.3: Get Single Group Details
```bash
curl -X GET http://localhost:3000/api/groups/{GROUP_ID} \
  -H "Authorization: Bearer {SESSION_TOKEN}"
```
**Expected:** 200 - Single group with:
- All group fields
- Members array with contributions stats
- Contribution summary
- Group status

**Verify:**
- Each member has contribution stats (paid/pending/overdue counts)
- Totals match database

---

#### Test 2.4: Update Group (Admin Only)
```bash
curl -X PUT http://localhost:3000/api/groups/{GROUP_ID} \
  -H "Authorization: Bearer {SESSION_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Group Name",
    "description": "New description",
    "contributionAmount": 10000
  }'
```
**Expected:** 200 - Group updated
**Verify:** Changes reflect in database

**Auth Test:** Try as non-admin member
**Expected:** 403 - "Only group admin can update"

---

#### Test 2.5: Delete Group (Creator Only)
```bash
curl -X DELETE http://localhost:3000/api/groups/{GROUP_ID} \
  -H "Authorization: Bearer {SESSION_TOKEN}"
```
**Expected:** 200 - Group soft-deleted (isDeleted = true)
**Verify:** 
- Group still in DB but `isDeleted = true`
- Doesn't appear in list

**Auth Test:** Try as regular member
**Expected:** 403 - "Only group creator can delete"

---

### **PHASE 3: Group Membership**

#### Test 3.1: List Group Members
```bash
curl -X GET http://localhost:3000/api/groups/{GROUP_ID}/members \
  -H "Authorization: Bearer {SESSION_TOKEN}"
```
**Expected:** 200 - Array of members with:
- User info (id, name, email, phone)
- Member role (ADMIN, TREASURER, MEMBER)
- Contribution stats (total, paid, pending, overdue)

**Verify:**
- Creator shows as ADMIN
- Stats match contributions in DB

---

#### Test 3.2: Join Group (Via Invite Code)
```bash
# First, get invite code from group creation
curl -X POST http://localhost:3000/api/groups/join \
  -H "Authorization: Bearer {NEW_USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "inviteCode": "ABC12345"
  }'
```
**Expected:** 200 - User joined as MEMBER
**Verify:** 
- New membership created with role MEMBER
- User appears in members list
- Doesn't appear in group twice on re-join

**Error Test:** Invalid invite code
**Expected:** 404 - "Invalid invite code"

**Conflict Test:** Try joining same group twice
**Expected:** 409 - "Already a member of this group"

---

#### Test 3.3: Update Member Role (Admin Only)
```bash
curl -X PUT http://localhost:3000/api/groups/{GROUP_ID}/members \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "{MEMBER_USER_ID}",
    "newRole": "TREASURER"
  }'
```
**Expected:** 200 - Member role changed to TREASURER
**Verify:** Role updated in database

**Validation Test:** Invalid role
**Expected:** 400 - "Invalid role. Must be ADMIN, TREASURER, or MEMBER"

**Auth Test:** Try as non-admin
**Expected:** 403 - "Only admins can manage members"

---

#### Test 3.4: Remove Member (Admin Only)
```bash
curl -X DELETE http://localhost:3000/api/groups/{GROUP_ID}/members \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "{MEMBER_TO_REMOVE}"
  }'
```
**Expected:** 200 - Member removed
**Verify:** Membership deleted, user no longer in members list

**Auth Test:** Try as non-admin
**Expected:** 403 - "Only admins can remove members"

---

### **PHASE 4: Contributions**

#### Test 4.1: Create Contribution
```bash
curl -X POST http://localhost:3000/api/contributions \
  -H "Authorization: Bearer {TREASURER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "{USER_ID}",
    "groupId": "{GROUP_ID}",
    "amount": 5000,
    "dueDate": "2026-04-30",
    "status": "PENDING"
  }'
```
**Expected:** 201 - Contribution created
**Verify:** Stored in database with status PENDING

**Auth Test:** Only TREASURER or ADMIN can create
**Expected:** 403 - "Only treasurer/admin can create"

---

#### Test 4.2: List Contributions
```bash
curl -X GET "http://localhost:3000/api/contributions?groupId={GROUP_ID}&status=PENDING&page=1&limit=10" \
  -H "Authorization: Bearer {SESSION_TOKEN}"
```
**Expected:** 200 - Array of contributions with:
- Pagination info
- Filter applied correctly
- User details included
- Group details included

**Verify:**
- All filters work (status, group, user, dateRange)
- Pagination works (page, limit)
- Only returns user's contributions or group contributions

---

#### Test 4.3: Get Single Contribution
```bash
curl -X GET http://localhost:3000/api/contributions/{CONTRIBUTION_ID} \
  -H "Authorization: Bearer {SESSION_TOKEN}"
```
**Expected:** 200 - Single contribution with all details

---

#### Test 4.4: Update Contribution Status
```bash
curl -X PUT http://localhost:3000/api/contributions/{CONTRIBUTION_ID} \
  -H "Authorization: Bearer {TREASURER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID",
    "paidAt": "2026-04-15"
  }'
```
**Expected:** 200 - Status updated to PAID

**Validate:** Status transitions
- PENDING → PAID ✓
- PENDING → OVERDUE ✓
- PAID → anything ✗ (frozen status)

---

#### Test 4.5: Delete Contribution
```bash
curl -X DELETE http://localhost:3000/api/contributions/{CONTRIBUTION_ID} \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```
**Expected:** 200 - Contribution deleted
**Verify:** Removed from database

**Auth Test:** Only ADMIN can delete
**Expected:** 403 - "Only admin can delete"

---

#### Test 4.6: Get Contribution Statistics
```bash
curl -X GET "http://localhost:3000/api/contributions/stats?groupId={GROUP_ID}" \
  -H "Authorization: Bearer {SESSION_TOKEN}"
```
**Expected:** 200 - Stats object with:
- Total contributions
- Paid amount
- Pending amount  
- Overdue amount
- Completion rate (%)
- Group performance

**Verify:** All calculations correct per database

---

### **PHASE 5: Frontend Integration**

#### Test 5.1: Dashboard Loads Real Data
1. Visit `http://localhost:3000/dashboard`
2. **Check:**
   - Group count matches `GET /api/groups` count
   - Contribution stats match `GET /api/contributions/stats`
   - Recent transactions shows actual contributions
   - Loading skeletons work during fetch
   - No console errors

#### Test 5.2: Groups Page
1. Visit `http://localhost:3000/groups`
2. **Check:**
   - "Create" tab shows create dialog
   - "Join" tab shows join dialog
   - Groups list shows real groups
   - Can create new group
   - Can join group with code
   - Member list shows real members

#### Test 5.3: Group Settings Page
1. Click on group → Settings
2. **Check:**
   - Edit form populated with real data
   - Can update name/description
   - Invite code displays and copies to clipboard
   - Group config shows (amount, frequency, cycle)
   - Danger zone visible

#### Test 5.4: Contributions Page
1. Visit `http://localhost:3000/transactions`
2. **Check:**
   - List shows real contributions
   - Filters work (group, status, date range)
   - Calendar view shows contributions on dates
   - Status colors correct (green/blue/red)
   - Can toggle list/calendar
   - Search works in real-time

#### Test 5.5: Error States
1. **Test unauthorized access:**
   - Visit dashboard as logged-out user → redirects to signin
   - Try API call without session → 401

2. **Test 404 states:**
   - Visit non-existent group `/groups/fake-id` → Shows error
   - Try joining invalid invite code → Error toast

3. **Test permission errors:**
   - Non-admin tries to update group → Error
   - Non-treasurer tries to create contribution → Error

---

## ✅ **Acceptance Criteria**

### Backend
- [ ] All 14 endpoints respond with correct status codes
- [ ] All validations work (400 errors caught)
- [ ] All auth checks work (401 for missing session)
- [ ] All permission checks work (403 for insufficient role)
- [ ] All Prisma queries work without errors
- [ ] Timestamps saved correctly
- [ ] Database cascades work (delete group → delete contributions)

### Frontend
- [ ] All pages load without console errors
- [ ] Real API data displays correctly
- [ ] All forms validate inputs
- [ ] Success/error toasts appear
- [ ] Loading states display properly
- [ ] Dark/Light mode works
- [ ] Mobile responsive
- [ ] All navigation works

### Data Integrity
- [ ] No duplicate memberships
- [ ] No orphaned contributions
- [ ] Soft deletes work (data not lost)
- [ ] Stats calculations correct
- [ ] Timestamps accurate

---

## 🚀 **Quick Test Execution**

### **Before Testing**
1. Start dev server: `npm run dev`
2. Create test user via signup page
3. Note the session token from browser cookies
4. Get group ID from created group

### **Run All Tests**
```bash
# 1. Auth tests
curl http://localhost:3000/api/auth/register ...

# 2. Group tests
curl http://localhost:3000/api/groups ...

# 3. Member tests
curl http://localhost:3000/api/groups/join ...

# 4. Contribution tests
curl http://localhost:3000/api/contributions ...

# 5. Frontend tests
Open http://localhost:3000 in browser
```

---

## 📊 **Results Template**

| Test | Endpoint | Status | Response | Notes |
|------|----------|--------|----------|-------|
| 2.1 | POST /groups | ✅/❌ | 201 | Group created |
| 2.2 | GET /groups | ✅/❌ | 200 | 3 groups returned |
| 3.2 | POST /groups/join | ✅/❌ | 200 | User joined |
| 4.1 | POST /contributions | ✅/❌ | 201 | Created |
| 5.1 | GET /dashboard | ✅/❌ | 200 | Real data loads |

---

**All endpoints ready for testing! Begin with Phase 1.** ✅
