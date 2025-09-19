

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:5000'}/api/health`,
      },
    ];
  },
}

export default nextConfig
