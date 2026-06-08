/** @type {import('next').NextConfig} */
const isStandalone = process.env.NEXT_STANDALONE === "true"

const nextConfig = {
  output: isStandalone ? "standalone" : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig