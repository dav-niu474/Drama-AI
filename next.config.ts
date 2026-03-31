import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // ── 环境变量兜底 ──
  // Prisma schema 中 env("DATABASE_URL") 在原生引擎层强制校验。
  // 如果 Vercel 上未设置 DATABASE_URL，Next.js 注入 file: 占位值让校验通过。
  // 实际 Turso 连接由 adapter 管理，此值不会被使用。
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "file:/tmp/drama-ai.db",
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || "",
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || "",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.IMAGE_UNOPTIMIZED === 'true',
  },
};

export default nextConfig;
