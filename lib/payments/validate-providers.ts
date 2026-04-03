/**
 * Payment Provider Validation Script
 * Run: npx ts-node lib/payments/validate-providers.ts
 *
 * This script validates that all payment provider credentials are
 * correctly configured before starting the application.
 */

import { PaymentFactory } from './payment-factory'

async function validatePaymentProviders() {
  console.log('🔍 Validating Payment Providers...\n')

  try {
    const validation = await PaymentFactory.validateAllProviders()

    console.log('📊 Validation Results:\n')

    let allValid = true

    for (const [provider, isValid] of Object.entries(validation)) {
      const status = isValid ? '✅' : '❌'
      const displayName = PaymentFactory.getProviderDisplayName(
        provider as any
      )
      console.log(`${status} ${displayName}: ${isValid ? 'Valid' : 'Invalid'}`)

      if (!isValid) {
        allValid = false
      }
    }

    console.log('\n' + '='.repeat(50))

    if (allValid) {
      console.log('✅ All payment providers are configured correctly!')
      console.log('Ready to accept payments.\n')
      process.exit(0)
    } else {
      console.log('⚠️  Some payment providers are not properly configured.')
      console.log('Please check your .env.local file and update credentials.\n')
      console.log('Configuration Guide:')
      console.log('1. See .env.local.template for required fields')
      console.log('2. MTN MoMo: https://momodeveloper.mtn.com/')
      console.log('3. Orange Money: Contact business@orange.cm')
      console.log('\n')
      process.exit(1)
    }
  } catch (error: any) {
    console.error('❌ Error during validation:', error.message)
    console.error('\nMake sure:')
    console.error('1. .env.local file exists')
    console.error('2. All required credentials are set')
    console.error('3. Node environment variables are loaded\n')
    process.exit(1)
  }
}

// Run validation
validatePaymentProviders()
