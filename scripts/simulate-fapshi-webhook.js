/**
 * Simulate a Fapshi webhook to the local dev server.
 * Usage: node scripts/simulate-fapshi-webhook.js --paymentId=<paymentId> --status=COMPLETED
 * Reads FAPSHI_WEBHOOK_SECRET from environment to sign the payload (optional).
 */
const http = require('http')
const https = require('https')
const crypto = require('crypto')
const url = require('url')

function signPayload(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

async function postWebhook(targetUrl, payload, signature) {
  const parsed = url.parse(targetUrl)
  const client = parsed.protocol === 'https:' ? https : http

  const body = JSON.stringify(payload)
  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      ...(signature ? { 'x-fapshi-signature': signature } : {}),
    },
  }

  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  const args = process.argv.slice(2)
  const params = {}
  for (const a of args) {
    const [k, v] = a.replace(/^--/, '').split('=')
    params[k] = v
  }

  if (!params.paymentId) {
    console.error('Missing --paymentId')
    process.exit(1)
  }

  const status = params.status || 'COMPLETED'
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const webhookUrl = params.url || `${base}/api/payments/webhook`

  const payload = {
    source: 'fapshi',
    external_id: params.paymentId,
    payment_id: `fapshi-${params.paymentId}`,
    status: status,
    amount: params.amount ? Number(params.amount) : 1000,
    currency: 'XAF',
    phoneNumber: params.phone || '+237691234567',
    timestamp: new Date().toISOString(),
  }

  const secret = process.env.FAPSHI_WEBHOOK_SECRET || ''
  const signature = secret ? signPayload(secret, JSON.stringify(payload)) : null

  console.log('Posting webhook to', webhookUrl)
  const res = await postWebhook(webhookUrl, payload, signature)
  console.log('Response:', res.status)
  console.log(res.body)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
