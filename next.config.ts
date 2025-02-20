/** @type {import('next').NextConfig} */
import type { NextConfig } from 'next'
import type { Configuration as WebpackConfig } from 'webpack'

const nextConfig: NextConfig = {
  serverRuntimeConfig: {
    // Will only be available on the server side
    PROJECT_ROOT: __dirname
  },
  webpack: (config: WebpackConfig, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client side
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...(config.resolve?.fallback || {}),
          fs: false,
          path: false
        }
      }
    }
    return config
  }
}

export default nextConfig;
