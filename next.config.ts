import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Image optimization for SmugMug photos
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'photos.smugmug.com',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Performance optimizations
  experimental: {
    // Enable optimistic client cache
    optimisticClientCache: true,
    // Optimize package imports
    optimizePackageImports: ['fuse.js', 'date-fns', 'lodash-es'],
  },

  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Output configuration for Vercel
  output: 'standalone',
};

export default nextConfig;
