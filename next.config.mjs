/** @type {import('next').NextConfig} */
const isStandalone = process.env.NEXT_STANDALONE === "true"

const securityHeaders = [
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // unsafe-eval required by Next.js dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://gateway.pinata.cloud",
      "font-src 'self'",
      "connect-src 'self' https://live.fapshi.com https://polygon-amoy.g.alchemy.com https://oriented-wombat-127075.upstash.io",
      "frame-ancestors 'none'",
    ].join("; "),
  },
]

const nextConfig = {
  output: isStandalone ? "standalone" : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
