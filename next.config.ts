import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    unoptimized: process.env.IMAGE_UNOPTIMIZED === "true",
  },
};

export default nextConfig;
