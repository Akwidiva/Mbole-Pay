let sdk: any | null = null

export async function startOpenTelemetry() {
  if (process.env.OTEL_ENABLED !== 'true') return
  if (sdk) return

  process.env.OTEL_TRACES_EXPORTER ||= 'otlp'
  process.env.OTEL_EXPORTER_OTLP_PROTOCOL ||= 'http/protobuf'
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||= 'http://localhost:4318'

  const [{ NodeSDK }, { getNodeAutoInstrumentations }] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/auto-instrumentations-node'),
  ])

  const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http')

  sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations()],
    traceExporter: new OTLPTraceExporter({
      url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'}/v1/traces`,
    }),
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
