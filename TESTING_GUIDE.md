# 🧪 Mbole Pay - Complete Testing Guide

**Date:** May 22, 2026 | **Status:** 95% Complete | **Goal:** Full End-to-End Testing

---

## 🚀 SETUP FOR TESTING

### 1. Start the Development Server

```bash
cd c:\Desktop\Projects\Mbole-Pay

# Install dependencies (if first time)
pnpm install

# Start dev server
pnpm dev
```

**Expected Output:**
```
> Local:        http://localhost:3000
> Environments: .env.local

✓ Ready in 1.2s
```

---

## ✅ QUICK SMOKE TEST (10 minutes)

Test that everything loads without crashing.

### Step 1: Login
```
1. Open http://localhost:3000
2. You'll be redirected to /signin (not logged in)
3. Click "Sign in with Google"
4. Select your Google account
5. Should land on landing page
```

**What to Verify:**
- ✅ No red errors in browser console
- ✅ Landing page loads with hero section
- ✅ Hero section shows **REAL DATA** (Total Contributions, Pending Payout)
- ✅ "Get Started" button appears
- ✅ Page is responsive (test on mobile size)

### Step 2: Navigate to Dashboard
```
1. Click "Get Started" button or go to http://localhost:3000/dashboard
2. Should see dashboard with stats
```

**What to Verify:**
- ✅ Dashboard loads
- ✅ Shows your user data
- ✅ No console errors
- ✅ Page layout looks good

### Step 3: Navigate to Groups
```
1. Click "Groups" in navigation menu
2. Should see list of groups
```

**What to Verify:**
- ✅ Groups load (if you have any)
- ✅ Can see group names, member counts
- ✅ Quick action buttons appear

---

## 🧬 FEATURE TESTING (30 minutes)

Test each major feature individually.

### A. GROUPS FEATURE

#### Test 1: View Group Details
```
1. Go to /groups
2. Click on any group card
3. Should land on group detail page (/groups/[id])
```

**Verify:**
- ✅ Group name displays
- ✅ Description shows
- ✅ Status badge appears (ACTIVE/INACTIVE)
- ✅ Back button works
- ✅ 4 tabs visible: Overview, Members, Analytics, Settings
- ✅ **Overview tab shows:**
  - Total Contributions (REAL data from database)
  - Your Pending Payout (REAL data)
  - Total Paid Out
  - Group info details
  - Quick action buttons

```
Check Browser Console:
- No red errors
- Confirm fetch requests to /api/groups/[id] and /api/groups/[id]/analytics
```

#### Test 2: View Members Tab
```
1. In group detail page, click "Members" tab
```

**Verify:**
- ✅ List of group members appears
- ✅ Shows member names, emails, roles (ADMIN/TREASURER/MEMBER)
- ✅ Member actions available (Edit Role, Remove)
- ✅ Add Member button visible

#### Test 3: View Analytics Tab
```
1. In group detail page, click "Analytics" tab
2. Wait for data to load
```

**Verify:**
- ✅ 4 KPI metric cards appear:
  - Total Contributed (all members combined)
  - Total Paid Out
  - Members (active/total)
  - Default Rate (%)
- ✅ Line chart shows contribution trend (last 12 months)
- ✅ Pie chart shows payment breakdown by method
- ✅ Top contributors list appears
- ✅ Member statistics table with all members
- ✅ Refresh button works (re-fetches data)
- ✅ Export to CSV button (downloads file)
- ✅ Export to PDF button (downloads file)
- ✅ Pending payouts section shows
- ✅ Cycle info section shows

```
Check Browser Console:
- fetch to /api/groups/[id]/analytics succeeds
- No errors in Recharts rendering
```

#### Test 4: View Settings Tab
```
1. In group detail page, click "Settings" tab
```

**Verify:**
- ✅ Group settings form appears
- ✅ Can edit group name
- ✅ Can edit description
- ✅ Changes save successfully
- ✅ Success message appears

---

### B. CONTRIBUTIONS FEATURE

#### Test 1: View Contributions
```
1. Go to /dashboard or /transactions
2. Should see contribution history
```

**Verify:**
- ✅ List of all contributions
- ✅ Shows amount, date, status
- ✅ Filtered by group or member
- ✅ Can click to see details

#### Test 2: Create New Contribution
```
1. Find "Add Contribution" button
2. Fill in:
   - Group (select)
   - Amount (number)
   - Date (calendar)
   - Payment method (dropdown)
   - Notes (optional text)
3. Click Submit
```

**Verify:**
- ✅ Form validation works (required fields)
- ✅ Amount must be positive number
- ✅ Submission succeeds
- ✅ Toast message shows success
- ✅ New contribution appears in list immediately
- ✅ Total contributions increases

```
Check Browser Console:
- POST to /api/contributions succeeds
- Response shows new contribution with ID
```

---

### C. DISPUTES FEATURE

#### Test 1: View Disputes
```
1. Go to /disputes or click Disputes in nav
```

**Verify:**
- ✅ List of disputes appears (if any exist)
- ✅ Shows dispute title, creator, date
- ✅ Shows current vote counts
- ✅ Status badge (OPEN, RESOLVED, CLOSED)

#### Test 2: File New Dispute
```
1. Click "File Dispute" button
2. Fill form:
   - Group (select)
   - Title (min 5 characters)
   - Description (min 10 characters)
3. Click Submit
```

**Verify:**
- ✅ Form validation works (min character requirements)
- ✅ Submission succeeds
- ✅ New dispute appears in list
- ✅ Status is "OPEN"
- ✅ Creator is you
- ✅ Vote counts show 0-0

```
Check Browser Console:
- POST to /api/disputes succeeds
- Dispute returned with ID
```

#### Test 3: Vote on Dispute
```
1. Click on any OPEN dispute
2. See voting interface
3. Click "UPHOLD" or "REJECT" button
```

**Verify:**
- ✅ Vote submission succeeds
- ✅ Button shows "Already Voted" or similar
- ✅ Vote count increases
- ✅ Your vote is recorded

```
Check Browser Console:
- POST to /api/disputes/[id]/vote succeeds
```

#### Test 4: Resolve Dispute (Admin Only)
```
1. If you're group admin, find dispute status dropdown
2. Change from OPEN to RESOLVED
3. Click Save
```

**Verify:**
- ✅ Status updates
- ✅ Voting is disabled after resolution
- ✅ Confirmation message shows

---

### D. NOTIFICATIONS FEATURE

#### Test 1: View Notification Settings
```
1. Go to /settings/notifications or profile menu
2. Should see notification preferences
```

**Verify:**
- ✅ 6 Email notification toggles:
  - Payment Success
  - Payment Failed
  - Payout Scheduled
  - Dispute Filed
  - Voting Reminder
  - Contribution Reminder
- ✅ 6 SMS notification toggles (same events)
- ✅ Quiet Hours toggle
- ✅ Quiet Hours time pickers (Start: HH:MM, End: HH:MM)
- ✅ Save button

#### Test 2: Update Preferences
```
1. Toggle some email notifications OFF
2. Enable Quiet Hours
3. Set time (e.g., 22:00 to 08:00)
4. Click Save
```

**Verify:**
- ✅ Changes save successfully
- ✅ Success message appears
- ✅ Preferences persist (refresh page, still toggled)

```
Check Browser Console:
- PUT to /api/notifications/preferences succeeds
```

#### Test 3: Manual Notification Test
```
1. Make a payment (or create a contribution)
2. Check if you receive notification based on preferences
```

**Verify:**
- ✅ Email sent (check spam folder)
- ✅ Or SMS sent (if Twilio configured)
- ✅ Respects Quiet Hours setting
- ✅ Respects notification toggles

---

### E. PAYMENTS FEATURE

#### Test 1: View Payment History
```
1. Go to /dashboard/payments or /transactions
2. Should see list of all payments
```

**Verify:**
- ✅ Shows amount, date, method (MTN, Orange, etc)
- ✅ Shows status (PENDING, COMPLETED, FAILED)
- ✅ Grouped by group or chronological

#### Test 2: Initiate Payment
```
1. Click "Make Payment" or "Initiate Payment"
2. Select payment method (MTN MoMo or Orange Money)
3. Enter amount
4. Fill in phone number
5. Click Pay
```

**Verify:**
- ✅ Validation: phone number format
- ✅ Validation: amount is positive
- ✅ Payment request sent to API
- ✅ Status changes to PENDING
- ✅ Loading state shows while processing

```
Check Browser Console:
- POST to /api/payments/initiate succeeds
- Returns payment ID and status URL
```

#### Test 3: Payment Webhook (Optional - Advanced)
```
If you have provider credentials configured:
1. Complete payment flow
2. Provider will send webhook to /api/payments/webhook
3. Payment status should update to COMPLETED
```

---

## 🗄️ DATABASE TESTING (10 minutes)

Verify database integrity and real data.

### Check Database with Prisma Studio

```bash
# In terminal at project root
npx prisma studio
```

This opens http://localhost:5555 with database browser.

**Check These Tables:**

1. **User Table**
   - ✅ Your account is there
   - ✅ Email is correct
   - ✅ Image/avatar populated

2. **Group Table**
   - ✅ Groups exist
   - ✅ Names and descriptions populated
   - ✅ Status shows ACTIVE/INACTIVE

3. **GroupMembership Table**
   - ✅ Your membership in groups
   - ✅ Role shows correct (ADMIN/TREASURER/MEMBER)

4. **Contribution Table**
   - ✅ New contributions you created appear here
   - ✅ Amount is correct
   - ✅ userId matches your ID
   - ✅ groupId matches group ID

5. **Payout Table**
   - ✅ Your payouts listed
   - ✅ Status shows PENDING/COMPLETED
   - ✅ Amount is correct
   - ✅ nextPayoutDate is set

6. **Dispute Table**
   - ✅ Disputes you created appear
   - ✅ Status matches what you set
   - ✅ creatorId is your ID

7. **DisputeVote Table**
   - ✅ Votes appear after voting
   - ✅ Shows your vote (UPHOLD/REJECT)
   - ✅ Multiple votes possible (one per user per dispute)

8. **NotificationPreference Table**
   - ✅ Your preferences saved
   - ✅ Email toggles recorded
   - ✅ Quiet hours times recorded

---

## 🌐 API TESTING (15 minutes)

Test API endpoints directly with curl or Postman.

### Option A: Using Browser Console

```javascript
// Get all groups
fetch('/api/groups').then(r => r.json()).then(d => console.log(d))

// Get specific group
fetch('/api/groups/GROUP_ID').then(r => r.json()).then(d => console.log(d))

// Get group analytics
fetch('/api/groups/GROUP_ID/analytics').then(r => r.json()).then(d => console.log(d))

// Get dashboard stats
fetch('/api/dashboard/stats').then(r => r.json()).then(d => console.log(d))

// Get contributions
fetch('/api/contributions').then(r => r.json()).then(d => console.log(d))

// Get disputes
fetch('/api/disputes').then(r => r.json()).then(d => console.log(d))

// Get notifications preferences
fetch('/api/notifications/preferences').then(r => r.json()).then(d => console.log(d))
```

**Expected Output:**
- ✅ All requests return 200
- ✅ Data structure matches documentation
- ✅ No null/undefined fields that should have data

### Option B: Using Postman (Recommended)

1. Open Postman
2. Create new request
3. GET `http://localhost:3000/api/groups`
4. Headers: Add `Cookie: nextauth.session-token=YOUR_TOKEN` (copy from browser)
5. Send

**Verify:**
- ✅ 200 status
- ✅ JSON response valid
- ✅ No errors

---

## 📊 REAL DATA VERIFICATION

### Verify Landing Page Shows Real Data

```
1. Logout: /api/auth/signout
2. Login again to see fresh state
3. Landing page hero card should show:
   - Real total contributions (calculated from database)
   - Real pending payout (calculated from database)
   - Real next payout date
   - Real member count
```

**What happens behind the scenes:**
```
Hero Section loads
  ↓
useEffect fetches /api/dashboard/stats
  ↓
API queries:
  - User's contributions (sum all amounts)
  - User's pending payouts (sum where status=PENDING)
  - Next payout date (earliest pending payout)
  - Member count (count of group memberships)
  ↓
Numbers displayed in XAF format
```

---

## 🐛 ERROR CHECKING

### Browser Console (F12)

Check for errors after each action:

```
✅ No red errors
✅ No yellow warnings (warnings ok, errors not ok)
✅ Network tab shows all requests 200/201/204
✅ No CORS errors
```

### Network Tab Testing

1. Open DevTools → Network tab
2. Perform an action (create contribution, vote, etc)
3. Look for request to API endpoint
4. Click on request
5. Check:
   - ✅ Status: 200 or 201 (success)
   - ✅ Response tab shows valid JSON
   - ✅ No error messages in response

**Expected Request Pattern:**
```
POST /api/contributions      200   2ms
POST /api/disputes           201   3ms
POST /api/disputes/[id]/vote 200   1ms
GET  /api/groups/[id]/analytics 200 15ms
```

### Server Logs

In terminal where `pnpm dev` runs, check for:

```
✅ No red error messages
✅ No "unhandled error" warnings
✅ POST/GET requests log successfully
```

---

## 📱 RESPONSIVE DESIGN TESTING

### Mobile (375px width)
```
1. Open DevTools (F12)
2. Click "Toggle device toolbar" or press Ctrl+Shift+M
3. Select "iPhone SE" or set width to 375px
4. Test each page:
   - Landing page: Text readable, no horizontal scroll
   - Groups list: Cards stack vertically
   - Group detail: Tabs work, content readable
   - Analytics: Charts responsive, table scrollable
```

**Verify:**
- ✅ No horizontal scrolling
- ✅ Touch targets at least 44px
- ✅ Text readable without zoom
- ✅ All buttons accessible

### Tablet (768px width)
```
1. Set width to 768px
2. Test layout changes to 2 columns where applicable
```

---

## ⚡ PERFORMANCE TESTING

### Page Load Speed

```
1. Go to any group detail page
2. Open DevTools → Performance tab
3. Record page load
4. Check metrics:
```

**Acceptable Times:**
- ✅ First Contentful Paint (FCP): < 1s
- ✅ Largest Contentful Paint (LCP): < 2.5s
- ✅ Total page load: < 3s

### API Response Time

```
1. Network tab in DevTools
2. Look at API request times
```

**Acceptable Times:**
- ✅ /api/groups: < 100ms
- ✅ /api/groups/[id]/analytics: < 500ms (may have calculations)
- ✅ /api/contributions: < 200ms

---

## 🔐 SECURITY TESTING

### Authentication Check

```
1. Try accessing /groups without login
   → Should redirect to /signin ✅
   
2. Login with Google OAuth
   → Should show groups page ✅
   
3. Logout from /api/auth/signout
   → Should redirect to signin ✅
   
4. Try accessing old group URL
   → Should redirect to signin ✅
```

### Authorization Check

```
1. Create a group as USER A
2. Login as USER B
3. Try accessing USER A's group
   → Should show 403 Forbidden error ✅
   
4. Add USER B to group
5. Try accessing again
   → Should succeed ✅
```

### RBAC Testing

```
1. As ADMIN: Try all actions (Edit, Delete, Invite)
   → All succeed ✅

2. As TREASURER: Try admin-only action
   → Should fail or show disabled button ✅

3. As MEMBER: Try treasurer-only action
   → Should fail or show disabled button ✅
```

---

## ✅ COMPLETE TEST CHECKLIST

Print this or use as checklist:

```
SMOKE TEST (10 min)
☐ Landing page loads
☐ Login works
☐ Dashboard accessible
☐ Groups page loads

FEATURES (30 min)
☐ Groups - View details
☐ Groups - View members
☐ Groups - View analytics (charts render)
☐ Groups - Update settings
☐ Contributions - View list
☐ Contributions - Create new
☐ Disputes - View list
☐ Disputes - File dispute
☐ Disputes - Vote on dispute
☐ Notifications - View settings
☐ Notifications - Update preferences
☐ Payments - View history

DATABASE (10 min)
☐ Prisma studio shows data
☐ All tables have records
☐ Real data in analytics

API (15 min)
☐ GET /api/groups: 200
☐ GET /api/groups/[id]: 200
☐ GET /api/groups/[id]/analytics: 200
☐ GET /api/contributions: 200
☐ GET /api/disputes: 200
☐ POST /api/contributions: 201
☐ POST /api/disputes: 201

REAL DATA (5 min)
☐ Landing page shows real totals
☐ Group pages show real analytics
☐ Hero card numbers match database

ERRORS (5 min)
☐ No console errors
☐ No console warnings (warnings ok)
☐ All network requests 200/201
☐ No CORS errors

RESPONSIVE (5 min)
☐ Works on 375px (mobile)
☐ Works on 768px (tablet)
☐ Works on 1920px (desktop)

SECURITY (5 min)
☐ Cannot access without login
☐ Cannot access other user's groups
☐ RBAC permissions enforced

TOTAL TIME: ~2 hours
```

---

## 🚀 WHEN EVERYTHING WORKS

If all tests pass:

1. ✅ MVP is production-ready
2. ✅ Real data flows end-to-end
3. ✅ UI/UX works smoothly
4. ✅ Database integrates correctly
5. ✅ APIs respond correctly
6. ✅ No errors in any browser

**You're ready to ship!** 🎉

---

## ❌ IF YOU FIND ISSUES

### Common Issues & Solutions

**Issue:** 404 on /api/groups
- Check API route file exists: `app/api/groups/route.ts`
- Restart `pnpm dev`

**Issue:** Real data not showing on landing page
- Check `/api/dashboard/stats` returns data
- Check you have contributions in database
- Check browser console for fetch errors

**Issue:** Analytics charts not rendering
- Check Recharts installed: `pnpm add recharts`
- Check data returned from API has items
- Check browser console for chart errors

**Issue:** Payment form submission fails
- Check payment provider credentials in .env
- Check API validation rules
- Check Network tab for error response

**Issue:** Notification preferences not saving
- Check NotificationPreference table exists
- Run: `npx prisma db push`
- Check browser console for PUT errors

---

## 📞 SUPPORT

If stuck:
1. Check browser console for error message
2. Check Network tab for API response
3. Check Prisma studio for database state
4. Restart `pnpm dev`
5. Check `.env` has all required variables

**You've got this! Happy testing!** 🚀
