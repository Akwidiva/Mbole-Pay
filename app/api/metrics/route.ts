import { NextResponse } from 'next/server'
import client from 'prom-client'

// Collect default metrics
const collectDefault = true
if (collectDefault) {
  try {
    client.collectDefaultMetrics({ timeout: 5000 })
  } catch (e) {
    // ignore if already registered
  }
}

export async function GET() {
  try {
    const metrics = await client.register.metrics()
    return new NextResponse(metrics, {
      status: 200,
      headers: { 'Content-Type': client.register.contentType }
    })
  } catch (err) {
    return new NextResponse('error collecting metrics', { status: 500 })
  }
}

export const runtime = 'nodejs'
