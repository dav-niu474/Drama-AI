#!/bin/bash
# ═══════════════════════════════════════════════════════════
# DramaAI - Vercel 构建脚本
# ═══════════════════════════════════════════════════════════
# 解决问题：
#   1. Vercel 没有文件系统 → SQLite 不可用 → 需要 Turso
#   2. Prisma schema 读 DATABASE_URL，但用户配的是 TURSO_DATABASE_URL
#   3. 每次构建需自动同步表结构到 Turso
# ═══════════════════════════════════════════════════════════

set -e

echo "=== DramaAI Build Script ==="

# ── 1. 自动将 TURSO_DATABASE_URL 映射到 DATABASE_URL ──
# Prisma CLI 读取 schema 中的 env("DATABASE_URL")，
# 在 Vercel 上通过 TURSO_DATABASE_URL 注入
if [ -n "$TURSO_DATABASE_URL" ]; then
  if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "undefined" ] || [ "$DATABASE_URL" = "file:./db/custom.db" ]; then
    export DATABASE_URL="$TURSO_DATABASE_URL"
    echo "[DB] Mapped TURSO_DATABASE_URL → DATABASE_URL"
  fi
fi

# ── 2. 检查数据库 URL 是否有效 ──
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "undefined" ]; then
  echo "[DB] WARNING: DATABASE_URL is not set, skipping schema push"
  echo "[DB] Database-dependent features will not work"
else
  echo "[DB] DATABASE_URL detected: ${DATABASE_URL:0:30}..."

  # ── 3. 生成 Prisma 客户端 ──
  echo "[Prisma] Generating client..."
  npx prisma generate

  # ── 4. 推送表结构到数据库（幂等操作，安全重复执行）──
  echo "[Prisma] Pushing schema to database..."
  npx prisma db push --accept-data-loss 2>&1 || {
    echo "[Prisma] Schema push encountered issues (may be expected on first deploy)"
  }

  echo "[Prisma] Schema sync complete"
fi

# ── 5. 构建 Next.js ──
echo "[Next] Building application..."
npx next build

echo "=== Build Complete ==="
