import { MTNMoMoService } from './mtn-momo'
import { FapshiService } from './fapshi'
import { PaymentProvider } from '@/types/payments'

/**
 * Re-export PaymentProvider from types for convenience
 */
export { PaymentProvider }

/**
 * Payment Factory Pattern
 * Provides centralized provider selection and management
 */
export class PaymentFactory {
  /**
   * Get payment provider instance
   */
  static getProvider(provider: PaymentProvider) {
    switch (provider) {
      case 'MTN_MOMO':
        return new MTNMoMoService()
      case 'FAPSHI':
        return new FapshiService()
      default:
        throw new Error(`Unknown payment provider: ${provider}`)
    }
  }

  /**
   * Get all supported providers
   */
  static getSupportedProviders(): PaymentProvider[] {
    return [PaymentProvider.MTN_MOMO, PaymentProvider.FAPSHI]
  }

  /**
   * Get provider display name
   */
  static getProviderDisplayName(provider: PaymentProvider): string {
    switch (provider) {
      case 'MTN_MOMO':
        return 'MTN Mobile Money'
      case 'FAPSHI':
        return 'Fapshi'
      default:
        return provider
    }
  }

  /**
   * Get provider icon/logo (for frontend)
   */
  static getProviderIcon(provider: PaymentProvider): string {
    switch (provider) {
      case 'MTN_MOMO':
        return '/icons/mtn-momo.svg'
      case 'FAPSHI':
        return '/icons/fapshi.svg'
      default:
        return '/icons/payment.svg'
    }
  }

  /**
   * Validate all provider credentials on startup
   */
  static async validateAllProviders(): Promise<{
    [key: string]: boolean
  }> {
    const results: { [key: string]: boolean } = {}

    for (const provider of this.getSupportedProviders()) {
      try {
        const instance = this.getProvider(provider)
        results[provider] = await instance.validateCredentials()
      } catch (error) {
        console.error(`Failed to validate ${provider}:`, error)
        results[provider] = false
      }
    }

    return results
  }

  /**
   * Get the best payment provider (first available)
   */
  static async getDefaultProvider(): Promise<PaymentProvider> {
    const validation = await this.validateAllProviders()

    for (const provider of this.getSupportedProviders()) {
      if (validation[provider]) {
        return provider
      }
    }

    throw new Error('No payment providers are available')
  }
}

/**
 * Export provider types for TypeScript
 */
export interface IPaymentProvider {
  requestToPay(data: {
    amount: number
    phoneNumber: string
    externalId: string
    description: string
  }): Promise<any>

  getTransactionStatus(referenceId: string): Promise<any>

  transfer(data: {
    amount: number
    phoneNumber: string
    externalId: string
    description: string
  }): Promise<any>

  validateCredentials(): Promise<boolean>
}
