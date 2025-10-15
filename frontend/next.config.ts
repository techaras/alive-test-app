import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'html.tailus.io',
        pathname: '/blocks/customers/**',
      },
    ],
  },
}

export default nextConfig