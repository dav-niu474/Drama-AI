import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    // 允许所有远程图片（AI 生成的视频封面等）
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // 本地开发时可开启，Vercel 部署时自动禁用
    unoptimized: process.env.IMAGE_UNOPTIMIZED === 'true',
  },
};

export default nextConfig;
