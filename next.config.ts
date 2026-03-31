import type { NextConfig } from "next";

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
  // ── 环境变量 ──
  // 只内联 DATABASE_URL 兜底值（Prisma schema 校验需要，构建时确定即可）
  // TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 绝对不能放在这里！
  // 否则 Next.js standalone 模式会把构建时的值内联到 bundle，运行时永远
  // 读不到 Vercel 环境变量面板中设置的值。
  env: {
    DATABASE_URL: safeDbUrl,
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
