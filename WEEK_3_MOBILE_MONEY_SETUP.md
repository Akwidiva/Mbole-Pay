# 📱 WEEK 3: MOBILE MONEY INTEGRATION (MTN MoMo + Orange Money)
**Timeline:** April 6-12, 2026  
**Goal:** Direct mobile money payments - NO third-party gateways  
**Status:** Starting Task 1 - Setup

---

## 🎯 **Week 3 Simplified Overview**

### **Architecture Decision: Direct Integration**
- ❌ **Removed:** Flutterwave (unnecessary middleman)
- ✅ **Active:** MTN MoMo API (Cameroon)
- ✅ **Active:** Orange Money API (Cameroon)
- ✅ **Benefit:** Lower fees, direct control, faster integration

### **Payment Flow**
```
User → Select Payment Method → MTN or Orange → API Call → Confirmation → Payment Recorded
```

---

## 📋 **TASK 1: Setup Mobile Money Providers (Days 1-2)**

### **1.1 MTN MoMo Setup**

#### **Prerequisites**
1. MTN Business Portal Account
   - Go to: https://developer.mtn.com/
   - Create business account
   - Get API credentials

2. API Credentials from MTN
   - Environment: **Sandbox (Test)** or **Production**
   - **Subscription Key:** (Primary/Secondary)
   - **API User ID:** (provided by MTN)
   - **API Key:** (provisioned on dashboard)

#### **Action Items**
- [ ] Register on MTN Developer Portal
- [ ] Get sandbox credentials
- [ ] Document credentials (keep secure)
- [ ] Test API availability

**MTN API Endpoints:**
```
Sandbox: https://sandbox.momodeveloper.mtn.com
Production: https://api.mtn.com

Key endpoints:
- POST /v1_0/requesttopay → Initiate payment
- GET /v1_0/requesttopay/{referenceId} → Check status
- POST /v1_0/transfer → Send money to user
```

**MTN Reference:**
- [MTN MoMo API Documentation](https://momodeveloper.mtn.com/docs)

---

### **1.2 Orange Money Setup**

#### **Prerequisites**
1. Orange Business Account (Cameroon)
   - Contact: Orange Cameroon Business Support
   - Create API partnership agreement
   - Provide company details

2. API Credentials from Orange
   - **Client ID:** (provided)
   - **Client Secret:** (provided)
   - **Merchant Code:** (provided)
   - **Bearer Token:** (generated via auth endpoint)

#### **Action Items**
- [ ] Contact Orange Cameroon Business Team
- [ ] Sign API partnership agreement
- [ ] Receive sandbox credentials
- [ ] Test connectivity

**Orange Money API Endpoints:**
```
Sandbox: https://api-sandbox.orange.com
Production: https://api.orange.com (varies by region)

Key endpoints:
- POST /orange-money-webpay/async/pay → Initiate payment
- GET /orange-money-webpay/query/{refId} → Check status
- POST /orange-money-webpay/async/transfer → Send money
```

**Orange Reference:**
- Contact: business@orange.cm (varies, check locally)

---

### **1.3 Environment Setup**

#### **Update .env.local**
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# MTN MoMo
MTN_ENVIRONMENT="sandbox"                    # sandbox or production
MTN_SUBSCRIPTION_KEY="your-subscription-key"
MTN_API_USER="your-api-user"
MTN_API_KEY="your-api-key"
MTN_SANDBOX_URL="https://sandbox.momodeveloper.mtn.com"

# Orange Money
ORANGE_ENVIRONMENT="sandbox"                 # sandbox or production
ORANGE_CLIENT_ID="your-client-id"
ORANGE_CLIENT_SECRET="your-client-secret"
ORANGE_MERCHANT_CODE="your-merchant-code"
ORANGE_SANDBOX_URL="https://api-sandbox.orange.com"

# Payment Config
DEFAULT_CURRENCY="XAF"                       # Cameroon Franc
PAYMENT_TIMEOUT_MINUTES=15
MAX_RETRY_ATTEMPTS=3

# Webhook Security (for receiving callbacks)
WEBHOOK_SECRET="your-webhook-secret"
```

---

### **1.4 Install Dependencies**

```bash
npm install axios uuid dotenv
```

**Packages:**
- `axios` - HTTP client for API calls (already likely installed)
- `uuid` - Generate unique transaction references
- `dotenv` - Environment variable management

---

### **1.5 Create Payment Service Files**

#### **File 1: lib/payments/mtn-momo.ts**
```typescript
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export class MTNMoMoService {
  private subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY
  private apiUser = process.env.MTN_API_USER
  private apiKey = process.env.MTN_API_KEY
  private baseUrl = process.env.MTN_SANDBOX_URL
  private environment = process.env.MTN_ENVIRONMENT

  /**
   * Initiate payment request from user
   * User will receive USSD prompt or SMS with payment confirmation
   */
  async requestToPay(data: {
    amount: number
    phoneNumber: string                // E.g. +237691234567
    externalId: string                 // Your transaction ID
    description: string
  }) {
    const referenceId = uuidv4()
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1_0/requesttopay`,
        {
          amount: data.amount.toString(),
          currency: 'XAF',
          externalId: data.externalId,
          payer: {
            partyIdType: 'MSISDN',
            partyId: data.phoneNumber,
          },
          payerMessage: data.description,
          payeeNote: data.description,
        },
        {
          headers: {
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.environment,
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Authorization': `Bearer ${this.apiUser}:${this.apiKey}`,
          },
        }
      )

      return {
        referenceId,
        status: 'INITIATED',
        message: 'Payment request sent to user',
      }
    } catch (error: any) {
      console.error('MTN MoMo requestToPay error:', error.response?.data)
      throw new Error(`MTN MoMo error: ${error.message}`)
    }
  }

  /**
   * Check payment status
   */
  async getTransactionStatus(referenceId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Authorization': `Bearer ${this.apiUser}:${this.apiKey}`,
          },
        }
      )

      return {
        status: response.data.status, // SUCCEEDED, PENDING, FAILED
        amount: response.data.amount,
        externalId: response.data.externalId,
      }
    } catch (error: any) {
      console.error('MTN MoMo status check error:', error.response?.data)
      throw new Error(`Failed to check transaction status: ${error.message}`)
    }
  }

  /**
   * Send money to user (for payouts)
   */
  async transfer(data: {
    amount: number
    phoneNumber: string
    externalId: string
    description: string
  }) {
    const referenceId = uuidv4()

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1_0/transfer`,
        {
          amount: data.amount.toString(),
          currency: 'XAF',
          externalId: data.externalId,
          payee: {
            partyIdType: 'MSISDN',
            partyId: data.phoneNumber,
          },
          payerMessage: data.description,
          payeeNote: data.description,
        },
        {
          headers: {
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.environment,
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Authorization': `Bearer ${this.apiUser}:${this.apiKey}`,
          },
        }
      )

      return {
        referenceId,
        status: 'TRANSFER_INITIATED',
      }
    } catch (error: any) {
      console.error('MTN MoMo transfer error:', error.response?.data)
      throw new Error(`Transfer failed: ${error.message}`)
    }
  }
}
```

#### **File 2: lib/payments/orange-money.ts**
```typescript
import axios from 'axios'
import crypto from 'crypto'

export class OrangeMoneyService {
  private clientId = process.env.ORANGE_CLIENT_ID
  private clientSecret = process.env.ORANGE_CLIENT_SECRET
  private merchantCode = process.env.ORANGE_MERCHANT_CODE
  private baseUrl = process.env.ORANGE_SANDBOX_URL
  private environment = process.env.ORANGE_ENVIRONMENT
  private bearerToken?: string

  /**
   * Authenticate with Orange Money API
   * Must be called before making payment requests
   */
  async authenticate() {
    try {
      const credentials = Buffer.from(
        `${this.clientId}:${this.clientSecret}`
      ).toString('base64')

      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      this.bearerToken = response.data.access_token
      return this.bearerToken
    } catch (error: any) {
      console.error('Orange Money auth error:', error.response?.data)
      throw new Error(`Authentication failed: ${error.message}`)
    }
  }

  /**
   * Initiate payment request
   */
  async requestToPay(data: {
    amount: number
    phoneNumber: string
    externalId: string
    description: string
  }) {
    // Authenticate if not already authenticated
    if (!this.bearerToken) {
      await this.authenticate()
    }

    const transactionId = `${this.merchantCode}${Date.now()}`

    try {
      const response = await axios.post(
        `${this.baseUrl}/orange-money-webpay/async/pay`,
        {
          merchant_key: this.merchantCode,
          customer_number: data.phoneNumber, // E.g. 237691234567 (without +)
          amount: data.amount,
          currency: 'XAF',
          order_id: transactionId,
          description: data.description,
          return_url: `${process.env.NEXTAUTH_URL}/api/payments/orange/callback`,
          webhook_url: `${process.env.NEXTAUTH_URL}/api/payments/orange/webhook`,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return {
        transactionId,
        status: 'INITIATED',
        message: 'Payment request sent',
        redirectUrl: response.data.redirect_url, // User should be redirected here
      }
    } catch (error: any) {
      console.error('Orange Money payment error:', error.response?.data)
      throw new Error(`Payment initiation failed: ${error.message}`)
    }
  }

  /**
   * Check payment status
   */
  async getTransactionStatus(orderId: string) {
    if (!this.bearerToken) {
      await this.authenticate()
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/orange-money-webpay/query/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          },
        }
      )

      return {
        status: response.data.status, // SUCCESS, PENDING, FAILED
        amount: response.data.amount,
        orderId: response.data.order_id,
      }
    } catch (error: any) {
      console.error('Orange Money status check error:', error.response?.data)
      throw new Error(`Status check failed: ${error.message}`)
    }
  }

  /**
   * Send money to user (for payouts)
   */
  async transfer(data: {
    amount: number
    phoneNumber: string
    externalId: string
    description: string
  }) {
    if (!this.bearerToken) {
      await this.authenticate()
    }

    const transactionId = `PAYOUT_${this.merchantCode}${Date.now()}`

    try {
      const response = await axios.post(
        `${this.baseUrl}/orange-money-webpay/async/transfer`,
        {
          merchant_key: this.merchantCode,
          beneficiary_number: data.phoneNumber,
          amount: data.amount,
          currency: 'XAF',
          transaction_id: transactionId,
          description: data.description,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return {
        transactionId,
        status: 'TRANSFER_INITIATED',
      }
    } catch (error: any) {
      console.error('Orange Money transfer error:', error.response?.data)
      throw new Error(`Transfer failed: ${error.message}`)
    }
  }
}
```

#### **File 3: lib/payments/payment-factory.ts**
```typescript
import { MTNMoMoService } from './mtn-momo'
import { OrangeMoneyService } from './orange-money'

export type PaymentProvider = 'MTN_MOMO' | 'ORANGE_MONEY'

export class PaymentFactory {
  static getProvider(provider: PaymentProvider) {
    switch (provider) {
      case 'MTN_MOMO':
        return new MTNMoMoService()
      case 'ORANGE_MONEY':
        return new OrangeMoneyService()
      default:
        throw new Error(`Unknown payment provider: ${provider}`)
    }
  }

  static getSupportedProviders() {
    return ['MTN_MOMO', 'ORANGE_MONEY']
  }
}
```

---

## ✅ **Task 1 Checklist**

- [ ] Register MTN Developer Account & get credentials
- [ ] Register Orange Money Business Account & get credentials
- [ ] Document all credentials securely (.env.local)
- [ ] Create `lib/payments/mtn-momo.ts` (70 lines)
- [ ] Create `lib/payments/orange-money.ts` (80 lines)
- [ ] Create `lib/payments/payment-factory.ts` (25 lines)
- [ ] Test MTN MoMo API connectivity (sandbox)
- [ ] Test Orange Money API connectivity (sandbox)
- [ ] Verify credentials work correctly

---

## 📊 **Credentials Location**

### **Where to Get Credentials**

#### **MTN MoMo:**
1. Go to https://momodeveloper.mtn.com/
2. Sign up → Create App
3. Get Subscription Key from dashboard
4. API User & Key in account settings

#### **Orange Money:**
1. Contact: business@orange.cm (Cameroon)
2. Or visit: https://www.orange.cm/
3. Create business partnership
4. Receive Client ID, Secret, Merchant Code

---

## 🎯 **Success Criteria for Task 1**

✅ When complete:
- [ ] MTN MoMo credentials stored in .env.local
- [ ] Orange Money credentials stored in .env.local
- [ ] All 3 service files created (150+ lines)
- [ ] Factory pattern working for provider selection
- [ ] Both services tested and no errors
- [ ] Ready for Task 2 (API endpoints)

---

**Task 1 Status: READY TO BEGIN** ✅

Next: Create the three service files or start getting credentials?
