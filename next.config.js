/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'data.stad.gent',
      },
      {
        protocol: 'https',
        hostname: 'vanherteryck.be',
      },
      {
        protocol: 'https',
        hostname: '**.stad.gent',
      },
    ],
  },
}

module.exports = nextConfig
