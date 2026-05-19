import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true, // Bug#10 fix: Enable React strict mode for better dev experience
  images: {
    remotePatterns: [
      // Bug#10 fix: Restrict to specific hostname patterns instead of wildcard "**"
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
      { protocol: "https", hostname: "image.cdn.com" },
      { protocol: "https", hostname: "**.vercel.app" },
      { protocol: "https", hostname: "**.turso.io" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "supabase.co" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
    unoptimized: process.env.IMAGE_UNOPTIMIZED === "true",
  },
};

export default nextConfig;
