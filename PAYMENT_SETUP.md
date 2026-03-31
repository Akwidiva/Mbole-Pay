# 💳 Mbole Pay - Payment Integration Setup

**Status:** Waiting for MTN MoMo & Orange Money API credentials  
**Last Updated:** March 31, 2026

---

## 📋 QUICK START

### 1. Environment Variables ✅ DONE
- [x] `.env.local` created with payment provider placeholders
- [x] `.env.example` created for documentation
- [x] Environment structure ready

### 2. Credentials Waiting
- [ ] MTN MoMo credentials (API Key, Service ID, Secret Key)
- [ ] Orange Money credentials (Merchant ID, Key, Secret)
- Update `.env.local` once received

### 3. Implementation Ready (Next Steps)
- [ ] Payment API endpoints
- [ ] Webhook handlers
- [ ] Payment verification logic

---

## 🔄 PAYMENT FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INITIATES PAYMENT                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
    ┌───▼────────┐                    ┌──────▼────────┐
    │ MTN MoMo   │                    │ Orange Money  │
    └───┬────────┘                    └──────┬────────┘
        │                                     │
        │ API Request                         │ API Request
        ▼                                     ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│ MTN Server Processes     │    │ Orange Server Processes  │
│ - Validates credentials  │    │ - Validates credentials  │
│ - Sends USSD/SMS to user │    │ - Sends USSD/SMS to user │
└──────────────────────────┘    └──────────────────────────┘
        │ User enters PIN              │ User enters PIN
        │ Payment confirmed            │ Payment confirmed
        ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│         WEBHOOK CALLBACK TO YOUR BACKEND                    │
│   POST /api/payments/momo/callback or /orange/callback      │
└──────────────────────────┬──────────────────────────────────┘
                           │
               ┌───────────▼───────────┐
               │ Verify Webhook        │
               │ - Check signature     │
               │ - Match transaction   │
               │ - Verify amount       │
               └───────────┬───────────┘
                           │
               ┌───────────▼───────────┐
               │ Update Database       │
               │ - Mark as PAID        │
               │ - Log transaction     │
               │ - Trigger notifications
               └───────────┬───────────┘
                           │
               ┌───────────▼───────────┐
               │ Return Success        │
               │ - User confirmation   │
               │ - Dashboard update    │
               └───────────────────────┘
```

---

## 🛠️ FILE STRUCTURE (After Setup)

```
app/api/payments/
├── momo/
│   ├── initiate/route.ts          # Start MTN payment
│   ├── verify/route.ts            # Verify payment (manual)
│   └── callback/route.ts          # Webhook handler
├── orange/
│   ├── initiate/route.ts          # Start Orange payment
│   ├── verify/route.ts            # Verify payment (manual)
│   └── callback/route.ts          # Webhook handler
└── transactions/
    └── route.ts                   # List payment history

lib/
├── payment-utils.ts               # Helper functions
├── momo-client.ts                 # MTN MoMo API client
└── orange-client.ts               # Orange Money API client

types/
└── payment.ts                      # Payment-related types
```

---

## 📝 WHAT TO DO WHEN CREDENTIALS ARRIVE

### STEP 1: Update `.env.local`

When you receive credentials from MTN and Orange:

```bash
# .env.local

# Replace these with actual credentials:
MTN_MOMO_SERVICE_ID="your_actual_service_id"
MTN_MOMO_API_KEY="your_actual_api_key"
MTN_MOMO_SECRET_KEY="your_actual_secret_key"

ORANGE_MONEY_MERCHANT_ID="your_actual_merchant_id"
ORANGE_MONEY_MERCHANT_KEY="your_actual_merchant_key"
ORANGE_MONEY_MERCHANT_SECRET="your_actual_merchant_secret"
```

### STEP 2: Test Sandbox Environment

```bash
# Use test phones and PINs provided:
MTN_MOMO_TEST_PHONE="+237699999999"
MTN_MOMO_TEST_PIN="1234"

ORANGE_MONEY_TEST_PHONE="+237655555555"
ORANGE_MONEY_TEST_PIN="1234"
```

### STEP 3: Test Payment Flow Locally

```bash
# Start development server
npm run dev

# Test MTN MoMo payment:
# POST /api/payments/momo/initiate
# {
#   "phoneNumber": "+237699999999",
#   "amount": 5000,
#   "contributionId": "contrib-123"
# }

# Test Orange Money payment:
# POST /api/payments/orange/initiate
# {
#   "phoneNumber": "+237655555555",
#   "amount": 5000,
#   "contributionId": "contrib-123"
# }
```

---

## 🔐 SECURITY CHECKLIST

- [ ] Never commit `.env.local` to git
- [ ] Add `.env.local` to `.gitignore`
- [ ] Verify webhook signatures before processing
- [ ] Use HTTPS in production
- [ ] Rotate API keys quarterly
- [ ] Log all payment transactions (auditable)
- [ ] Implement rate limiting on payment endpoints
- [ ] Validate all user inputs
- [ ] Test error scenarios (network failure, timeout, etc.)

---

## 📞 CONTACT INFO FOR CREDENTIALS

**MTN MoMo:**
- Email: business.cm@mtn.com
- Status: ⏳ Awaiting response
- Approval Time: 2-3 business days

**Orange Money:**
- Email: moneyapi@orange.cm
- Status: ⏳ Awaiting response
- Approval Time: 2-3 business days

---

## 🎯 NEXT MILESTONE

Once credentials are received:
1. Create payment API endpoints
2. Implement webhook handlers
3. Build payment UI components
4. Create transaction history
5. Test end-to-end flow

**Estimated Implementation Time:** 3-4 days after credential approval

---

## 📚 REFERENCE DOCS

- [MTN MoMo API Documentation](#) - Will be provided by MTN
- [Orange Money API Documentation](#) - Will be provided by Orange
- [Payment Types & Interfaces](./types/payment.ts)
- [Payment Utilities](./lib/payment-utils.ts)

---

## 🐛 TROUBLESHOOTING

**Credentials Delayed?**
- Follow up with MTN: business.cm@mtn.com
- Follow up with Orange: moneyapi@orange.cm
- Request escalation after 5 business days

**Testing Issues?**
- Verify test phone numbers in `.env.local`
- Check webhook URL is accessible
- Enable debug logging: `DEBUG=mbole-pay:*`

**Production Deployment?**
- Get production credentials (different from sandbox)
- Update base URLs to production endpoints
- Enable request signing/verification
- Test thoroughly before going live

