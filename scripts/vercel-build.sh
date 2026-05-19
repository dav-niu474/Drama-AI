#!/bin/bash
set -e

echo "=== DramaAI Build ==="

# ── 核心：替换 schema 中的 DATABASE_URL 引用为硬编码 file: URL ──
# Prisma 原生引擎在模块加载时校验 schema URL，时机早于任何 JS 代码。
# env("DATABASE_URL") 在运行时读 process.env，Vercel 上可能是 "undefined"。
# 硬编码后，生成的客户端内嵌合法 file: URL，校验必定通过。
# 实际数据库连接由 db.ts 的 adapter 管理，硬编码值不会被使用。
sed -i 's|url *= *env("DATABASE_URL")|url = "file:/tmp/drama-ai.db"|' prisma/schema.prisma
echo "[Schema] Patched to hardcoded file: URL"

echo "[Prisma] Generating client..."
npx prisma generate

echo "[Next] Building..."
npx next build

echo "=== Build Complete ==="
