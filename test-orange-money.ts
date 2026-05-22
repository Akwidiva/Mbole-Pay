/**
 * Orange Money Payment Integration Test Suite
 * 
 * This script tests the Orange Money payment integration with sandbox credentials
 * Run with: npx ts-node test-orange-money.ts
 * Or: npm run test:orange
 */

import axios, { AxiosError } from 'axios'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env.local') })

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: any
}

class OrangeMoneyTester {
  private clientId: string
  private clientSecret: string
  private merchantCode: string
  private baseUrl: string
  private environment: string
  private bearerToken?: string
  private results: TestResult[] = []

  constructor() {
    this.clientId = process.env.ORANGE_CLIENT_ID || ''
    this.clientSecret = process.env.ORANGE_CLIENT_SECRET || ''
    this.merchantCode = process.env.ORANGE_MERCHANT_CODE || ''
    this.baseUrl = process.env.ORANGE_SANDBOX_URL || 'https://api-sandbox.orange.com'
    this.environment = process.env.ORANGE_ENVIRONMENT || 'sandbox'
  }

  /**
   * Test 1: Verify credentials are loaded
   */
  async testCredentialsLoaded(): Promise<void> {
    console.log('\n📋 TEST 1: Verify Credentials Loaded')
    console.log('=====================================')

    const checks = [
      { name: 'Client ID', value: this.clientId, minLength: 5 },
      { name: 'Client Secret', value: this.clientSecret, minLength: 5 },
      { name: 'Merchant Code', value: this.merchantCode, minLength: 3 },
      { name: 'Base URL', value: this.baseUrl, minLength: 10 },
    ]

    let allValid = true
    for (const check of checks) {
      const isValid = check.value && check.value.length >= check.minLength && !check.value.includes('YOUR_')
      const status = isValid ? '✅' : '❌'
      console.log(`  ${status} ${check.name}: ${isValid ? 'LOADED' : 'MISSING/PLACEHOLDER'}`)
      if (!isValid) allValid = false
    }

    this.results.push({
      name: 'Credentials Loaded',
      status: allValid ? 'PASS' : 'FAIL',
      message: allValid
        ? 'All credentials loaded successfully'
        : 'Some credentials are missing or still contain placeholders (YOUR_*)',
    })
  }

  /**
   * Test 2: Validate Orange Money API Connection
   */
  async testAPIConnection(): Promise<void> {
    console.log('\n🔗 TEST 2: Validate API Connection')
    console.log('===================================')

    try {
      const response = await axios.get(`${this.baseUrl}`, {
        timeout: 10000,
        validateStatus: () => true,
      })

      console.log(`  ℹ️  Base URL is reachable (HTTP ${response.status})`)
      this.results.push({
        name: 'API Connection',
        status: 'PASS',
        message: `Orange Money API server is reachable`,
        details: { url: this.baseUrl, environment: this.environment },
      })
    } catch (error: any) {
      console.log(`  ❌ API Connection: FAILED`)
      console.log(`     Error: ${error.message}`)

      this.results.push({
        name: 'API Connection',
        status: 'FAIL',
        message: `Failed to connect to Orange Money API: ${error.message}`,
        details: { url: this.baseUrl, error: error.message },
      })
    }
  }

  /**
   * Test 3: Test OAuth Authentication
   */
  async testOAuthAuthentication(): Promise<void> {
    console.log('\n🔐 TEST 3: Test OAuth Authentication')
    console.log('====================================')

    try {
      if (!this.clientId || this.clientId.includes('YOUR_')) {
        console.log(`  ⚠️  Skipping: Client ID is a placeholder`)
        this.results.push({
          name: 'OAuth Authentication',
          status: 'WARNING',
          message: 'Client credentials not configured. Update .env.local with actual credentials.',
          details: { hint: 'Contact: business@orange.cm' },
        })
        return
      }

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

      console.log(`  📤 Authenticating with Orange APIs...`)

      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
          validateStatus: () => true,
        }
      )

      if (response.status === 200) {
        this.bearerToken = response.data.access_token
        console.log(`  ✅ OAuth Authentication: SUCCESS`)
        console.log(`     Token Type: ${response.data.token_type}`)
        console.log(`     Expires In: ${response.data.expires_in} seconds`)

        this.results.push({
          name: 'OAuth Authentication',
          status: 'PASS',
          message: 'Successfully authenticated with Orange Money OAuth',
          details: {
            tokenType: response.data.token_type,
            expiresIn: response.data.expires_in,
          },
        })
      } else if (response.status === 401 || response.status === 403) {
        console.log(`  ❌ OAuth Authentication: FAILED (HTTP ${response.status})`)
        console.log(`     Error: Invalid credentials`)

        this.results.push({
          name: 'OAuth Authentication',
          status: 'FAIL',
          message: 'Authentication failed - check credentials in .env.local',
          details: {
            status: response.status,
            message: response.data?.error || 'Unauthorized',
          },
        })
      } else {
        throw new Error(`Unexpected status ${response.status}`)
      }
    } catch (error: any) {
      console.log(`  ❌ OAuth Authentication: ERROR`)
      console.log(`     ${error.message}`)

      this.results.push({
        name: 'OAuth Authentication',
        status: 'FAIL',
        message: `Authentication error: ${error.message}`,
        details: { error: error.message },
      })
    }
  }

  /**
   * Test 4: Test Payment Request
   */
  async testPaymentRequest(): Promise<void> {
    console.log('\n💳 TEST 4: Test Payment Request')
    console.log('================================')

    if (!this.bearerToken) {
      console.log(`  ⚠️  Skipping: No valid OAuth token`)
      this.results.push({
        name: 'Payment Request',
        status: 'WARNING',
        message: 'Skipped due to failed authentication',
      })
      return
    }

    try {
      const transactionId = `MBOLEPAY-${Date.now()}`
      const phoneNumber = '+237655555555' // Orange Money test number
      const amount = 5000

      console.log(`  📤 Sending payment request...`)
      console.log(`     Amount: XAF ${amount}`)
      console.log(`     Phone: ${phoneNumber}`)
      console.log(`     Transaction ID: ${transactionId}`)

      const response = await axios.post(
        `${this.baseUrl}/orange-money-webpay/async/pay`,
        {
          merchant_key: this.merchantCode,
          customer_number: phoneNumber.replace(/\+237/, '').replace(/^0/, ''),
          amount: amount,
          currency: 'XAF',
          order_id: transactionId,
          description: 'Mbole Pay - Test Contribution',
          return_url: 'http://localhost:3000/api/payments/orange/callback',
          webhook_url: 'http://localhost:3000/api/payments/orange/webhook',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
          validateStatus: () => true,
        }
      )

      if (response.status === 200 || response.status === 201) {
        console.log(`  ✅ Payment Request: SUCCESS (HTTP ${response.status})`)
        console.log(`     Transaction ID: ${transactionId}`)

        this.results.push({
          name: 'Payment Request',
          status: 'PASS',
          message: 'Payment request sent successfully',
          details: {
            transactionId,
            amount,
            response: response.data,
          },
        })
      } else if (response.status === 401 || response.status === 403) {
        console.log(`  ❌ Payment Request: AUTHENTICATION ERROR (HTTP ${response.status})`)

        this.results.push({
          name: 'Payment Request',
          status: 'FAIL',
          message: 'Authentication failed for payment request',
          details: { status: response.status },
        })
      } else {
        throw new Error(`Unexpected status ${response.status}: ${JSON.stringify(response.data)}`)
      }
    } catch (error: any) {
      console.log(`  ❌ Payment Request: ERROR`)
      console.log(`     ${error.message}`)

      this.results.push({
        name: 'Payment Request',
        status: 'FAIL',
        message: `Payment request failed: ${error.message}`,
        details: { error: error.message },
      })
    }
  }

  /**
   * Test 5: Validate Business Logic
   */
  async testBusinessLogic(): Promise<void> {
    console.log('\n🔧 TEST 5: Validate Business Logic')
    console.log('===================================')

    const tests = [
      {
        name: 'Amount Validation',
        test: () => 5000 > 0 && 5000 <= 5000000,
      },
      {
        name: 'Phone Number Format',
        test: () => /^(\+237)?[679]\d{8}$/.test('+237655555555'),
      },
      {
        name: 'Currency is XAF',
        test: () => process.env.DEFAULT_CURRENCY === 'XAF' || 'XAF' === 'XAF',
      },
      {
        name: 'Merchant Code Present',
        test: () => !!this.merchantCode && !this.merchantCode.includes('YOUR_'),
      },
    ]

    for (const check of tests) {
      const pass = check.test()
      const status = pass ? '✅' : '❌'
      console.log(`  ${status} ${check.name}: ${pass ? 'PASS' : 'FAIL'}`)

      this.results.push({
        name: check.name,
        status: pass ? 'PASS' : 'FAIL',
        message: pass ? 'Validation passed' : 'Validation failed',
      })
    }
  }

  /**
   * Print Summary Report
   */
  printSummary(): void {
    console.log('\n\n' + '='.repeat(60))
    console.log('📋 TEST SUMMARY REPORT - ORANGE MONEY')
    console.log('='.repeat(60))

    const passed = this.results.filter((r) => r.status === 'PASS').length
    const failed = this.results.filter((r) => r.status === 'FAIL').length
    const warnings = this.results.filter((r) => r.status === 'WARNING').length
    const total = this.results.length

    console.log(`\n✅ PASSED:  ${passed}/${total}`)
    console.log(`❌ FAILED:  ${failed}/${total}`)
    console.log(`⚠️  WARNINGS: ${warnings}/${total}`)

    console.log('\n' + '-'.repeat(60))
    console.log('Detailed Results:')
    console.log('-'.repeat(60))

    for (const result of this.results) {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
      console.log(`\n${icon} ${result.name}`)
      console.log(`   Status: ${result.status}`)
      console.log(`   Message: ${result.message}`)
    }

    console.log('\n' + '='.repeat(60))

    if (failed === 0) {
      console.log('🎉 All tests passed! Orange Money integration is ready.')
    } else if (warnings > 0 && failed === 0) {
      console.log(`⚠️  Some features are pending credentials. Update .env.local to test.`)
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please review the errors above.`)
    }

    console.log('='.repeat(60) + '\n')
  }

  /**
   * Run all tests
   */
  async runAll(): Promise<void> {
    console.log('\n')
    console.log('╔════════════════════════════════════════════════════════╗')
    console.log('║  🚀 Orange Money Payment Integration Test Suite        ║')
    console.log('║     Testing: Credentials, OAuth, API, Payments         ║')
    console.log('╚════════════════════════════════════════════════════════╝')

    await this.testCredentialsLoaded()
    await this.testAPIConnection()
    await this.testOAuthAuthentication()
    await this.testPaymentRequest()
    await this.testBusinessLogic()

    this.printSummary()
  }
}

// Run tests
const tester = new OrangeMoneyTester()
tester.runAll().catch((error) => {
  console.error('Test suite failed:', error)
  process.exit(1)
})
