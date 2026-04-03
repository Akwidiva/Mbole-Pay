import axios from 'axios'

/**
 * Orange Money Payment Service
 * Handles payment requests and status checks for Orange Money
 * Cameroon Integration
 */
export class OrangeMoneyService {
  private clientId = process.env.ORANGE_CLIENT_ID
  private clientSecret = process.env.ORANGE_CLIENT_SECRET
  private merchantCode = process.env.ORANGE_MERCHANT_CODE
  private baseUrl = process.env.ORANGE_SANDBOX_URL || 'https://api-sandbox.orange.com'
  private environment = process.env.ORANGE_ENVIRONMENT || 'sandbox'
  private bearerToken?: string
  private tokenExpiry?: number

  /**
   * Authenticate with Orange Money API
   * Generates Bearer token for subsequent requests
   */
  async authenticate() {
    try {
      if (!this.clientId || !this.clientSecret) {
        throw new Error('Missing Orange Money credentials')
      }

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
          timeout: 5000,
        }
      )

      this.bearerToken = response.data.access_token
      // Token typically expires in 3600 seconds, refresh after 3400 seconds
      this.tokenExpiry = Date.now() + (response.data.expires_in || 3600) * 1000 - 200000

      return this.bearerToken
    } catch (error: any) {
      console.error('Orange Money authentication error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      throw new Error(`Orange Money authentication failed: ${error.message}`)
    }
  }

  /**
   * Ensure valid bearer token
   * Refreshes if expired
   */
  private async ensureValidToken() {
    if (!this.bearerToken || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
      await this.authenticate()
    }
  }

  /**
   * Request payment from user
   * Redirects user to Orange Money payment page
   */
  async requestToPay(data: {
    amount: number
    phoneNumber: string
    externalId: string
    description: string
  }) {
    await this.ensureValidToken()

    const transactionId = `${this.merchantCode}${Date.now()}`

    try {
      if (!data.amount || data.amount <= 0) {
        throw new Error('Amount must be greater than 0')
      }
      if (!data.phoneNumber) {
        throw new Error('Phone number is required')
      }

      // Format phone number: remove + and leading 0 if present
      const formattedPhone = data.phoneNumber
        .replace(/\+/, '')
        .replace(/^0/, '')

      const response = await axios.post(
        `${this.baseUrl}/orange-money-webpay/async/pay`,
        {
          merchant_key: this.merchantCode,
          customer_number: formattedPhone,
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
          timeout: 5000,
        }
      )

      return {
        transactionId,
        status: 'INITIATED',
        message: 'Payment request initiated',
        redirectUrl: response.data.redirect_url || response.data.paymentUrl,
        data: response.data,
      }
    } catch (error: any) {
      console.error('Orange Money payment error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      throw new Error(
        `Orange Money payment failed: ${error.response?.data?.message || error.message}`
      )
    }
  }

  /**
   * Check payment status
   */
  async getTransactionStatus(orderId: string) {
    await this.ensureValidToken()

    try {
      const response = await axios.get(
        `${this.baseUrl}/orange-money-webpay/query/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          },
          timeout: 5000,
        }
      )

      return {
        orderId,
        status: response.data.status, // SUCCESS, PENDING, FAILED
        amount: response.data.amount,
        transactionId: response.data.transaction_id,
        customerNumber: response.data.customer_number,
        data: response.data,
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
    await this.ensureValidToken()

    const transactionId = `PAYOUT_${this.merchantCode}${Date.now()}`

    try {
      if (!data.amount || data.amount <= 0) {
        throw new Error('Amount must be greater than 0')
      }
      if (!data.phoneNumber) {
        throw new Error('Phone number is required')
      }

      // Format phone number
      const formattedPhone = data.phoneNumber
        .replace(/\+/, '')
        .replace(/^0/, '')

      const response = await axios.post(
        `${this.baseUrl}/orange-money-webpay/async/transfer`,
        {
          merchant_key: this.merchantCode,
          beneficiary_number: formattedPhone,
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
          timeout: 5000,
        }
      )

      return {
        transactionId,
        status: 'TRANSFER_INITIATED',
        message: 'Transfer request sent',
        data: response.data,
      }
    } catch (error: any) {
      console.error('Orange Money transfer error:', error.response?.data)
      throw new Error(
        `Transfer failed: ${error.response?.data?.message || error.message}`
      )
    }
  }

  /**
   * Verify webhook signature from Orange Money
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      if (!this.clientSecret) {
        throw new Error('Missing client secret for webhook verification')
      }

      const hmac = require('crypto')
        .createHmac('sha256', this.clientSecret)
        .update(payload)
        .digest('hex')

      return hmac === signature
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return false
    }
  }

  /**
   * Check API connection and credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      if (!this.clientId || !this.clientSecret || !this.merchantCode) {
        throw new Error('Missing required Orange Money credentials')
      }
      // Test authentication
      await this.authenticate()
      return true
    } catch (error) {
      console.error('Orange Money credentials validation failed:', error)
      return false
    }
  }
}
