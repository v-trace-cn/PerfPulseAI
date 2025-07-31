

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
        source: '/api/notifications/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:5000'}/api/notifications/:path*`,
      },
      {
        source: '/api/users/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:5000'}/api/users/:path*`,
      },
      {
        source: '/api/companies/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:5000'}/api/companies/:path*`,
      },
      {
        source: '/api/departments/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:5000'}/api/departments/:path*`,
      },
      {
        source: '/api/activities/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:5000'}/api/activities/:path*`,
      },
      {
        source: '/api/points/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:5000'}/api/points/:path*`,
      },
      {
        source: '/api/pr/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:5000'}/api/pr/:path*`,
      },
    ];
  },
}

export default nextConfig
