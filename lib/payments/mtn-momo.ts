import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

/**
 * MTN MoMo Payment Service
 * Handles payment requests and status checks for MTN Mobile Money
 * Cameroon Integration
 */
export class MTNMoMoService {
  private subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY
  private apiUser = process.env.MTN_API_USER
  private apiKey = process.env.MTN_API_KEY
  private baseUrl = process.env.MTN_SANDBOX_URL || 'https://sandbox.momodeveloper.mtn.com'
  private environment = process.env.MTN_ENVIRONMENT || 'sandbox'

  /**
   * Request payment from user
   * User receives USSD/SMS prompt to confirm payment
   */
  async requestToPay(data: {
    amount: number
    phoneNumber: string
    externalId: string
    description: string
  }) {
    const referenceId = uuidv4()

    try {
      // Validate inputs
      if (!data.amount || data.amount <= 0) {
        throw new Error('Amount must be greater than 0')
      }
      if (!data.phoneNumber) {
        throw new Error('Phone number is required')
      }

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
        data: response.data,
      }
    } catch (error: any) {
      console.error('MTN MoMo requestToPay error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      })
      throw new Error(`MTN MoMo error: ${error.response?.data?.message || error.message}`)
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
        referenceId,
        status: response.data.status, // SUCCEEDED, PENDING, FAILED
        amount: response.data.amount,
        externalId: response.data.externalId,
        payerMessage: response.data.payerMessage,
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
      if (!data.amount || data.amount <= 0) {
        throw new Error('Amount must be greater than 0')
      }
      if (!data.phoneNumber) {
        throw new Error('Phone number is required')
      }

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
        message: 'Transfer request sent',
        data: response.data,
      }
    } catch (error: any) {
      console.error('MTN MoMo transfer error:', error.response?.data)
      throw new Error(`Transfer failed: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Check API connection and credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      if (!this.subscriptionKey || !this.apiUser || !this.apiKey) {
        throw new Error('Missing required MTN MoMo credentials')
      }
      // Simple health check - if we can reach the API, credentials are likely valid
      await axios.head(`${this.baseUrl}/v1_0/account/balance`, {
        headers: {
          'X-Target-Environment': this.environment,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
        timeout: 5000,
      })
      return true
    } catch (error) {
      console.error('MTN MoMo credentials validation failed:', error)
      return false
    }
  }
}
