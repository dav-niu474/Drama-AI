import type { NextConfig } from "next";

/**
 * 环境变量预处理
 *
 * Vercel 上 DATABASE_URL 可能是字面量字符串 "undefined"，不是真正的 undefined。
 * "undefined" 是 truthy 的，所以 || 回退不会触发！必须显式判断。
 */
const rawDbUrl = process.env.DATABASE_URL;
const safeDbUrl = (!rawDbUrl || rawDbUrl === "undefined")
  ? "file:/tmp/drama-ai.db"
  : rawDbUrl;

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  env: {
    DATABASE_URL: safeDbUrl,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || "",
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || "",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: process.env.IMAGE_UNOPTIMIZED === "true",
  },
};

export default nextConfig;
