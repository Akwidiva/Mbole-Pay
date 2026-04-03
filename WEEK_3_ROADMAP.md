# 🎯 WEEK 3 TASK ROADMAP (Updated)

**Timeline:** April 6-12, 2026  
**Payment Providers:** MTN MoMo + Orange Money (Direct Integration)

---

## ✅ **TASK 1: Mobile Money Setup** (COMPLETE)

### What was built:
- ✅ MTN MoMo Service (lib/payments/mtn-momo.ts)
- ✅ Orange Money Service (lib/payments/orange-money.ts)
- ✅ Payment Factory (lib/payments/payment-factory.ts)
- ✅ Validation Script (lib/payments/validate-providers.ts)
- ✅ Environment Template (.env.local.template)

### Current Status:
**Code Ready** ✅ | **Waiting for Credentials** ⏳

### What's Next:
1. Get MTN MoMo credentials from https://momodeveloper.mtn.com/
2. Get Orange Money credentials from business@orange.cm
3. Update .env.local
4. Run validation script

---

## 📋 **TASK 2: Database Schema Updates** (Ready to Start)

**Estimated:** Days 2-3  
**Files to Create:** 1 (migrations)  
**Complexity:** Medium

### What needs to be done:

#### 2.1 Update prisma/schema.prisma
Add these models:

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
  currency          String   @default("XAF")
  status            String   @default("PENDING")  // PENDING, PROCESSING, COMPLETED, FAILED
  
  provider          String                        // MTN_MOMO or ORANGE_MONEY
  providerRef       String?   @unique             // Reference from payment provider
  
  phoneNumber       String                        // Phone number used for payment
  
  retryCount        Int       @default(0)
  lastRetry         DateTime?
  
  errorMessage      String?                       // Error details if failed
  
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
  status            String   @default("PENDING")  // PENDING, SCHEDULED, PROCESSING, COMPLETED, FAILED
  
  provider          String                        // MTN_MOMO or ORANGE_MONEY
  providerRef       String?   @unique
  
  phoneNumber       String
  
  scheduledDate     DateTime
  processedDate     DateTime?
  
  retryCount        Int       @default(0)
  lastRetry         DateTime?
  
  errorMessage      String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

Update existing models with relationships:
```prisma
model User {
  // ... existing fields ...
  payments          Payment[]
  payouts           Payout[]
}

model Group {
  // ... existing fields ...
  payments          Payment[]
  payouts           Payout[]
}

model Contribution {
  // ... existing fields ...
  payment           Payment?
}
```

#### 2.2 Run Migration
```bash
npx prisma migrate dev --name add_mobile_money_payments
npx prisma generate
```

#### 2.3 Update Type Definitions
Create `types/payments.ts`:
```typescript
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type PayoutStatus = 'PENDING' | 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type PaymentProvider = 'MTN_MOMO' | 'ORANGE_MONEY'

export interface Payment {
  id: string
  userId: string
  groupId: string
  contributionId?: string
  amount: number
  currency: string
  status: PaymentStatus
  provider: PaymentProvider
  providerRef?: string
  phoneNumber: string
  retryCount: number
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export interface Payout {
  id: string
  groupId: string
  recipientId: string
  amount: number
  currency: string
  status: PayoutStatus
  provider: PaymentProvider
  providerRef?: string
  phoneNumber: string
  scheduledDate: Date
  processedDate?: Date
  createdAt: Date
  updatedAt: Date
}
```

---

## 🔌 **TASK 3: Payment API Endpoints** (Ready to Start)

**Estimated:** Days 3-5  
**Files to Create:** 4-5  
**Complexity:** High

### What needs to be built:

#### 3.1 POST /api/payments/initialize
**File:** `app/api/payments/initialize/route.ts`
**Purpose:** Start payment process

Request:
```json
{
  "amount": 5000,
  "phoneNumber": "+237691234567",
  "groupId": "group-id",
  "provider": "MTN_MOMO"
}
```

Response:
```json
{
  "id": "payment-id",
  "status": "INITIATED",
  "provider": "MTN_MOMO",
  "message": "Please confirm payment on your phone"
}
```

Logic:
1. Validate user is member of group
2. Create Payment record (status: PENDING)
3. Call provider API (requestToPay)
4. Store provider reference
5. Return payment ID and status

---

#### 3.2 POST /api/payments/webhook
**File:** `app/api/payments/webhook/route.ts`
**Purpose:** Receive payment confirmations

Handlers:
- `POST /api/payments/mtn-momo/callback` - MTN webhook
- `POST /api/payments/orange/callback` - Orange webhook

Logic:
1. Verify webhook signature
2. Find Payment by provider reference
3. Update Payment status
4. Update related Contribution status to PAID
5. Create Payout record if applicable
6. Send confirmation notification

---

#### 3.3 GET /api/payments/history
**File:** `app/api/payments/history/route.ts`
**Purpose:** View payment history

Query Parameters:
- `groupId` - optional
- `status` - optional (PENDING, COMPLETED, FAILED)
- `page` - default 1
- `limit` - default 10

Response:
```json
{
  "payments": [
    {
      "id": "pay-123",
      "amount": 5000,
      "status": "COMPLETED",
      "provider": "MTN_MOMO",
      "group": { "name": "Savings Group" },
      "createdAt": "2026-04-06T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

---

#### 3.4 GET /api/payments/status/:id
**File:** `app/api/payments/[id]/route.ts`
**Purpose:** Check single payment status

Response:
```json
{
  "id": "pay-123",
  "status": "COMPLETED",
  "amount": 5000,
  "provider": "MTN_MOMO",
  "completedAt": "2026-04-06T10:35:00Z"
}
```

---

#### 3.5 POST /api/payments/verify
**File:** `app/api/payments/verify/route.ts`
**Purpose:** Manual verification (fallback)

Request:
```json
{
  "paymentId": "pay-123"
}
```

Logic:
1. Query payment provider for status
2. Compare with stored record
3. Update if status changed
4. Return current status

---

## 🎨 **TASK 4: Frontend Payment Components** (Ready to Start)

**Estimated:** Days 5-7  
**Files to Create:** 5-6  
**Complexity:** Medium

### Components to build:

#### 4.1 Payment Method Selector
**File:** `components/payments/payment-provider-selector.tsx`
- Radio buttons for MTN/Orange
- Provider logos and names
- Description of each

#### 4.2 Payment Form
**File:** `components/payments/payment-form.tsx`
- Amount input (auto-filled)
- Phone number input with validation
- Provider selector
- Submit button
- Loading state

#### 4.3 Payment Status
**File:** `components/payments/payment-status.tsx`
- Processing spinner
- Success/failure icons
- Status message
- Retry button if failed
- Close button when complete

#### 4.4 Payment History
**File:** `components/payments/payment-history.tsx`
- List of past payments
- Status badges (✓ Completed, ⏳ Pending, ✗ Failed)
- Timestamps and amounts
- Pagination

#### 4.5 Integration Points
Update existing components:
- Dashboard: Add "Pay Now" buttons
- Transactions: Add payment options per contribution
- Quick Actions: Add payment CTA

---

## 📅 **Recommended Schedule**

| Day | Task | Deliverable |
|-----|------|------------|
| **Day 1-2** | Task 1 (Setup) | Services ready, credentials needed |
| **Day 2-3** | Task 2 (Schema) | Database updated, migrations run |
| **Day 3-4** | Task 3 (APIs) | 5 API endpoints working |
| **Day 5-6** | Task 4 (UI) | 6 frontend components |
| **Day 6-7** | Testing | End-to-end payment flow tested |

---

## 🎯 **Success Criteria**

✅ Week 3 complete when:
1. User can click "Pay Now" on contribution
2. Selects payment method (MTN or Orange)
3. Enters phone number
4. Receives payment confirmation on phone
5. Payment status updates in system
6. Contribution marked as PAID
7. Payment history shows transaction

---

## 📊 **Estimated Lines of Code**

- Task 1: ✅ 350 lines (COMPLETE)
- Task 2: ~100 lines (Database)
- Task 3: ~800 lines (APIs)
- Task 4: ~600 lines (Frontend)
- **Total: ~1,850 lines**

---

**Current Status: Task 1 Backend COMPLETE ✅**  
**Next: Get credentials → Task 2** ⏭️
