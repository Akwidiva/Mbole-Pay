# 📅 WEEK 3 DEVELOPMENT PLAN: Payment Integration Phase 1
**Timeline:** April 6-12, 2026  
**Goal:** Payment initialization & verification complete  
**Status:** Ready to start planning

---

## 🎯 **Week 3 Overview**

### **Context**
- **Current Progress:** 60% of total project (100% of Weeks 1-2)
- **Starting Date:** April 6, 2026 (14 days after Week 1-2 completion)
- **Duration:** 7 days
- **Prerequisites:** All Week 1-2 endpoints & frontend complete ✅

### **Primary Goals**
1. ✅ Payment gateway integration (Flutterwave setup)
2. ✅ Payment initialization API endpoint
3. ✅ Payment verification & webhook handling
4. ✅ Payment status tracking in database
5. ✅ Basic payment form UI

---

## 📊 **Week 3 Tasks Breakdown**

### **Task 1: Setup Payment Provider (Day 1-2)**
🎯 **Goal:** Flutterwave API configured & ready

#### **1.1 Flutterwave Account Setup**
- [ ] Log in to [Flutterwave Dashboard](https://dashboard.flutterwave.com)
- [ ] Get API keys (Public & Secret)
- [ ] Configure webhook URL: `https://yourdomain.com/api/payments/webhook`
- [ ] Test credentials in `.env.local`

**Files to Create:**
```
.env.local additions:
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=pk_test_xxx
FLUTTERWAVE_SECRET_KEY=sk_test_xxx
WEBHOOK_SECRET=webhook_xxx
```

#### **1.2 Payment Provider Decision**
support multiple payment methods:
- [ ] **Flutterwave** (Recommended - supports mobile money, cards)
  - Supporting: MTN MoMo, Orange Money, Airtel, etc.
  - Regions: West Africa (Cameroon, Nigeria, Kenya, Uganda)
  - Web SDK available

- [ ] **Alternative: Direct MTN MoMo API** (If preferred)
  - Cameroon-specific
  - More direct integration

**Decision:** Use **Flutterwave** as primary (supports multiple payment methods)

---

### **Task 2: Database Schema Updates (Day 2-3)**
🎯 **Goal:** Payment tracking tables ready

#### **2.1 Update Prisma Schema**
Add to `prisma/schema.prisma`:

```prisma
model Payment {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  groupId           String
  group             Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  contributionId    String?
  contribution      Contribution? @relation(fields: [contributionId], references: [id], onDelete: SetNull)
  
  amount            Float
  currency          String   @default("XAF") // Cameroon Franc
  status            String   @default("PENDING") // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
  
  // Flutterwave Integration
  transactionRef    String?  @unique
  flutterwaveRef    String?  @unique
  flutterwaveStatus String?
  
  paymentMethod     String?  // card, mobile_money, bank_transfer
  
  // Retry Logic
  retryCount        Int      @default(0)
  lastRetry         DateTime?
  
  // Metadata
  description       String?
  metadata          Json?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Payout {
  id                String   @id @default(cuid())
  
  groupId           String
  group             Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  recipientId       String
  recipient         User     @relation(fields: [recipientId], references: [id], onDelete: Restrict)
  
  amount            Float
  currency          String   @default("XAF")
  status            String   @default("PENDING") // PENDING, APPROVED, PROCESSING, COMPLETED, FAILED
  
  // Schedule
  scheduledDate     DateTime
  processedDate     DateTime?
  
  // Metadata
  description       String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**Actions:**
- [ ] Add Payment model
- [ ] Add Payout model
- [ ] Update Group to include payments relation
- [ ] Update User to include payments relation
- [ ] Run: `npx prisma migrate dev --name add_payments`
- [ ] Run: `npx prisma generate`

---

### **Task 3: Backend API Endpoints (Day 3-5)**
🎯 **Goal:** 4 core payment endpoints working

#### **3.1 POST /api/payments/initialize**
Initialize payment transaction

**Files:** Create `app/api/payments/initialize/route.ts`

**Request:**
```json
{
  "amount": 5000,
  "currency": "XAF",
  "groupId": "group-id",
  "contributionId": "contribution-id",
  "paymentMethod": "mobile_money",
  "phoneNumber": "+237123456789"
}
```

**Response (Success - 201):**
```json
{
  "message": "Payment initialized",
  "paymentId": "pay_xxx",
  "transactionRef": "tref_xxx",
  "redirectUrl": "https://checkout.flutterwave.com/v3/hosted/..."
}
```

**Logic:**
1. Authenticate user
2. Validate amount & group membership
3. Create Payment record (status: PENDING)
4. Call Flutterwave API to get payment link
5. Return payment link to frontend

**Error Handling:**
- 400: Invalid amount or currency
- 401: Unauthorized
- 403: Not a member of group
- 500: Flutterwave API error

---

#### **3.2 POST /api/payments/webhook**
Receive webhook from Flutterwave

**Files:** Create `app/api/payments/webhook/route.ts`

**Webhook Payload (from Flutterwave):**
```json
{
  "event": "charge.completed",
  "data": {
    "id": "flw_ref_xxx",
    "tx_ref": "tref_xxx",
    "amount": 5000,
    "currency": "XAF",
    "status": "successful",
    "customer": {
      "email": "user@example.com",
      "phone_number": "+237123456789"
    }
  }
}
```

**Logic:**
1. Verify webhook signature (use WEBHOOK_SECRET)
2. Find Payment by `transactionRef`
3. Update Payment status to COMPLETED
4. Update related Contribution status to PAID
5. Create Payout record if applicable
6. Log success/failure

**Security:**
- Verify webhook authenticity using signature
- Validate amount matches original request
- Idempotent (same webhook can arrive multiple times)

---

#### **3.3 POST /api/payments/verify**
Manual verification (fallback if webhook fails)

**Files:** Create `app/api/payments/verify/route.ts`

**Request:**
```json
{
  "transactionRef": "tref_xxx"
}
```

**Response:**
```json
{
  "message": "Payment verified",
  "status": "successful",
  "payment": { /* full payment object */ }
}
```

**Logic:**
1. Query Flutterwave to get transaction status
2. Compare with stored Payment record
3. Update Payment if status differs
4. Return current status

---

#### **3.4 GET /api/payments/history**
List user's payment history

**Files:** Create `app/api/payments/history/route.ts`

**Query Parameters:**
- `groupId` (optional) - Filter by group
- `status` (optional) - PENDING, COMPLETED, FAILED
- `page` (default: 1)
- `limit` (default: 10)

**Response:**
```json
{
  "payments": [
    {
      "id": "pay_xxx",
      "amount": 5000,
      "status": "COMPLETED",
      "paymentMethod": "mobile_money",
      "group": { "name": "Savings Group" },
      "createdAt": "2026-04-06T10:30:00Z",
      "completedAt": "2026-04-06T10:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

**Logic:**
1. Authenticate user
2. Query Payments where userId matches
3. Apply filters
4. Return paginated results

---

### **Task 4: Environment Configuration (Day 1)**
🎯 **Goal:** All credentials set up & secure

#### **4.1 Update .env.local**
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Flutterwave
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY="pk_test_xxxxx"
FLUTTERWAVE_SECRET_KEY="sk_test_xxxxx"

# Webhook Security
WEBHOOK_SECRET="webhook_secret_xxxxx"

# Payment Config
PAYMENT_CURRENCY="XAF"
PAYMENT_TIMEOUT_MINUTES=15
MAX_RETRY_ATTEMPTS=3
```

#### **4.2 Install Flutterwave SDK**
```bash
npm install flutterwave-node-v3
```

#### **4.3 Create Payment Service**
New file: `lib/payments/flutterwave.ts`

```typescript
import axios from 'axios'

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3'

export class FlutterwaveService {
  private apiKey = process.env.FLUTTERWAVE_SECRET_KEY

  async initializePayment(data: {
    amount: number
    email: string
    phone: string
    tx_ref: string
    currency?: string
  }) {
    // API call to Flutterwave
  }

  async verifyTransaction(transactionId: string) {
    // Verify transaction status
  }

  async verifyWebhookSignature(signature: string, payload: any) {
    // Verify webhook is from Flutterwave
  }
}
```

---

### **Task 5: Frontend Payment Components (Day 5-7)**
🎯 **Goal:** User can initiate payment

#### **5.1 Payment Form Component**
New file: `components/payments/payment-form.tsx`

**Features:**
- Payment amount input (validated)
- Payment method selector
- Phone number input (for mobile money)
- Submit button
- Loading state
- Error handling
- Success confirmation

```typescript
interface PaymentFormProps {
  contributionId: string
  groupId: string
  amount: number
  onSuccess?: () => void
}

export function PaymentForm({ 
  contributionId, 
  groupId, 
  amount, 
  onSuccess 
}: PaymentFormProps) {
  // Form implementation
}
```

#### **5.2 Flutterwave Redirect Handler**
New file: `components/payments/payment-redirect.tsx`

**Features:**
- Redirect to Flutterwave checkout
- Handle success/failure/cancellation
- Wait for webhook confirmation
- Show payment status

#### **5.3 Payment Status Component**
New file: `components/payments/payment-status.tsx`

**Shows:**
- Payment status (Processing, Complete, Failed)
- Loading spinner during processing
- Success icon when complete
- Error message if failed
- Retry button if failed

#### **5.4 Integration Points**
Update existing components:
- [ ] Dashboard: Add "Pay Now" button for pending contributions
- [ ] Transactions page: Add payment button per contribution
- [ ] Quick actions: "Make Payment" CTA

---

## 📋 **Detailed File Structure**

### **New Files to Create**
```
app/
  api/
    payments/
      initialize/
        route.ts           (150 lines)
      verify/
        route.ts           (100 lines)
      history/
        route.ts           (120 lines)
      webhook/
        route.ts           (150 lines)
lib/
  payments/
    flutterwave.ts         (200 lines)
    payment-utils.ts       (80 lines)
components/
  payments/
    payment-form.tsx       (180 lines)
    payment-redirect.tsx   (120 lines)
    payment-status.tsx     (100 lines)
    payment-history.tsx    (150 lines)
```

### **Files to Update**
```
prisma/
  schema.prisma            (Add Payment, Payout models)
app/
  dashboard/
    page.jsx               (Add "Pay Now" buttons)
  transactions/
    page.jsx               (Add payment options)
components/
  dashboard/
    quick-actions.jsx      (Add payment CTA)
    recent-transactions.jsx (Add payment status)
.env.local                 (Add payment credentials)
package.json               (Add flutterwave-node-v3)
```

---

## 🧪 **Testing Checklist**

### **Unit Tests (Payment Service)**
- [ ] Payment initialization with valid data
- [ ] Payment initialization with invalid data
- [ ] Webhook signature verification
- [ ] Transaction verification

### **Integration Tests (APIs)**
- [ ] `POST /api/payments/initialize` returns redirect URL
- [ ] `POST /api/payments/webhook` updates Payment status
- [ ] `POST /api/payments/verify` returns correct status
- [ ] `GET /api/payments/history` shows all user payments

### **Frontend Tests**
- [ ] Payment form validates input
- [ ] Payment form submits correctly
- [ ] Success message displays after payment
- [ ] Error message displays on failure
- [ ] Retry works after payment failure

### **Security Tests**
- [ ] Unauthorized users can't access payment endpoints
- [ ] Webhook signature validation works
- [ ] Amount can't be changed after initialization
- [ ] Only group members can pay

---

## 📊 **Deliverables Summary**

### **Backend Deliverables**
- ✅ 4 payment API endpoints (initialize, verify, webhook, history)
- ✅ Payment & Payout database models
- ✅ Flutterwave service integration
- ✅ Webhook handling & security
- ✅ Transaction tracking & retry logic

### **Frontend Deliverables**
- ✅ Payment initialization form
- ✅ Flutterwave redirect handler
- ✅ Payment status component
- ✅ Payment history view
- ✅ Integration with existing pages

### **Infrastructure Deliverables**
- ✅ Environment variables configured
- ✅ Flutterwave SDK installed
- ✅ Database migrations ready
- ✅ Webhook endpoint secured

---

## ⚠️ **Blockers & Dependencies**

### **Critical Blockers**
- ❌ **Flutterwave API Keys** - Need to obtain from Flutterwave account
- ❌ **Production Domain** - Webhook URL needs to be public (localhost won't work)
- ❌ **SSL Certificate** - Production requires HTTPS for webhooks

### **Workarounds for Development**
- Use Flutterwave test keys (already available)
- Use ngrok/tunnel for webhook testing locally
- Use Flutterwave webhook simulator in dashboard

---

## 🚀 **Next Actions**

### **Immediate (Before starting)**
1. [ ] Obtain Flutterwave test API keys
2. [ ] Create Flutterwave test account
3. [ ] Test webhook URL with ngrok
4. [ ] Review Flutterwave API docs

### **Day 1 (Setup)**
1. [ ] Add environment variables
2. [ ] Create Payment service class
3. [ ] Update Prisma schema
4. [ ] Run database migration

### **Day 2-3 (API Development)**
1. [ ] Implement payment initialize endpoint
2. [ ] Implement payment verify endpoint
3. [ ] Implement webhook handler
4. [ ] Test endpoints with Flutterwave

### **Day 4-5 (Frontend)**
1. [ ] Build payment form component
2. [ ] Build redirect handler
3. [ ] Build status component
4. [ ] Integrate with dashboard

### **Day 6-7 (Testing & Polish)**
1. [ ] Run full payment flow test
2. [ ] Debug any issues
3. [ ] Optimize error handling
4. [ ] Document for Week 4

---

## 📚 **Resources & Documentation**

### **Flutterwave Docs**
- [Flutterwave Documentation](https://developer.flutterwave.com/docs)
- [Initialize Payment](https://developer.flutterwave.com/docs/payments/inline-payment)
- [Webhook Reference](https://developer.flutterwave.com/docs/webhooks)

### **Next.js Payment Guide**
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

### **Security**
- [Webhook Signature Verification](https://developer.flutterwave.com/docs/webhooks#signature-verification)
- [HMAC Verification](https://en.wikipedia.org/wiki/HMAC)

---

## 🎯 **Success Criteria**

✅ All Week 3 objectives met when:
1. Users can click "Pay Now" on pending contributions
2. Payment form appears with amount pre-filled
3. User redirected to Flutterwave checkout
4. After payment, status updates to COMPLETED
5. Dashboard shows payment confirmation
6. Payment history accessible from user profile
7. All tests pass (unit, integration, security)
8. No console errors in browser
9. 100% of code is TypeScript typed
10. All error cases handled gracefully

---

**Status: Ready for Week 3 Development** ✅

Next: Confirm prerequisites and start Task 1 (Setup)
