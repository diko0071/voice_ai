/** @type {import('next').NextConfig} */
import type { NextConfig } from 'next'
import type { Configuration as WebpackConfig } from 'webpack'

const nextConfig: NextConfig = {
  serverRuntimeConfig: {
    // Will only be available on the server side
    PROJECT_ROOT: __dirname
  },
  env: {
    // Make these available on both server and client
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
    GOOGLE_AUTH_URI: process.env.GOOGLE_AUTH_URI,
    GOOGLE_TOKEN_URI: process.env.GOOGLE_TOKEN_URI,
    GOOGLE_AUTH_PROVIDER_CERT_URL: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
    GOOGLE_PRESENTATION_ID: process.env.GOOGLE_PRESENTATION_ID
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
