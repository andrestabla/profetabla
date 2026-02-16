import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google Avatars
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }, // GitHub Avatars
      { protocol: 'https', hostname: 'images.unsplash.com' }, // Unsplash (useful for demos)
      { protocol: 'https', hostname: 'plus.unsplash.com' }, // Unsplash Plus
    ],
  },
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/dashboard/professor/challenge/:path*',
        destination: '/dashboard/professor/projects/:path*',
      },
      {
        source: '/dashboard/professor/problem/:path*',
        destination: '/dashboard/professor/projects/:path*',
      },
    ];
  },
};

export default nextConfig;
