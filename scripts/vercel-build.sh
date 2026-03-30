#!/bin/bash
# ═══════════════════════════════════════════════════════════
# DramaAI - Vercel 构建脚本
# ═══════════════════════════════════════════════════════════
#
# 关键约束：Prisma schema provider=sqlite 只接受 file: URL
# 用户在 Vercel 配的是 TURSO_DATABASE_URL (libsql://...)
#
# 方案：
#   构建时 → 强制 DATABASE_URL=file:/tmp/dummy.db，让 prisma generate 验证通过
#   运行时 → db.ts 通过 adapter 连接 Turso，不依赖 DATABASE_URL
#   表结构 → 用户首次部署前需手动 push 一次（见下方说明）
# ═══════════════════════════════════════════════════════════

set -e

echo "=== DramaAI Build ==="

# ── 1. 覆盖 DATABASE_URL 为合法的 file: URL ──
# 无论 Vercel 环境变量里是什么，构建阶段 Prisma 只需要解析 schema，
# 强制给一个 file: 占位 URL 让验证通过
export DATABASE_URL="file:/tmp/drama-ai.db"
echo "[DB] DATABASE_URL set to file: placeholder for build"

# ── 2. 生成 Prisma 客户端 ──
echo "[Prisma] Generating client..."
npx prisma generate

# ── 3. 构建 Next.js ──
echo "[Next] Building..."
npx next build

echo "=== Build Complete ==="
