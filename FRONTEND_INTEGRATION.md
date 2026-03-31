# Frontend Integration & API Testing Guide

## 🚀 What You Now Have

### Phase 1 APIs (✅ Fully Built)
11 production-ready endpoints for group management and contribution tracking:
- **Group Management**: Create, retrieve, update, delete, list members, manage roles
- **Contribution Tracking**: Create, list, update status, delete, get statistics
- **All endpoints**: Permission-checked, input-validated, properly error-handled

### Frontend Hooks (✅ Just Added)
- `useGroups()` - Manage groups (CRUD operations + refetch)
- `useContributions()` - Manage contributions (CRUD operations + statistics)

### Updated Components (✅ Just Integrated)
- `DashboardOverview` - Now displays real group and contribution stats
- `RecentTransactions` - Now displays real contribution data

---

## 📋 Testing Plan (3 Options)

### Option A: Quick Manual Testing in Browser
1. **Start dev server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. **Navigate to dashboard**: http://localhost:3000/dashboard

3. **Verify data loads**:
   - Open browser DevTools (F12) → Network tab
   - Watch for API calls to `/api/groups` and `/api/contributions`
   - Check Console for any errors

4. **What you should see**:
   - Dashboard Overview cards showing real numbers (may be 0 if no data)
   - Recent Transactions list (may be empty if no contributions)
   - Loading skeletons while data fetches
   - No red errors in console

---

### Option B: API Testing with cURL
First, ensure you're authenticated. Then test endpoints directly:

```bash
# Test: Get all groups
curl http://localhost:3000/api/groups \
  -H "Content-Type: application/json"

# Test: Get all contributions
curl http://localhost:3000/api/contributions \
  -H "Content-Type: application/json"

# Test: Get contribution stats
curl "http://localhost:3000/api/contributions/stats" \
  -H "Content-Type: application/json"
```

**Expected Responses**:
- ✅ 200: Success with data
- ⚠️ 401: Not authenticated (log in first)
- ❌ 500: Server error (check Terminal logs)

---

### Option C: Postman Collection Testing
Create a new Postman collection with these endpoints:

#### Authentication
- **POST** `/api/auth/signin`
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

#### Groups
- **GET** `/api/groups` - List all groups
- **POST** `/api/groups` - Create new group
  ```json
  {
    "name": "Test Group",
    "description": "Test Description",
    "contributionAmount": 5000,
    "frequency": "MONTHLY",
    "cycleType": "ROTATING"
  }
  ```
- **GET** `/api/groups/{id}` - Get group details
- **PUT** `/api/groups/{id}` - Update group
- **DELETE** `/api/groups/{id}` - Delete group
- **GET** `/api/groups/{id}/members` - List members

#### Contributions
- **GET** `/api/contributions` - List contributions
- **POST** `/api/contributions` - Create new contribution
  ```json
  {
    "groupId": "group_id_here",
    "userId": "user_id_here",
    "amount": 5000,
    "dueDate": "2026-04-30T00:00:00Z"
  }
  ```
- **GET** `/api/contributions/{id}` - Get contribution details
- **PUT** `/api/contributions/{id}` - Update status
  ```json
  {
    "status": "PAID"
  }
  ```
- **DELETE** `/api/contributions/{id}` - Delete contribution
- **GET** `/api/contributions/stats` - Get statistics

---

## ⚡ Quick Start - Run Now

### Step 1: Start Development Server
```bash
cd c:\Desktop\Projects\Mbole-Pay
npm run dev
# or
pnpm dev
```

Output should look like:
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

### Step 2: Check APIs are Running
Open a new terminal and run:
```bash
curl http://localhost:3000/api/groups
```

You should get a response (may be empty array if no data).

### Step 3: Visit Dashboard
1. Go to http://localhost:3000/dashboard
2. Log in if prompted
3. **Dashboard Overview** should show real data:
   - Active Groups count
   - Total Contributions amount
   - Amount Paid
   - Completion Rate %

4. **Recent Contributions** should show list of transactions

### Step 4: Create Test Data (Optional)
To see real data on dashboard, create a group:
```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Group",
    "description": "Testing the API",
    "contributionAmount": 5000,
    "frequency": "MONTHLY",
    "cycleType": "ROTATING"
  }'
```

---

## 🔧 Troubleshooting

### Issue: Dashboard shows 0 for all metrics
**Solution**: Create test data using the API or manually in database

### Issue: "Not authenticated" errors (401)
**Solution**: Make sure you're logged in. Check NextAuth session in DevTools → Application → Cookies

### Issue: API returns 500 error
**Solution**: Check terminal logs for detailed error. Common causes:
- Database connection issue
- Missing Prisma client
- Invalid request data

### Issue: Components show loading skeletons forever
**Solution**: Check browser console for errors. API call may be failing silently.

---

## 📝 Next Steps

**After testing is successful:**

1. ✅ You have working APIs
2. ✅ Frontend is wired to real data
3. 🔜 **Next Phase** (Week 2-3):
   - Create group/contribution CRUD UI pages
   - Add forms for creating groups
   - Add forms for logging contributions
   - Wire up more dashboard features

---

## 📚 Reference

### Files Modified This Session
- `hooks/use-groups.ts` - New React hook for group management
- `hooks/use-contributions.ts` - New React hook for contribution management
- `components/dashboard/dashboard-overview.jsx` - Updated to use real data
- `components/dashboard/recent-transactions.jsx` - Updated to use real data

### API Documentation
See `API_TESTING_GUIDE.md` for detailed endpoint specifications

### Database Schema
See `prisma/schema.prisma` for data models

---

## ✅ Validation Checklist

Before moving to Phase 2, verify:

- [ ] Dev server starts without errors
- [ ] Dashboard page loads
- [ ] API calls visible in Network tab
- [ ] Dashboard cards show numbers (or "0" if empty)
- [ ] Recent Transactions section displays (or "No contributions yet")
- [ ] No red errors in console
- [ ] Can create test data via API
- [ ] Created data appears on dashboard

Once all ✅, you're ready to build Phase 2 endpoints!
