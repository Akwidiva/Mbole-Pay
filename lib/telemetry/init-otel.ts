import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

let sdk: NodeSDK | null = null

export async function startOpenTelemetry() {
  if (process.env.OTEL_ENABLED !== 'true') return
  if (sdk) return

  sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations()],
  })

  try {
    await sdk.start()
    console.log('OpenTelemetry started')
  } catch (err) {
    console.warn('OpenTelemetry failed to start', err)
  }
}

export async function stopOpenTelemetry() {
  if (!sdk) return
  try {
    await sdk.shutdown()
  } catch (err) {
    console.warn('OpenTelemetry shutdown error', err)
  }
}
