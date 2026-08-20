import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lively-product-launch.lovable.app",
      },
    ],
  },
};

export default nextConfig;
