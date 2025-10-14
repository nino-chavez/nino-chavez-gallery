import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'photos.smugmug.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
