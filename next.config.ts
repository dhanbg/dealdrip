import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.dealdrip.store',
      },
      {
        protocol: 'https',
        hostname: '40a9054b6e43137e50a437d974f3476d.r2.cloudflarestorage.com',
      },
    ],
  },
};

export default nextConfig;
