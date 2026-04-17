/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/github', destination: 'https://github.com/concaption/cold-md', permanent: false },
      { source: '/spec', destination: 'https://github.com/concaption/cold-md/blob/main/spec/cold-md-v0.md', permanent: false },
    ]
  },
  async rewrites() {
    return [
      { source: '/install', destination: '/install.sh' },
    ]
  },
}

module.exports = nextConfig
