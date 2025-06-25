/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: './',
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  experimental: {
  },
  distDir: 'out'
}

module.exports = nextConfig 